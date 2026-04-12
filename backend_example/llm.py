"""
Minimal Ollama chat example (requires Ollama running locally).

Why it might not run:
  1. Ollama is not installed / not running (default URL http://localhost:11434).
  2. The model name is not pulled: `ollama pull llama3.2` (or set OLLAMA_MODEL).
  3. Cloud-only models (e.g. kimi-k2.5:cloud) need Ollama 0.6+ and cloud login.

The FastAPI app in /backend uses HTTP to Ollama (see terp_llm.py) so you do not need
the `ollama` Python package for TerpAI — only the Ollama desktop/daemon.
"""

import os
import sys

try:
    from ollama import Client
except ImportError:
    print("Install with: pip install ollama", file=sys.stderr)
    raise

client = Client(host=os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434"))

MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")


def chat(messages):
    response = client.chat(model=MODEL, messages=messages)
    return response["message"]["content"]


def stream_chat(messages):
    for chunk in client.chat(model=MODEL, messages=messages, stream=True):
        print(chunk["message"]["content"], end="", flush=True)
    print()


if __name__ == "__main__":
    try:
        reply = chat(
            [
                {"role": "system", "content": "You are a concise assistant."},
                {"role": "user", "content": "Explain GRPO in two sentences."},
            ]
        )
        print("Reply:", reply)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        print("Tip: run `ollama serve` then `ollama pull {MODEL}`".replace("{MODEL}", MODEL), file=sys.stderr)
        sys.exit(1)
