# """
# FastAPI backend for TerpAI + ElevenLabs ConvAI (matches bitcamp barebones flow).

# - GET /get_conversation — { signed_url, agent_id } for @elevenlabs/client (private agents)
# - GET /signed-url — alias for the same (used by frontend .env examples)
# - GET /api/conversations/{conversation_id} — proxy ElevenLabs canonical conversation payload
# - POST /api/transcripts — store transcript JSON sent from the browser after a session

# Never expose ELEVENLABS_API_KEY to the frontend.
# """

# from __future__ import annotations

# import json
# import os
# import re
# from datetime import datetime, timezone
# from pathlib import Path

# import httpx
# from dotenv import load_dotenv
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel, Field

# from terp_llm import (
#     PERSONA_SYSTEM,
#     build_persona_user_payload,
#     extract_json_object,
#     normalize_persona_response,
#     ollama_chat,
# )

# load_dotenv()

# HERE = Path(__file__).resolve().parent
# TRANSCRIPTS_DIR = HERE / "data" / "transcripts"
# TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

# ELEVEN_API = "https://api.elevenlabs.io"

# API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
# AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "").strip()

# _DEFAULT_ORIGINS = (
#     "http://127.0.0.1:5173",
#     "http://localhost:5173",
#     "http://127.0.0.1:4173",
#     "http://localhost:4173",
# )
# _cors = os.getenv("CORS_ORIGINS", "").strip()
# ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()] if _cors else list(_DEFAULT_ORIGINS)

# app = FastAPI(title="TerpAI ConvAI API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# def _require_config() -> None:
#     if not API_KEY or not AGENT_ID:
#         raise HTTPException(
#             status_code=500,
#             detail="Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in backend/.env",
#         )


# async def _fetch_signed_url() -> dict:
#     _require_config()
#     url = f"{ELEVEN_API}/v1/convai/conversation/get-signed-url"
#     async with httpx.AsyncClient(timeout=30) as client:
#         r = await client.get(url, params={"agent_id": AGENT_ID}, headers={"xi-api-key": API_KEY})
#     if r.status_code != 200:
#         raise HTTPException(status_code=r.status_code, detail=r.text[:500])
#     data = r.json()
#     if "signed_url" not in data:
#         raise HTTPException(status_code=502, detail="ElevenLabs response missing signed_url")
#     return {"signed_url": data["signed_url"], "agent_id": AGENT_ID}


# @app.get("/")
# def root():
#     return {
#         "service": "terp-ai-backend",
#         "docs": "/docs",
#         "signed_url_routes": ["/get_conversation", "/signed-url"],
#     }


# @app.get("/get_conversation")
# async def get_conversation():
#     """Bitcamp-compatible: frontend fetches this, then passes `signed_url` to Conversation.startSession."""
#     return await _fetch_signed_url()


# @app.get("/signed-url")
# async def signed_url_alias():
#     return await _fetch_signed_url()


# @app.get("/api/conversations/{conversation_id}")
# async def get_conversation_detail(conversation_id: str):
#     """Canonical transcript + metadata from ElevenLabs (server-side API key)."""
#     _require_config()
#     url = f"{ELEVEN_API}/v1/convai/conversations/{conversation_id}"
#     async with httpx.AsyncClient(timeout=60) as client:
#         r = await client.get(url, headers={"xi-api-key": API_KEY})
#     if r.status_code != 200:
#         raise HTTPException(status_code=r.status_code, detail=r.text[:800])
#     return r.json()


# class TranscriptTurn(BaseModel):
#     role: str | None = None
#     source: str | None = None
#     message: str | None = None
#     event_id: str | None = None
#     channel: str | None = None
#     at: str | None = None


# class TranscriptPayload(BaseModel):
#     conversation_id: str | None = None
#     generated_at: str | None = None
#     turns: list[TranscriptTurn] = Field(default_factory=list)
#     messages: list[dict] = Field(default_factory=list)
#     advisor_profile: dict | None = None
#     raw_agent_text: str | None = None


# def _safe_filename(conversation_id: str) -> str:
#     safe = re.sub(r"[^\w.\-]+", "_", conversation_id)[:120]
#     return safe or "unknown"


# @app.post("/api/transcripts")
# async def save_transcript(body: TranscriptPayload):
#     """
#     Persist transcript JSON from the browser (SDK message list + optional parsed advisor profile).
#     Files land in backend/data/transcripts/ — swap for a DB in production.
#     """
#     cid = body.conversation_id or "unknown"
#     ts = body.generated_at or datetime.now(timezone.utc).isoformat()
#     doc = {
#         "conversation_id": body.conversation_id,
#         "generated_at": ts,
#         "turns": [t.model_dump(exclude_none=True) for t in body.turns],
#         "messages": body.messages,
#         "advisor_profile": body.advisor_profile,
#         "raw_agent_text": body.raw_agent_text,
#     }
#     name = f"{_safe_filename(cid)}_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
#     path = TRANSCRIPTS_DIR / name
#     path.write_text(json.dumps(doc, indent=2), encoding="utf-8")
#     return {"ok": True, "path": str(path.relative_to(HERE))}


