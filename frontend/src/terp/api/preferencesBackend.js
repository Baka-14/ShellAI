/**
 * POST session transcript to FastAPI `/get_preferences` so an LLM can infer user preferences.
 * Uses VITE_API_BASE_URL when set; otherwise same-origin `/get_preferences` (Vite dev proxy).
 *
 * Payload shape matches ConvaiSession sessionEndPayload (messages, advisor_profile, etc.).
 * The browser waits on this response before preferencesReview; Ollama runs synchronously on the server.
 */

export async function postGetPreferences(payload) {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  const url = base ? `${base}/get_preferences` : "/get_preferences";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`get_preferences failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}
