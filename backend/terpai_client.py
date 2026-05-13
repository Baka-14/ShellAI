"""
UMD TerpAI (Nebula) internal segments API — same flow as terpai_test.py.

`compute_terpai_scheduling_summary` returns a :class:`TerpaiSchedulingResult` (not merged into Jupiterp).
When wired in FastAPI, POST /getCourses can expose it as ``terpai_scheduling`` next to ``courses``.

**Environment** (optional; if missing, ``skipped`` is set on the result):

- ``TERPAI_BEARER`` — JWT without the ``Bearer `` prefix
- ``TERPAI_CONVERSATION_ID`` — conversation UUID in the URL path
- ``TERPAI_PARENT_SEGMENT_ID`` — parent segment for Question lineage
- ``TERPAI_BASE_URL`` — optional override (default ``https://terpai.umd.edu``)

**Input shape** for ``compute_terpai_scheduling_summary(jupiterp_response, preferences=None)``:

- ``jupiterp_response["ok"]`` must be truthy or the call is skipped.
- ``jupiterp_response["course_details"]`` should be a list of course dicts (see ``MINIMAL_JUPITERP_FIXTURE``).

**CLI** (from ``backend/``): ``python terpai_client.py check|dry-run|live``

Bearer tokens expire; rotate manually until the platform exposes a server-side token flow.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
from pathlib import Path
from typing import Any, TypedDict

import requests

_DEFAULT_BASE = "https://terpai.umd.edu"
_SEGMENTS_PATH = "/api/internal/userConversations/{conversation_id}/segments"


class TerpaiSchedulingResult(TypedDict):
    """Return type of :func:`compute_terpai_scheduling_summary`."""

    summary: str | None
    error: str | None
    skipped: str | None


MINIMAL_JUPITERP_FIXTURE: dict[str, Any] = {
    "ok": True,
    "student_level_inferred": "sophomore",
    "course_level_policy": None,
    "matched_codes": ["CMSC216"],
    "course_details": [
        {
            "course_code": "CMSC216",
            "name": "Introduction to Computer Systems",
            "min_credits": 3,
            "sections": [
                {
                    "section_code": "0101",
                    "open_seats": 12,
                    "total_seats": 80,
                    "meetings": [
                        {"days": "MWF", "start_time": "10:00", "end_time": "10:50", "building": "IRB", "room": "1101"}
                    ],
                }
            ],
        }
    ],
}


def _bootstrap_env() -> None:
    """Load ``.env`` / ``.env.terpai`` from ``backend/`` when python-dotenv is installed."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    here = Path(__file__).resolve().parent
    load_dotenv(here / ".env")
    load_dotenv(here / ".env.terpai")
    load_dotenv()


def _segments_url() -> str | None:
    cid = (os.getenv("TERPAI_CONVERSATION_ID") or "").strip()
    if not cid:
        return None
    base = (os.getenv("TERPAI_BASE_URL") or _DEFAULT_BASE).rstrip("/")
    return f"{base}{_SEGMENTS_PATH.format(conversation_id=cid)}"


