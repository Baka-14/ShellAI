/**
 * After ConvAI ends, fetch canonical conversation payload from your FastAPI backend
 * (ElevenLabs server-side get), so the transcript can include the full API record.
 *
 * Default path matches `backend/main.py`: GET /conversation/{conversation_id}
 *
 * Note: GET /get_conversation on the same backend returns a *signed WebSocket URL* for
 * *starting* a session — not the ended conversation. Use /conversation/{id} for history.
 *
 * Optional: VITE_BACKEND_CONVERSATION_PATH=/get_conversation with query style:
 *   GET /get_conversation?conversation_id=...  (requires your backend to implement it)
 */

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

/**
 * @param {string | null | undefined} conversationId
 * @returns {Promise<Record<string, unknown> | null>}
 */
/**
 * Bitcamp-style signed URL bootstrap (same as GET /get_conversation on your FastAPI app).
 * Not the ended transcript — useful only if you need a fresh signed_url after the call.
 */
export async function fetchGetConversationRoute() {
  const base = apiBase();
  const url = base ? `${base}/get_conversation` : "/get_conversation";
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GET /get_conversation failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchConversationDetailAfterSession(conversationId) {
  if (!conversationId || typeof conversationId !== "string") return null;

  const base = apiBase();
  const pathTemplate = (import.meta.env.VITE_BACKEND_CONVERSATION_PATH ?? "/conversation").trim();

  let url;
  if (pathTemplate.includes("{id}") || pathTemplate.includes("{conversation_id}")) {
    url = pathTemplate
      .replace("{conversation_id}", encodeURIComponent(conversationId))
      .replace("{id}", encodeURIComponent(conversationId));
    url = base ? `${base}${url.startsWith("/") ? "" : "/"}${url}` : url;
  } else if (pathTemplate === "/get_conversation" || pathTemplate.endsWith("get_conversation")) {
    const p = pathTemplate.startsWith("/") ? pathTemplate : `/${pathTemplate}`;
    const q = `conversation_id=${encodeURIComponent(conversationId)}`;
    url = base ? `${base}${p}?${q}` : `${p}?${q}`;
  } else {
    const prefix = pathTemplate.replace(/\/$/, "");
    url = base ? `${base}${prefix}/${encodeURIComponent(conversationId)}` : `${prefix}/${encodeURIComponent(conversationId)}`;
  }

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Conversation fetch failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}
