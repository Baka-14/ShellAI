"""
LLM helpers via Ollama HTTP API (no `ollama` Python package required).

Set OLLAMA_HOST (default http://127.0.0.1:11434) and OLLAMA_MODEL (e.g. llama3.2).
Run Ollama locally: https://ollama.com — `ollama pull llama3.2`

Cloud models (e.g. kimi-k2.5:cloud) need the Ollama app + account configured the same
way as in backend_example/llm.py.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2").strip()


async def ollama_chat(messages: list[dict[str, str]], *, model: str | None = None) -> str:
    m = model or OLLAMA_MODEL
    url = f"{OLLAMA_HOST}/api/chat"
    payload = {"model": m, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, json=payload)
    r.raise_for_status()
    data = r.json()
    msg = data.get("message") or {}
    return str(msg.get("content") or "")


def extract_json_object(text: str) -> dict[str, Any] | None:
    """Parse first JSON object from model output (handles ```json fences)."""
    if not text or not text.strip():
        return None
    t = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", t, re.I)
    if fence:
        t = fence.group(1).strip()
    start = t.find("{")
    end = t.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        return json.loads(t[start : end + 1])
    except json.JSONDecodeError:
        return None


VALID_PERSONAS = frozenset({"researcher", "closer", "explorer"})


def normalize_persona_response(raw: dict[str, Any] | None) -> dict[str, Any]:
    """Ensure safe shape for the frontend."""
    out: dict[str, Any] = {
        "persona": "researcher",
        "rationale": "",
        "course_insights": [],
    }
    if not raw or not isinstance(raw, dict):
        return out
    p = str(raw.get("persona", "")).lower().strip()
    if p in VALID_PERSONAS:
        out["persona"] = p
    out["rationale"] = str(raw.get("rationale", ""))[:500]
    ci = raw.get("course_insights")
    if isinstance(ci, list):
        for item in ci[:12]:
            if not isinstance(item, dict):
                continue
            code = str(item.get("course", "")).strip()
            if not code:
                continue
            out["course_insights"].append(
                {
                    "course": code,
                    "highlight": str(item.get("highlight", ""))[:400],
                }
            )
    return out


PERSONA_SYSTEM = """You are TerpAI, classifying a UMD student conversation for UI routing.

Return ONLY valid JSON (no markdown outside the JSON) with this exact shape:
{
  "persona": "researcher" | "closer" | "explorer",
  "rationale": "one short sentence",
  "course_insights": [
    { "course": "COURSE CODE like CMSC 828A", "highlight": "one personalized sentence for this student about that course" }
  ]
}

Definitions:
- researcher: wants labs, papers, venues (ICML/NeurIPS), professor fit, RA/publication path.
- closer: needs GPA lift, safe grades, workload control, job offer contingent on GPA, last-semester strategy.
- explorer: undeclared or choosing between CS / Data Science / INFO paths, sampling courses, needs guidance not optimization.

Use the transcript text. If unclear, pick the best fit and explain briefly.
Include up to 5 course_insights for courses explicitly mentioned or strongly implied; otherwise suggest plausible UMD CMSC/DATA/INST codes from context."""


def build_persona_user_payload(transcript_text: str, advisor_json: dict[str, Any] | None) -> str:
    parts = ["### Transcript (user + agent turns, plain text)\n", transcript_text[:24000]]
    if advisor_json:
        parts.append("\n\n### Structured advisor JSON (if any)\n")
        parts.append(json.dumps(advisor_json, indent=2)[:8000])
    return "".join(parts)
