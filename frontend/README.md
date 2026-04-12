# Terp AI — frontend

Modular React (Vite) app: **student** experience at `/` and **admin** dashboard at `/admin`.

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm 9+

## Install

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

- **Student app:** [http://localhost:5173/](http://localhost:5173/)
- **Admin dashboard:** [http://localhost:5173/admin](http://localhost:5173/admin)

### ElevenLabs voice (no browser Web Speech API)

The student flow uses **`@elevenlabs/client`** (`Conversation.startSession`). Audio is captured and played by the SDK (WebRTC/WebSocket per ElevenLabs), not `webkitSpeechRecognition`.

Configure **`frontend/.env`** (see `frontend/.env.example`):

| Mode | Variables |
|------|-----------|
| **Public agent** | `VITE_ELEVENLABS_AGENT_ID` — from the ConvAI dashboard. **Do not put your ElevenLabs API key in the frontend** for a public agent. |
| **Private agent** | `VITE_ELEVENLABS_USE_SIGNED_URL=true` and either `VITE_API_BASE_URL` (e.g. `http://127.0.0.1:8000`, which calls `GET /get_conversation`) or `VITE_CONVAI_SIGNING_URL` explicitly. Use the FastAPI app in **`../backend/`** (`uvicorn main:app --reload`). Legacy: `backend_example/convai_signed_url_server.py`. Never put `xi-api-key` in the frontend. |

**Transcripts:** With `VITE_SUBMIT_TRANSCRIPTS=true`, the app `POST`s JSON to `/api/transcripts` on the same base URL (or same-origin `/api/transcripts` behind the Vite dev proxy). Files are stored under `backend/data/transcripts/`.

**Troubleshooting — “could not establish pc connection”:** The SDK’s default for voice is **WebRTC** (PeerConnection / “pc”). That often fails on strict networks. This app defaults **`VITE_ELEVENLABS_CONNECTION_TYPE`** to **WebSocket** for public agents (no env needed). If you set `VITE_ELEVENLABS_CONNECTION_TYPE=webrtc` and see this error, remove that line or switch back to the default.

After **End conversation**, the app parses the **structured JSON** from agent messages (`parseAdvisorOutputFromText` in `src/terp/utils/parseAdvisorJson.js`). If parsing fails and `VITE_USE_EXAMPLE_ADVISOR` is not `false`, it falls back to `EXAMPLE_ADVISOR_OUTPUT` in `src/terp/data/advisorProfile.js` for local UI work.

### Fonts (match `frontend_example`)

Google fonts are loaded in **`index.html`** (link tags) and base styles in **`src/index.css`**, so **Outfit** / **Instrument Serif** load reliably. The old `frontend_example` inlined `@import` inside a React `<style>` block, which can load late and cause visible fallback fonts (system UI).

## Production build

```bash
npm run build
```

Output is written to `frontend/dist/`. Preview locally:

```bash
npm run preview
```

## What’s in here

- **`src/terp/`** — Student UI: ElevenLabs ConvAI session (`ConvaiSession.jsx`), structured advisor panel, recommendations, calendar, workload, GPA simulator, etc.
- **`src/admin/`** — Admin dashboard with KPIs, charts, nudges, optional side chat panel.
- **`src/shared/`** — Theme tokens, `Flag`, `localStorage` shim for profile persistence (`terp_v7`).
