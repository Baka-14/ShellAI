"""
Live conversation with an ElevenLabs Conversational AI agent (mic in / speakers out).

Stopping the session (SDK: elevenlabs.conversational_ai.conversation.Conversation)
---------------------------------------------------------------------------
1. **Ctrl+C (SIGINT)** — Calls `conversation.end_session()`, which stops PyAudio,
   sets the internal stop flag, and tears down the WebSocket loop. Then call
   `wait_for_session_end()` so the background thread joins and you get `conversation_id`.

2. **Server-side max duration** — `ConversationInitiationData.conversation_config_override`
   can include `max_duration_seconds` (hard cap on the orchestrator).

3. **Optional auto-stop timer** — Set env `CONVERSATION_MAX_SECONDS` (e.g. `95` for a ~90s
   flow with buffer). A timer calls `end_session()` for you.

`wait_for_session_end()` blocks until the session ends; you must eventually call
`end_session()` (manually, via signal, timer, or disconnect) or it waits indefinitely.

Transcripts
-----------
- **Live (during the call):** `callback_user_transcript` and `callback_agent_response`
  receive text as the agent/user speak — good for real-time UI; saved here as
  `transcript_live.json`.

- **Canonical (after the call):** `client.conversational_ai.conversations.get(conversation_id)`
  returns `GetConversationResponseModel`, which includes a `transcript` list (roles,
  messages, timestamps, etc.). Saved as `conversation_from_api.json`.

Requires: pip install -r backend_example/requirements.txt, PyAudio, ELEVENLABS_API_KEY in .env
"""

import json
import os
import signal
import threading
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation, ConversationInitiationData
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface

_here = Path(__file__).resolve().parent
load_dotenv(_here.parent / ".env")
load_dotenv(_here / ".env")

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    raise SystemExit(
        "Missing ELEVENLABS_API_KEY. Add to your shell or a .env file in the project root:\n"
        "  ELEVENLABS_API_KEY=your_key_here"
    )

AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "agent_5801knz3qsjveaa86aew2e03anzr").strip()

# Optional: auto-stop after N seconds (e.g. 95 for ~90s advisor conversations)
_MAX_SEC = os.getenv("CONVERSATION_MAX_SECONDS", "").strip()
try:
    AUTO_STOP_SECONDS = float(_MAX_SEC) if _MAX_SEC else None
except ValueError:
    AUTO_STOP_SECONDS = None

elevenlabs = ElevenLabs(api_key=API_KEY)

transcript_live = []


def on_user(text: str):
    transcript_live.append({"role": "user", "text": text})
    print(f"You:   {text}")


def on_agent(text: str):
    transcript_live.append({"role": "agent", "text": text})
    print(f"Agent: {text}")


def on_end_session():
    print("\n[Session end callback]")


def _pydantic_to_jsonable(obj):
    """Serialize Pydantic v2/v1 models or plain dicts for json.dump."""
    if obj is None:
        return None
    if hasattr(obj, "model_dump"):
        return obj.model_dump(mode="json")
    if hasattr(obj, "dict"):
        return obj.dict()
    return obj


config = ConversationInitiationData(
    conversation_config_override={
        # Hard cap on orchestrator (seconds). Increase if you want longer free-form chats.
        "max_duration_seconds": int(os.getenv("ELEVENLABS_MAX_DURATION_SECONDS", "600")),
    },
)

conversation = Conversation(
    client=elevenlabs,
    agent_id=AGENT_ID,
    requires_auth=True,
    audio_interface=DefaultAudioInterface(),
    config=config,
    callback_user_transcript=on_user,
    callback_agent_response=on_agent,
    callback_end_session=on_end_session,
)

# Register SIGINT before starting so first Ctrl+C triggers end_session.
signal.signal(signal.SIGINT, lambda *_: conversation.end_session())

conversation.start_session()

if AUTO_STOP_SECONDS is not None:
    threading.Timer(AUTO_STOP_SECONDS, conversation.end_session).start()
    print(f"Auto-stop enabled: end_session() in ~{AUTO_STOP_SECONDS}s (set CONVERSATION_MAX_SECONDS to change).")
print("Speak with the agent. Press Ctrl+C to end the session.\n")

conversation_id = conversation.wait_for_session_end()
print(f"\nConversation ended. conversation_id={conversation_id!r}")

if not conversation_id:
    print("Warning: no conversation_id — API transcript may be unavailable.")

# --- Save live callback transcript (streaming capture during the call)
live_path = _here / "transcript_live.json"
with open(live_path, "w") as f:
    json.dump({"conversation_id": conversation_id, "turns": transcript_live}, f, indent=2)
print(f"Saved {len(transcript_live)} live turns to {live_path}")

# --- Fetch canonical conversation + transcript from ElevenLabs API
if conversation_id:
    full = elevenlabs.conversational_ai.conversations.get(conversation_id=conversation_id)
    api_path = _here / "conversation_from_api.json"
    payload = _pydantic_to_jsonable(full)
    with open(api_path, "w") as f:
        json.dump(payload, f, indent=2, default=str)
    print(f"Saved API conversation (includes transcript[]) to {api_path}")
    n_turns = len(full.transcript) if full.transcript else 0
    print(f"Server transcript entries: {n_turns}")
else:
    full = None
    print("Skipped API fetch (no conversation_id).")