def _headers() -> dict[str, str] | None:
    bearer = (os.getenv("TERPAI_BEARER") or "").strip()
    if not bearer:
        return None
    return {
        "Authorization": f"Bearer {bearer}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }


def terpai_configured() -> bool:
    return bool(_segments_url() and _headers() and (os.getenv("TERPAI_PARENT_SEGMENT_ID") or "").strip())


def _extract_text_from_obj(obj: dict[str, Any]) -> str:
    for key in ("content", "text", "message", "delta", "answer", "response"):
        v = obj.get(key)
        if isinstance(v, str) and v.strip():
            return v
    # nested common shapes
    msg = obj.get("message")
    if isinstance(msg, dict):
        c = msg.get("content")
        if isinstance(c, str) and c.strip():
            return c
    choices = obj.get("choices")
    if isinstance(choices, list) and choices:
        ch0 = choices[0]
        if isinstance(ch0, dict):
            d = ch0.get("delta") or ch0.get("message")
            if isinstance(d, dict) and isinstance(d.get("content"), str):
                return d["content"]
    return ""


def ask_terpai(question: str, parent_segment_id: str | None = None, timeout: float = 120.0) -> tuple[str, str | None]:
    """
    POST a question to the segments endpoint; collect streamed assistant text.
    Returns (assistant_text, new_segment_id_or_none).
    """
    url = _segments_url()
    hdrs = _headers()
    if not url or not hdrs:
        return "", None

    parent = (parent_segment_id or os.getenv("TERPAI_PARENT_SEGMENT_ID") or "").strip()
    if not parent:
        return "", None

    payload = {
        "question": question,
        "visionImageIds": [],
        "attachmentIds": [],
        "segmentTraceLogLevel": "NonPersisted",
        "lineage": {"parentSegmentId": parent, "lineageType": "Question"},
    }

    text_parts: list[str] = []
    new_parent: str | None = None

    with requests.post(url, headers=hdrs, json=payload, stream=True, timeout=timeout) as resp:
        resp.raise_for_status()
        for raw in resp.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data:"):
                continue
            data = raw[5:].strip()
            if not data:
                continue
            try:
                decoded = base64.b64decode(data, validate=True).decode("utf-8")
            except Exception:
                decoded = data
            try:
                obj = json.loads(decoded)
            except json.JSONDecodeError:
                text_parts.append(decoded)
                continue

            if isinstance(obj, dict):
                seg_id = (
                    obj.get("ConversationSegmentId")
                    or obj.get("conversationSegmentId")
                    or obj.get("id")
                    or obj.get("segmentId")
                )
                if isinstance(seg_id, str) and seg_id.strip():
                    new_parent = seg_id.strip()
                piece = _extract_text_from_obj(obj)
                if piece:
                    text_parts.append(piece)

    combined = "".join(text_parts).strip()
    combined = re.sub(r"\s+", " ", combined)
    return combined, new_parent


def _slim_courses_for_prompt(
    payload: dict[str, Any],
    preferences: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Shrink Jupiterp+PlanetTerp payload for the TerpAI prompt."""
    details = payload.get("course_details")
    slim_courses: list[dict[str, Any]] = []
    if isinstance(details, list):
        for d in details[:20]:
            if not isinstance(d, dict):
                continue
            cc = str(d.get("course_code") or "").strip()
            sections = d.get("sections") if isinstance(d.get("sections"), list) else []
            first = sections[0] if sections else {}
            meetings = first.get("meetings") if isinstance(first, dict) else None
            slim_courses.append(
                {
                    "course_code": cc,
                    "name": d.get("name"),
                    "credits": d.get("min_credits") or d.get("max_credits"),
                    "section": first.get("section_code") if isinstance(first, dict) else None,
                    "meetings": meetings[:4] if isinstance(meetings, list) else meetings,
                    "open_seats": first.get("open_seats") if isinstance(first, dict) else None,
                    "total_seats": first.get("total_seats") if isinstance(first, dict) else None,
                }
            )
    schedule_hint = None
    if isinstance(preferences, dict) and preferences.get("schedule_constraints") is not None:
        schedule_hint = preferences.get("schedule_constraints")
    elif isinstance(payload.get("preferences"), dict):
        schedule_hint = payload["preferences"].get("schedule_constraints")
    return {
        "student_level_inferred": payload.get("student_level_inferred"),
        "course_level_policy": payload.get("course_level_policy"),
        "matched_codes": payload.get("matched_codes"),
        "schedule_hint": schedule_hint,
        "courses": slim_courses,
    }


_SCHEDULING_SYSTEM = """You are a concise academic scheduling assistant for University of Maryland students.
You receive structured JSON about recommended courses and sections (times, seats).
Write a short plain-text summary for calendar/scheduling (no markdown fences)."""


def build_scheduling_question(slim: dict[str, Any]) -> str:
    blob = json.dumps(slim, ensure_ascii=False, indent=2)[:14000]
    return f"""{_SCHEDULING_SYSTEM}

Task: In 2–5 sentences, help the student plan their schedule:
- Mention credit load if inferable from the list.
- Call out meeting patterns (days/times) when present.
- Note any obvious time conflicts between listed sections, or say if sections are not comparable.
- If seat counts are present, mention only if critically tight (e.g. very few seats left).

JSON input:
{blob}
"""


def compute_terpai_scheduling_summary(
    jupiterp_response: dict[str, Any],
    *,
    preferences: dict[str, Any] | None = None,
) -> TerpaiSchedulingResult:
    """
    Standalone TerpAI scheduling result (return next to `courses` in POST /getCourses).

    Returns:
        :class:`TerpaiSchedulingResult` with string values or ``None`` per field.
    """
    out: TerpaiSchedulingResult = {"summary": None, "error": None, "skipped": None}
    if not terpai_configured():
        out["skipped"] = "set TERPAI_BEARER, TERPAI_CONVERSATION_ID, TERPAI_PARENT_SEGMENT_ID"
        return out

    if not jupiterp_response.get("ok"):
        out["skipped"] = "courses payload not ok"
        return out

    slim = _slim_courses_for_prompt(jupiterp_response, preferences)
    question = build_scheduling_question(slim)

    try:
        text, _new_id = ask_terpai(question)
        if text:
            out["summary"] = text
        else:
            out["error"] = "empty response from TerpAI"
    except requests.RequestException as e:
        out["error"] = str(e)

    return out


def _cmd_check() -> int:
    _bootstrap_env()
    checks = {
        "TERPAI_BEARER": bool((os.getenv("TERPAI_BEARER") or "").strip()),
        "TERPAI_CONVERSATION_ID": bool((os.getenv("TERPAI_CONVERSATION_ID") or "").strip()),
        "TERPAI_PARENT_SEGMENT_ID": bool((os.getenv("TERPAI_PARENT_SEGMENT_ID") or "").strip()),
    }
    payload = {
        "terpai_configured": terpai_configured(),
        "segments_url_set": _segments_url() is not None,
        "headers_set": _headers() is not None,
        "env_flags": checks,
    }
    print(json.dumps(payload, indent=2))
    return 0 if payload["terpai_configured"] else 1


def _cmd_dry_run() -> int:
    _bootstrap_env()
    slim = _slim_courses_for_prompt(MINIMAL_JUPITERP_FIXTURE)
    question = build_scheduling_question(slim)
    print(
        json.dumps(
            {
                "slim": slim,
                "question_length_chars": len(question),
                "question_preview": question[:800] + ("…" if len(question) > 800 else ""),
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0


def _cmd_live() -> int:
    _bootstrap_env()
    result = compute_terpai_scheduling_summary(MINIMAL_JUPITERP_FIXTURE)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if result.get("summary"):
        return 0
    if result.get("skipped"):
        return 2
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="terpai_client",
        description="TerpAI scheduling client: env check, dry-run prompt, or live call.",
    )
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("check", help="Print whether TerpAI env is complete (no HTTP).")
    sub.add_parser("dry-run", help="Build slim JSON + question from MINIMAL_JUPITERP_FIXTURE (no HTTP).")
    sub.add_parser("live", help="Call TerpAI with the fixture (needs valid TERPAI_* env).")
    args = parser.parse_args(argv)
    if args.command == "check":
        return _cmd_check()
    if args.command == "dry-run":
        return _cmd_dry_run()
    if args.command == "live":
        return _cmd_live()
    raise AssertionError("unreachable")


if __name__ == "__main__":
    raise SystemExit(main())