# class PersonaFromTranscriptBody(BaseModel):
#     """Transcript + optional advisor JSON for LLM persona + course blurbs."""

#     transcript_text: str = Field(default="", max_length=32000)
#     messages: list[dict] = Field(default_factory=list)
#     advisor_profile: dict | None = None


# @app.post("/api/persona-from-transcript")
# async def persona_from_transcript(body: PersonaFromTranscriptBody):
#     """
#     Call local Ollama (see terp_llm.py) to infer researcher|closer|explorer + short per-course highlights.
#     Requires Ollama running at OLLAMA_HOST with OLLAMA_MODEL pulled.
#     """
#     text = (body.transcript_text or "").strip()
#     if not text and body.messages:
#         lines = []
#         for m in body.messages:
#             if not isinstance(m, dict):
#                 continue
#             src = m.get("source") or m.get("role") or ""
#             msg = m.get("message") or m.get("text") or ""
#             if msg:
#                 lines.append(f"{src}: {msg}")
#         text = "\n".join(lines)
#     if not text.strip():
#         raise HTTPException(status_code=400, detail="No transcript text or messages provided")

#     try:
#         user_content = build_persona_user_payload(text, body.advisor_profile)
#         raw_text = await ollama_chat(
#             [
#                 {"role": "system", "content": PERSONA_SYSTEM},
#                 {"role": "user", "content": user_content},
#             ]
#         )
#         parsed = extract_json_object(raw_text)
#         normalized = normalize_persona_response(parsed)
#         normalized["model_raw_excerpt"] = (raw_text or "")[:400]
#         return normalized
#     except (httpx.ConnectError, httpx.TimeoutException) as e:
#         raise HTTPException(
#             status_code=503,
#             detail=f"Ollama unreachable: {str(e)}. Start Ollama, run: ollama pull {os.getenv('OLLAMA_MODEL', 'llama3.2')} — check OLLAMA_HOST.",
#         ) from e
#     except httpx.HTTPStatusError as e:
#         raise HTTPException(
#             status_code=503,
#             detail=f"Ollama error {e.response.status_code}: {(e.response.text or '')[:400]}",
#         ) from e
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e)) from e


import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from ollama import chat

from terp_llm import extract_json_object
from jupiterp import fetch_courses_for_preferences
from planetterp import enrich_jupiterp_with_planetterp
# from terpai_client import compute_terpai_scheduling_summary  # disabled: no terpai_scheduling on /getCourses
from terpai_umd_routes import router as terpai_umd_router

load_dotenv()



HERE = Path(__file__).resolve().parent

# Default extraction schema (override with SYSTEM_PROMPT or SYSTEM_PROMPT_FILE — multiline .env is unreliable).
_DEFAULT_PREF_PROMPT = """
You are a structured-data extraction engine. You will receive the transcript of a
conversation between a student and an academic advisor chatbot. Your job is to extract
the student's preferences into a JSON object with EXACTLY this schema (omit any field
whose value cannot be inferred from the conversation). You may add other important
key-value pairs you find in the conversation.

{
  "student": {
    "program": "<degree program, e.g. MSCS, PhD CS>",
    "year": <integer year in program>,
    "internship": "<internship info if mentioned>"
  },
  "interests": ["<research/academic interest>", "..."],
  "interest_keywords": ["<short lowercase keyword for matching>", "..."],
  "explicit_courses": ["<course code mentioned, e.g. CMSC723>", "..."],
  "avoid_keywords": ["<topic or course type the student wants to avoid>", "..."],
  "constraints": {
    "max_credits": <integer or null>,
    "earliest_start_time": "<HH:MM or null>",
    "department": "<department code, e.g. CMSC>",
    "grad_level_only": <true or false>
  },
  "social": {
    "wants_study_partners": <true or false>
  },
  "goal": {
    "statement": "<one concise sentence: what the student wants to achieve, in their own intent>",
    "category": "<exactly one of: academic_performance | research | career_placement | course_planning | graduation_timeline | exploration | other>",
    "targets": ["<optional concrete targets they stated, e.g. raise GPA to 3.8, publish at NeurIPS, land ML internship>"]
  }
}

Rules:
- Return ONLY valid JSON. No markdown fences, no commentary.
- For interest_keywords, produce short lowercase tokens useful for course-catalog search.
- **goal**: Include when the student expresses an outcome they want (raise GPA, focus on NLP research, finish degree by Spring 2027, get internship, etc.). Set **category** from their primary intent; put numbers or named outcomes in **targets** when stated. If they only discuss interests with no outcome, omit **goal** entirely.
- If the student never mentioned a field, omit it entirely rather than guessing.
""".strip()


