"""
Live conversation with an ElevenLabs Conversational AI agent (mic in / speakers out).

Requires:
  - pip install -r backend_example/requirements.txt
  - On some systems: PortAudio before PyAudio (e.g. macOS: brew install portaudio)
  - ELEVENLABS_API_KEY in the environment or project .env file
"""

import json
import os
import signal
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation, ConversationInitiationData
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface

# Project root and backend_example/.env (works whether you run from repo root or this folder)
_here = Path(__file__).resolve().parent
load_dotenv(_here.parent / ".env")
load_dotenv(_here / ".env")

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    raise SystemExit(
        "Missing ELEVENLABS_API_KEY. Add to your shell or a .env file in the project root:\n"
        "  ELEVENLABS_API_KEY=your_key_here"
    )

AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "agent_1301knywv4c1e79vdgg1asyxsaj6").strip()

elevenlabs = ElevenLabs(api_key=API_KEY)

transcript = []


def on_user(text: str):
    transcript.append({"role": "user", "text": text})
    print(f"You:   {text}")


def on_agent(text: str):
    transcript.append({"role": "agent", "text": text})
    print(f"Agent: {text}")


config = ConversationInitiationData(
    conversation_config_override={"max_duration_seconds": 600},
)

conversation = Conversation(
    client=elevenlabs,
    agent_id=AGENT_ID,
    requires_auth=True,
    audio_interface=DefaultAudioInterface(),
    config=config,
    callback_user_transcript=on_user,
    callback_agent_response=on_agent,
)

conversation.start_session()
signal.signal(signal.SIGINT, lambda *_: conversation.end_session())

conversation_id = conversation.wait_for_session_end()
print(f"\nConversation ended: {conversation_id}")

out_path = os.path.join(os.path.dirname(__file__), "transcript.json")
with open(out_path, "w") as f:
    json.dump({"conversation_id": conversation_id, "turns": transcript}, f, indent=2)
print(f"Saved {len(transcript)} turns to {out_path}")

full = elevenlabs.conversational_ai.conversations.get(conversation_id=conversation_id)
print(full)
