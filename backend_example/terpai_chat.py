#!/usr/bin/env python3
"""
Talk to TerpAI from the terminal (same API as the website).

What you need (from DevTools / your session):
  TERPAI_BEARER       — JWT from Authorization: Bearer (Nebula/Entra; expires)
  TERPAI_CONVERSATION_ID — UUID in the URL .../chat/<gptSystemId>/<THIS>/...

Optional:
  TERPAI_PARENT_SEGMENT_ID — UUID of the segment to reply under (see below)
  TERPAI_BASE_URL       — default https://terpai.umd.edu

The HAR shows the browser sends **no** Bearer in the captured headers (often redacted);
your JWT still works for programmatic calls if the API accepts it.

**Segment chain:** Each POST uses lineage.parentSegmentId = the segment you are
continuing from. After the assistant replies, the stream sends
`event: conversation-and-segment-id` with a **new ConversationSegmentId** — use that
as the parent for your **next** question. The script updates this automatically in REPL
mode.

**Cosmos headers:** Responses may include `event: cosmos-db-session-tokens` with
base64-encoded JSON of x-cosmos-session-* headers; the script forwards them on the
next request (matches browser behavior).

**Token expiry:** JWT `exp` is typically short (often ~30–90 minutes for access tokens).
When requests fail with 401, paste a fresh Bearer from the site (Application → Storage
or Network request copy). There is no refresh in this script.

Usage:
  export TERPAI_BEARER='...'
  export TERPAI_CONVERSATION_ID='...'
  export TERPAI_PARENT_SEGMENT_ID='...'   # optional if continuing a thread
  python terpai_chat.py                    # interactive REPL
  python terpai_chat.py "What can you do?" # one-shot

Env files (optional, avoids parsing errors from multiline `SYSTEM_PROMPT` in backend/.env):
  - backend_example/.env.terpai   (same folder as this script)
  - backend/.env.terpai
  Copy from .env.terpai.example and fill in TERPAI_* only.

SSL on macOS: if you see CERTIFICATE_VERIFY_FAILED, either run Python's
  "Install Certificates.command" (from the Python folder), or set
  TERPAI_SSL_VERIFY=0 (insecure; dev only).

  pip install python-dotenv certifi   # certifi helps SSL on some setups
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from pathlib import Path
from typing import Any

import requests

_HERE = Path(__file__).resolve().parent
_BACKEND = _HERE.parent / "backend"


def _load_terpai_env() -> None:
    """Load only TerpAI keys from a small file — do NOT load backend/.env (multiline breaks dotenv)."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    for p in (_HERE / ".env.terpai", _BACKEND / ".env.terpai"):
        if p.is_file():
            load_dotenv(p)
            return


_load_terpai_env()


def _ssl_verify_arg():
    """What to pass to requests as `verify=`."""
    flag = (os.getenv("TERPAI_SSL_VERIFY") or "1").strip().lower()
    if flag in ("0", "false", "no", "off"):
        import urllib3

        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        return False
    try:
        import certifi

        return certifi.where()
    except ImportError:
        return True

DEFAULT_BASE = "https://terpai.umd.edu"
SEGMENTS_TMPL = "/api/internal/userConversations/{cid}/segments"


def _b64decode(s: str) -> str:
    s = (s or "").strip()
    if not s:
        return ""
    try:
        return base64.b64decode(s, validate=True).decode("utf-8")
    except Exception:
        return ""


def _iter_sse_events(raw: str):
    """Yield (event_name, data) for each SSE data line (matches HAR: event + data pairs)."""
    event_name = ""
    for line in raw.splitlines():
        line = line.rstrip("\r")
        if line.startswith("event:"):
            event_name = line[6:].strip()
        elif line.startswith("data:"):
            yield event_name, line[5:].lstrip()