def _load_system_prompt() -> str:
    """Prefer a prompt file (multiline); else SYSTEM_PROMPT from env; else default."""
    file_key = os.getenv("SYSTEM_PROMPT_FILE", "").strip()
    if file_key:
        path = Path(file_key)
        if not path.is_absolute():
            path = HERE / path
        if path.is_file():
            text = path.read_text(encoding="utf-8").strip()
            if text:
                return text
    inline = os.getenv("SYSTEM_PROMPT", "").strip()
    if inline:
        return inline
    return _DEFAULT_PREF_PROMPT


SYSTEM_PROMPT = _load_system_prompt()


def _build_preferences_user_content(body: dict) -> str:
    """Everything the model should read (was missing before — user message had no transcript)."""
    parts: list[str] = []
    messages = body.get("messages") or []
    parts.append("### Conversation (JSON: SDK message list)\n")
    parts.append(json.dumps(messages, ensure_ascii=False, indent=2)[:52000])

    raw = (body.get("raw_agent_text") or "").strip()
    if raw:
        parts.append("\n\n### Concatenated assistant (agent) text\n")
        parts.append(raw[:20000])

    prof = body.get("advisor_profile")
    if isinstance(prof, dict) and prof:
        parts.append("\n\n### Parsed intake (advisor_profile)\n")
        parts.append(json.dumps(prof, ensure_ascii=False, indent=2)[:16000])

    api_c = body.get("api_conversation")
    if isinstance(api_c, dict) and api_c:
        parts.append("\n\n### Canonical api_conversation (truncated)\n")
        parts.append(json.dumps(api_c, ensure_ascii=False, indent=2)[:24000])

    return "".join(parts)


def get_structured_preferences(body: dict) -> dict:
    """Call Ollama with format='json'. Expects full POST /get_preferences body."""
    user_content = _build_preferences_user_content(body)
    if not user_content.strip():
        return {}

    temp = float(os.getenv("OLLAMA_PREFERENCES_TEMP", "0.15"))

    response = chat(
        model=os.getenv("OLLAMA_MODEL", "kimi-k2.5:cloud").strip(),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Use ONLY the material below. Follow the JSON schema from the system message. "
                    "Populate every field you can justify from the transcript; omit keys with no evidence. "
                    "Do not invent facts.\n\n"
                    + user_content
                ),
            },
        ],
        format="json",
        options={"temperature": temp},
    )
    raw = (getattr(response.message, "content", None) or "").strip()
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return extract_json_object(raw) or {}


def fetch_jupiterp_courses(preferences: dict | list | str | None) -> dict:
    """Jupiterp course + section details from preference JSON (from POST /get_preferences)."""
    try:
        return fetch_courses_for_preferences(preferences)
    except requests.RequestException as e:
        return {
            "ok": False,
            "error": str(e),
            "matched_codes": [],
            "match_reasons": {},
            "department_prefix_used": None,
            "courses": [],
            "course_details": [],
        }


def fetch_jupiterp_courses_with_planetterp(preferences: dict | list | str | None) -> dict:
    """
    Jupiterp course/section payload plus PlanetTerp per-course data (GPA, grade
    distribution aggregate + sample sections, reviews, description) on each
    `course_details` entry under `planetterp`.
    """
    base = fetch_jupiterp_courses(preferences)
    if not base.get("ok"):
        return {**base, "planetterp_enriched": False}
    return enrich_jupiterp_with_planetterp(base)


app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(terpai_umd_router)

# Prefer ELEVENLABS_* (matches backend/.env.example). ELEVEN_LABS_* kept for older local .env files.
_ELEVENLABS_API_KEY = (
    os.getenv("ELEVENLABS_API_KEY", "").strip()
    or os.getenv("ELEVEN_LABS_API", "").strip()
)
_ELEVENLABS_AGENT_ID = (
    os.getenv("ELEVENLABS_AGENT_ID", "").strip()
    or os.getenv("ELEVEN_LABS_AGENT_ID", "").strip()
)
_elevenlabs_client = ElevenLabs(api_key=_ELEVENLABS_API_KEY) if _ELEVENLABS_API_KEY else None


def _require_elevenlabs():
    if not _ELEVENLABS_API_KEY or not _ELEVENLABS_AGENT_ID or _elevenlabs_client is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "ElevenLabs is not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID "
                "in backend/.env (see .env.example). A 401 from ElevenLabs usually means the key was missing or wrong."
            ),
        )
    return _elevenlabs_client, _ELEVENLABS_AGENT_ID


