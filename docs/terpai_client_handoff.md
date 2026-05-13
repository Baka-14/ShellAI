---
title: "TerpAI scheduling client — handoff guide"
author: "ShellAI / UMD integration"
date: "May 2026"
geometry: margin=1in
documentclass: article
fontsize: 11pt
---

# Purpose and audience

This document explains the Python module `backend/terpai_client.py`, which calls the UMD TerpAI (Nebula) **internal segments** HTTP API to produce a short **scheduling-oriented plain-text summary** from a Jupiterp-style course payload.

**Audience:** engineers who need to configure credentials, run a local smoke test, or embed `compute_terpai_scheduling_summary` next to existing course APIs.

# Scope and limitations

- **Bearer JWTs expire**; there is no refresh flow in this module. Operators must rotate `TERPAI_BEARER` manually until a supported server-side token exchange exists.
- This client uses the **same streaming `data:` line protocol** as `terpai_test.py` / `terpai_chat.py`; TLS trust and institutional CA issues are environment-specific (see project `README.md` for proxy alternatives under `/api/terpai`).

# Prerequisites

| Requirement | Notes |
|-------------|--------|
| Python | 3.10+ recommended (uses modern optional type syntax). |
| Dependencies | `requests` (listed in `backend/requirements.txt`). Optional: `python-dotenv` to load `.env` / `.env.terpai` automatically. |
| Network | Outbound HTTPS to `TERPAI_BASE_URL` (default `https://terpai.umd.edu`). |
| Credentials | Valid Nebula session values (see below). |

# Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TERPAI_BEARER` | Yes | `Bearer` token value **without** the `Bearer ` prefix (the code adds it). |
| `TERPAI_CONVERSATION_ID` | Yes | Conversation UUID used in the segments URL path. |
| `TERPAI_PARENT_SEGMENT_ID` | Yes | Parent segment for `lineage.parentSegmentId` (Question lineage). |
| `TERPAI_BASE_URL` | No | Override API host; default `https://terpai.umd.edu`. |

If any required value is missing, `compute_terpai_scheduling_summary` returns `skipped` with a short reason instead of calling the network.

# Data contract — `jupiterp_response`

The function `compute_terpai_scheduling_summary(jupiterp_response, preferences=None)` expects a **dictionary** shaped like a successful Jupiterp merge used elsewhere in ShellAI:

- **`ok`** (truthy): if falsey, the client sets `skipped` to `"courses payload not ok"` and returns without calling TerpAI.
- **`course_details`**: list of course dicts; each may include `course_code`, `name`, `min_credits` / `max_credits`, and `sections` (list). The client **slims** the first 20 courses and the first section per course for the prompt (meetings truncated).

Optional fields used when present: `student_level_inferred`, `course_level_policy`, `matched_codes`, `preferences.schedule_constraints` (or the same under the top-level `preferences` argument).

A **minimal** example sufficient for a dry-run:

```json
{
  "ok": true,
  "course_details": [
    {
      "course_code": "CMSC216",
      "name": "Programming Computer Science",
      "min_credits": 3,
      "sections": [
        {
          "section_code": "0101",
          "open_seats": 5,
          "total_seats": 120,
          "meetings": [{"days": "MWF", "start_time": "10:00", "end_time": "10:50"}]
        }
      ]
    }
  ]
}
```

# Public API (summary)

| Name | Role |
|------|------|
| `terpai_configured()` | Returns `True` if URL, headers, and parent segment can be built from env. |
| `ask_terpai(question, parent_segment_id=None, timeout=120)` | Low-level: POST question, consume SSE-style lines, return `(text, new_segment_id_or_none)`. |
| `build_scheduling_question(slim)` | Builds the full prompt string from the slimmed dict. |
| `compute_terpai_scheduling_summary(jupiterp_response, preferences=None)` | End-to-end: returns `{"summary", "error", "skipped"}` with string or `None` values. |

Return shape is typed in code as `TerpaiSchedulingResult` (`TypedDict`) for editors and static checkers.

# How to run locally

From the repository root (after installing backend deps, e.g. `pip install -r backend/requirements.txt`):

Commands: **`check`** (env only), **`dry-run`** (fixture prompt, no HTTP), **`live`** (real API with fixture).

```bash
cd backend
python terpai_client.py check
python terpai_client.py dry-run
python terpai_client.py live
```

Exit codes for `check`: **0** if all required env vars are set, **1** if anything is missing (useful for scripts). For `live`: **0** if a summary was returned, **1** on empty/error response, **2** if the call was skipped (missing env or payload not ok).

To import from another script (with `backend` on `PYTHONPATH` or run from `backend/`):

```python
from terpai_client import compute_terpai_scheduling_summary, MINIMAL_JUPITERP_FIXTURE

result = compute_terpai_scheduling_summary(MINIMAL_JUPITERP_FIXTURE)
print(result)
```

# Operational flow (text)

1. Validate env and `jupiterp_response["ok"]`.  
2. `_slim_courses_for_prompt` reduces token load.  
3. `build_scheduling_question` embeds JSON (capped length) plus system instructions.  
4. `ask_terpai` streams response lines, base64-decodes when applicable, extracts text and optional new segment id.  
5. Result dict is returned to the caller (e.g. merged into `POST /getCourses` when enabled in `main.py`).

# Security and compliance

- **Treat `TERPAI_BEARER` as a secret**; never commit it to git. Use `.env` / secret manager in deployment.  
- Prefer **short-lived tokens** and institutional guidance on acceptable automation against campus systems.  
- This module does **not** disable TLS verification; for dev-only TLS bypass, use the separate FastAPI proxy patterns documented in the main `README.md`, not this client.

# Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `skipped` mentions env | Missing or blank `TERPAI_*` variables. |
| `skipped` courses payload not ok | `ok` is false or missing in input dict. |
| `error` with HTTP message | Token expired, wrong conversation/parent id, or network/TLS failure. |
| `error` empty response | Stream contained no extractable assistant text (API or format change). |

# Related files in this repository

- `backend/terpai_chat.py` — interactive REPL and shared streaming helpers used by the HTTP proxy router.  
- `backend/terpai_umd_routes.py` — FastAPI `/api/terpai` proxy for browser-driven flows.  
- `backend/main.py` — `terpai_scheduling` merge is currently commented out; re-enable when tokens and error semantics are production-ready.

# Revision history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-05 | Initial handoff PDF generated from this Markdown source. |
