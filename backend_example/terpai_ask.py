#!/usr/bin/env python3
"""
Ask TerpAI one question using a HAR export + a Bearer token.

What the HAR gives you (automatic):
  - conversationId from POST .../userConversations/{id}/segments
  - parentSegmentId = last assistant segment from SSE (conversation-and-segment-id),
    so your next message chains like the website.

What the HAR usually does NOT contain (Chrome redacts Authorization):
  - JWT — you must supply once via --token, TERPAI_BEARER, or a one-line file
    backend_example/.terpai_bearer

SSL: uses certifi CA bundle by default. Use --insecure-ssl only if you must.

  python terpai_ask.py "Your question here"
  python terpai_ask.py "Hi" --har ./my.har --token 'eyJ...'
  echo 'eyJ...' > .terpai_bearer && python terpai_ask.py "Hi"
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import requests

from terpai_chat import (
    DEFAULT_BASE,
    _b64decode,
    _iter_sse_events,
    _ssl_verify_arg,
    stream_chat,
)


def parse_har_for_terpai(har_path: Path) -> dict[str, str | None]:
    """
    Extract conversation_id and parent_segment_id (latest assistant) from a TerpAI HAR.

    Returns keys: conversation_id, parent_segment_id (may be None if parse fails).
    """
    raw = har_path.read_text(encoding="utf-8")
    data = json.loads(raw)
    entries = data.get("log", {}).get("entries", [])

    conv_id: str | None = None
    assistant_segment_ids: list[str] = []

    seg_re = re.compile(
        r"https?://[^/]+/api/internal/userConversations/([0-9a-f-]{36})/segments",
        re.I,
    )

    for e in entries:
        req = e.get("request") or {}
        url = req.get("url") or ""
        m = seg_re.search(url)
        if not m:
            continue
        conv_id = m.group(1)

        resp = e.get("response") or {}
        content = resp.get("content") or {}
        text = content.get("text")
        if not isinstance(text, str) or "conversation-and-segment-id" not in text:
            continue
        blob = text.replace("\r\n", "\n")
        for event_name, payload in _iter_sse_events(blob):
            if event_name != "conversation-and-segment-id":
                continue
            try:
                j = json.loads(_b64decode(payload))
                sid = j.get("ConversationSegmentId") or j.get("conversationSegmentId")
                if isinstance(sid, str) and sid.strip():
                    assistant_segment_ids.append(sid.strip())
            except (json.JSONDecodeError, TypeError):
                continue

    parent = assistant_segment_ids[-1] if assistant_segment_ids else None
    if parent is None:
        # Fallback: last POST body parentSegmentId (first user message in thread)
        for e in reversed(entries):
            req = e.get("request") or {}
            if not seg_re.search(req.get("url") or ""):
                continue
            pd = req.get("postData") or {}
            if pd.get("mimeType") != "application/json":
                continue
            try:
                body = json.loads(pd.get("text") or "{}")
                lineage = body.get("lineage") or {}
                pid = lineage.get("parentSegmentId")
                if isinstance(pid, str) and pid.strip():
                    parent = pid.strip()
                    break
            except json.JSONDecodeError:
                continue

    return {
        "conversation_id": conv_id,
        "parent_segment_id": parent,
    }


def resolve_bearer(args: argparse.Namespace) -> str:
    if getattr(args, "token", None):
        return args.token.strip()
    tf = getattr(args, "token_file", None)
    if tf:
        p = Path(tf).expanduser()
        return p.read_text(encoding="utf-8").strip()
    env = (os.getenv("TERPAI_BEARER") or "").strip()
    if env:
        return env
    p = _HERE / ".terpai_bearer"
    if p.is_file():
        return p.read_text(encoding="utf-8").strip()
    return ""


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Ask TerpAI using HAR (ids) + Bearer JWT",
    )
    ap.add_argument(
        "question",
        nargs="+",
        help="Question to send",
    )
    ap.add_argument(
        "--har",
        type=Path,
        default=_HERE / "terpai.umd.edu_v2.har",
        help="Path to HAR export (default: ./terpai.umd.edu_v2.har)",
    )
    ap.add_argument(
        "--token",
        help="Bearer JWT (not stored in HAR; paste from DevTools Network → request headers)",
    )
    ap.add_argument(
        "--token-file",
        type=Path,
        help="File with JWT on one line (or use .terpai_bearer next to this script)",
    )
    ap.add_argument(
        "--conversation-id",
        help="Override conversation UUID from HAR",
    )
    ap.add_argument(
        "--parent-segment",
        help="Override parent segment UUID from HAR",
    )
    ap.add_argument(
        "--base-url",
        default=os.getenv("TERPAI_BASE_URL") or DEFAULT_BASE,
        help="API base (default TerpAI prod)",
    )
    ap.add_argument(
        "--insecure-ssl",
        action="store_true",
        help="Disable TLS verification (dev only; fixes some macOS Python CA issues)",
    )
    args = ap.parse_args()

    har_path = args.har.expanduser()
    if not har_path.is_file():
        print(f"HAR not found: {har_path}", file=sys.stderr)
        sys.exit(1)

    info = parse_har_for_terpai(har_path)
    cid = (args.conversation_id or info.get("conversation_id") or "").strip()
    parent = (args.parent_segment or info.get("parent_segment_id") or "").strip()
    bearer = resolve_bearer(args)

    if not cid:
        print(
            "Could not find conversation id in HAR (expected POST .../userConversations/{uuid}/segments).",
            file=sys.stderr,
        )
        sys.exit(1)
    if not parent:
        print(
            "Could not find parent segment id in HAR. Export a HAR that includes "
            "at least one completed /segments response, or pass --parent-segment.",
            file=sys.stderr,
        )
        sys.exit(1)
    if not bearer:
        print(
            "No Bearer JWT. The HAR almost never includes it (browser redacts).\n"
            "  • python terpai_ask.py \"...\" --token 'eyJ...'\n"
            "  • or: echo 'eyJ...' > backend_example/.terpai_bearer\n"
            "  • or: export TERPAI_BEARER='eyJ...'",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.insecure_ssl:
        os.environ["TERPAI_SSL_VERIFY"] = "0"
    verify = _ssl_verify_arg()

    q = " ".join(args.question)
    base = (args.base_url or DEFAULT_BASE).rstrip("/")

    try:
        reply, new_seg, _cosmos = stream_chat(
            q,
            bearer=bearer,
            conversation_id=cid,
            parent_segment_id=parent,
            base_url=base,
            cosmos_headers=None,
            verify=verify,
        )
    except requests.HTTPError as e:
        print(f"HTTP {e.response.status_code}: {(e.response.text or '')[:600]}", file=sys.stderr)
        if e.response.status_code == 401:
            print("JWT rejected or expired — paste a fresh Bearer from the site.", file=sys.stderr)
        sys.exit(1)
    except requests.RequestException as e:
        print(str(e), file=sys.stderr)
        if "CERTIFICATE_VERIFY_FAILED" in str(e):
            print(
                "\nTip: run Python's Install Certificates.command, or: pip install --upgrade certifi\n"
                "     or retry with --insecure-ssl (not for production).",
                file=sys.stderr,
            )
        sys.exit(1)

    print(reply)
    if new_seg:
        print(f"\n# Next parent segment (for follow-ups): {new_seg}", file=sys.stderr)


if __name__ == "__main__":
    main()