@app.get("/get_conversation")
def get_conversation_signed_url():
    """Signed WebSocket URL for private ConvAI agents (frontend uses this when VITE_ELEVENLABS_USE_SIGNED_URL=true)."""
    client, agent_id = _require_elevenlabs()
    signed = client.conversational_ai.conversations.get_signed_url(agent_id=agent_id)
    return JSONResponse(
        content={
            "signed_url": signed.signed_url,
            "agent_id": agent_id,
        }
    )


@app.get("/conversation/{conversation_id}")
def fetch_conversation(conversation_id: str):
    client, _ = _require_elevenlabs()
    full = client.conversational_ai.conversations.get(conversation_id=conversation_id)
    return JSONResponse(content=full.model_dump())


@app.post("/get_preferences")
def get_preferences(body: dict):
    preferences = get_structured_preferences(body if isinstance(body, dict) else {})
    print("======================")
    print(preferences)


    return preferences


@app.post("/getCourses")
def get_courses(body: dict = Body(default_factory=dict)):
    """
    Returns `courses`: Jupiterp + PlanetTerp payload from `fetch_jupiterp_courses_with_planetterp`.

    (Previously also returned `terpai_scheduling` from `terpai_client.compute_terpai_scheduling_summary` — re-enable import + merge into response if needed.)
    """
    prefs = body.get("preferences") if isinstance(body, dict) else None
    # if prefs is None:
        # prefs = {
        #     "student": {"program": "MSCS", "year": 1},
        #     "interests": [
        #         "natural language processing",
        #         "data visualization",
        #         "improving interactivity in static charts",
        #     ],
        #     "interest_keywords": [
        #         "nlp",
        #         "natural language processing",
        #         "data visualization",
        #         "visualization",
        #         "charts",
        #         "interactivity",
        #     ],
        #     "constraints": {"department": "CMSC"},
        #     "social": {"wants_study_partners": False},
        #     "schedule_constraints": {"free_days": ["Friday"]},
        # }
    courses = fetch_jupiterp_courses_with_planetterp(
        prefs if isinstance(prefs, (dict, list)) else None
    )
    # terpai_scheduling = compute_terpai_scheduling_summary(
    #     courses,
    #     preferences=prefs if isinstance(prefs, dict) else None,
    # )
    # out = {"courses": courses, "terpai_scheduling": terpai_scheduling}
    out = {"courses": courses}
    # print(out)
    return out


@app.post("/getPeople")
def get_people(body: dict = Body(default_factory=dict)):
    """Placeholder: people/circle; expects `preferences` = JSON from POST /get_preferences."""
    prefs = body.get("preferences")
    print(
        "[getPeople] preferences (from get_preferences):",
        json.dumps(prefs, indent=2, ensure_ascii=False, default=str),
        flush=True,
    )
    return {"ok": True}


@app.get("/universityAnalytics")
def university_analytics():
    """Placeholder analytics endpoint. Returns mock data matching the dashboard template.
    Replace with real aggregations from stored preference data once collection is live."""
    return {
        "kpi": {
            "active_users": 2847,
            "courses_planned": 8241,
            "circle_matches": 1456,
            "avg_satisfaction": 4.3,
        },
        "goal_distribution": {
            "fall26": [
                {"label": "Coast & GPA", "pct": 32},
                {"label": "Skill Build", "pct": 28},
                {"label": "Research", "pct": 18},
                {"label": "Balanced", "pct": 12},
                {"label": "Explore", "pct": 10},
            ],
        },
        "demand": [
            {"course": "CMSC 828A", "demand_pct": 92, "capacity": 35, "waitlist": 23},
            {"course": "CMSC 421", "demand_pct": 88, "capacity": 40, "waitlist": 15},
            {"course": "CMSC 723", "demand_pct": 78, "capacity": 30, "waitlist": 8},
            {"course": "CMSC 330", "demand_pct": 70, "capacity": 50, "waitlist": 5},
            {"course": "DATA 601", "demand_pct": 60, "capacity": 45, "waitlist": 2},
            {"course": "DATA 606", "demand_pct": 55, "capacity": 40, "waitlist": 0},
        ],
        "migration": [
            {"from": "CS", "to": "Data Science", "count": 47, "pct": "14%", "trend": "up"},
            {"from": "INFO", "to": "CS", "count": 23, "pct": "8%", "trend": "up"},
            {"from": "Math", "to": "Data Science", "count": 18, "pct": "6%", "trend": "stable"},
            {"from": "CS", "to": "Undeclared", "count": 12, "pct": "3%", "trend": "down"},
        ],
    }