def stream_chat(
    question: str,
    *,
    bearer: str,
    conversation_id: str,
    parent_segment_id: str,
    base_url: str,
    cosmos_headers: dict[str, str] | None = None,
    timeout: float = 180.0,
    verify: bool | str = True,
) -> tuple[str, str | None, dict[str, str]]:
    """
    POST one question; return (assistant_text, new_assistant_segment_id, next_cosmos_headers).
    """
    url = f"{base_url.rstrip('/')}{SEGMENTS_TMPL.format(cid=conversation_id)}"
    headers = {
        "Authorization": f"Bearer {bearer}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Origin": base_url.rstrip("/"),
        "x-timezone": os.getenv("TERPAI_TIMEZONE", "America/New_York"),
    }
    if cosmos_headers:
        for k, v in cosmos_headers.items():
            headers[k] = v

    payload = {
        "question": question,
        "visionImageIds": [],
        "attachmentIds": [],
        "segmentTraceLogLevel": "NonPersisted",
        "lineage": {"parentSegmentId": parent_segment_id, "lineageType": "Question"},
    }

    text_parts: list[str] = []
    new_segment: str | None = None
    next_cosmos: dict[str, str] = dict(cosmos_headers or {})

    with requests.post(
        url,
        headers=headers,
        json=payload,
        stream=True,
        timeout=timeout,
        verify=verify,
    ) as resp:
        resp.raise_for_status()
        raw = resp.text

    raw = raw.replace("\r\n", "\n")

    # Structured SSE (event: / data:) — matches browser HAR
    if "event:" in raw:
        for event_name, data in _iter_sse_events(raw):
            if event_name == "conversation-and-segment-id":
                try:
                    j = json.loads(_b64decode(data))
                    new_segment = j.get("ConversationSegmentId") or j.get("conversationSegmentId")
                except json.JSONDecodeError:
                    pass
            elif event_name == "response-updated":
                piece = _b64decode(data)
                if piece:
                    text_parts.append(piece)
            elif event_name == "cosmos-db-session-tokens":
                try:
                    arr = json.loads(_b64decode(data))
                    if isinstance(arr, list):
                        for item in arr:
                            if isinstance(item, dict) and item.get("Name") and item.get("Value"):
                                next_cosmos[str(item["Name"])] = str(item["Value"])
                except json.JSONDecodeError:
                    pass
    else:
        # Fallback: line-oriented `data:` only (older terpai_test style)
        for line in raw.split("\n"):
            line = line.strip()
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            try:
                decoded = base64.b64decode(data, validate=True).decode("utf-8")
            except Exception:
                decoded = data
            try:
                obj = json.loads(decoded)
                if isinstance(obj, dict):
                    sid = obj.get("ConversationSegmentId") or obj.get("conversationSegmentId")
                    if isinstance(sid, str):
                        new_segment = sid
            except json.JSONDecodeError:
                if decoded and not decoded.startswith("{"):
                    text_parts.append(decoded)

    return "".join(text_parts).strip(), new_segment, next_cosmos


def main() -> None:
    ap = argparse.ArgumentParser(description="CLI for TerpAI segments API")
    ap.add_argument("question", nargs="*", help="Question (omit for REPL)")
    ap.add_argument("--parent", help="Override TERPAI_PARENT_SEGMENT_ID")
    args = ap.parse_args()

    bearer = (os.getenv("TERPAI_BEARER") or "").strip()
    cid = (os.getenv("TERPAI_CONVERSATION_ID") or "").strip()
    parent = (args.parent or os.getenv("TERPAI_PARENT_SEGMENT_ID") or "").strip()
    base = (os.getenv("TERPAI_BASE_URL") or DEFAULT_BASE).rstrip("/")

    if not bearer or not cid:
        print(
            "Set TERPAI_BEARER and TERPAI_CONVERSATION_ID (see docstring).",
            file=sys.stderr,
        )
        sys.exit(1)
    if not parent:
        print(
            "Set TERPAI_PARENT_SEGMENT_ID to the segment you want to reply under "
            "(last assistant segment id from DevTools, or first question segment).",
            file=sys.stderr,
        )
        sys.exit(1)

    cosmos: dict[str, str] = {}
    verify = _ssl_verify_arg()

    def run_one(q: str) -> None:
        nonlocal parent, cosmos
        print("\n[Thinking…]\n", flush=True)
        try:
            reply, new_seg, cosmos = stream_chat(
                q,
                bearer=bearer,
                conversation_id=cid,
                parent_segment_id=parent,
                base_url=base,
                cosmos_headers=cosmos or None,
                verify=verify,
            )
        except requests.HTTPError as e:
            print(f"HTTP {e.response.status_code}: {e.response.text[:500]}", file=sys.stderr)
            if e.response.status_code == 401:
                print("Bearer likely expired — paste a new JWT into TERPAI_BEARER.", file=sys.stderr)
            sys.exit(1)
        except requests.RequestException as e:
            print(str(e), file=sys.stderr)
            sys.exit(1)

        print(reply)
        if new_seg:
            parent = new_seg
            print(f"\n[Next parent segment id: {parent}]", flush=True)
        else:
            print(
                "\n[Warning: could not parse new segment id from stream; set TERPAI_PARENT_SEGMENT_ID manually.]",
                file=sys.stderr,
            )

    if args.question:
        run_one(" ".join(args.question))
        return

    print("TerpAI REPL — empty line to exit. Parent segment updates after each reply.\n")
    while True:
        try:
            q = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not q:
            break
        run_one(q)


if __name__ == "__main__":
    main()
