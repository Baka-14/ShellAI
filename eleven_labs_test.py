"""
Minimal ElevenLabs Text-to-Speech (TTS) smoke test — not Conversational AI.

For live voice conversation in the browser, use the frontend + @elevenlabs/client
(or the Python ConvAI script in backend_example/eleven_conversational.py for CLI tests).

Requires: pip install elevenlabs python-dotenv
Env: ELEVENLABS_API_KEY (never commit real keys)
"""

import os

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.play import play

load_dotenv()

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    raise SystemExit("Set ELEVENLABS_API_KEY in .env or the environment.")

elevenlabs = ElevenLabs(api_key=API_KEY)

audio = elevenlabs.text_to_speech.convert(
    text="The first move is what sets everything in motion.",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_v3",
    output_format="mp3_44100_128",
)

play(audio)
