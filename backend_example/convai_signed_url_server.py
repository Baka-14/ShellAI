#!/usr/bin/env python3
"""
Minimal CORS proxy: returns ElevenLabs signed WebSocket URL for a private ConvAI agent.

The browser must NEVER receive your xi-api-key. Run locally and point the frontend at this URL:

  export ELEVENLABS_API_KEY=...
  export ELEVENLABS_AGENT_ID=agent_...
  python backend_example/convai_signed_url_server.py

Then in frontend/.env:
  VITE_ELEVENLABS_USE_SIGNED_URL=true
  VITE_CONVAI_SIGNING_URL=http://127.0.0.1:8787/signed-url
"""

import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
AGENT_ID = os.environ.get("ELEVENLABS_AGENT_ID", "").strip()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[convai-proxy] {args[0]}")

    def _send(self, code, body, content_type="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        if body is not None:
            self.wfile.write(body if isinstance(body, bytes) else body.encode())

    def do_OPTIONS(self):
        self._send(204, b"")

    def do_GET(self):
        if self.path.rstrip("/").endswith("/signed-url") or self.path.startswith("/signed-url"):
            if not API_KEY or not AGENT_ID:
                self._send(
                    500,
                    json.dumps({"error": "Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID"}),
                )
                return
            url = f"https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={AGENT_ID}"
            req = urllib.request.Request(url, headers={"xi-api-key": API_KEY})
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = resp.read()
                self._send(200, data)
            except urllib.error.HTTPError as e:
                err = e.read().decode("utf-8", errors="replace")
                self._send(e.code, json.dumps({"error": err}))
            except Exception as e:
                self._send(500, json.dumps({"error": str(e)}))
            return
        self._send(404, json.dumps({"error": "not found"}))


if __name__ == "__main__":
    port = int(os.environ.get("CONVAI_PROXY_PORT", "8787"))
    print(f"Serving signed-url at http://127.0.0.1:{port}/signed-url")
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
