/**
 * Build options for @elevenlabs/client Conversation.startSession.
 * - Public agent: { agentId } (API key stays on ElevenLabs; agent is public in dashboard).
 * - Private agent: fetch signed URL from your backend (never put xi-api-key in the browser).
 *
 * @see https://elevenlabs.io/docs/conversational-ai/libraries/java-script
 */

export async function buildConvaiSessionOptions() {
  const useSigned = import.meta.env.VITE_ELEVENLABS_USE_SIGNED_URL === "true";
  let signingUrl = import.meta.env.VITE_CONVAI_SIGNING_URL?.trim();
  if (useSigned && !signingUrl) {
    const base = import.meta.env.VITE_API_BASE_URL?.trim();
    if (base) signingUrl = `${base.replace(/\/$/, "")}/get_conversation`;
  }

  if (useSigned) {
    if (!signingUrl) {
      throw new Error(
        "Signed URL mode: set VITE_CONVAI_SIGNING_URL or VITE_API_BASE_URL (e.g. http://127.0.0.1:8000) so we can call GET /get_conversation on your FastAPI backend.",
      );
    }
    const r = await fetch(signingUrl, { method: "GET" });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Signed URL request failed (${r.status}): ${t.slice(0, 200)}`);
    }
    const data = await r.json();
    const signedUrl = data.signed_url;
    if (!signedUrl) throw new Error("Response missing signed_url");
    return {
      signedUrl,
      connectionType: "websocket",
    };
  }

  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID?.trim();
  if (!agentId) {
    throw new Error(
      "Set VITE_ELEVENLABS_AGENT_ID (public agent), or VITE_ELEVENLABS_USE_SIGNED_URL=true with VITE_CONVAI_SIGNING_URL or VITE_API_BASE_URL (private agent + FastAPI).",
    );
  }

  // SDK defaults voice to WebRTC; "could not establish pc connection" is common when
  // RTCPeerConnection fails (firewall/VPN/NAT). WebSocket audio avoids that path.
  // Set VITE_ELEVENLABS_CONNECTION_TYPE=webrtc if you explicitly want WebRTC.
  const connectionType =
    import.meta.env.VITE_ELEVENLABS_CONNECTION_TYPE?.trim().toLowerCase() === "webrtc"
      ? "webrtc"
      : "websocket";

  return { agentId, connectionType };
}
