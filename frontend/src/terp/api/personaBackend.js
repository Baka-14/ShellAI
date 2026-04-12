/**
 * POST transcript to FastAPI → Ollama → persona + course_insights.
 * Uses VITE_API_BASE_URL or same-origin /api (Vite proxy).
 */

function personaUrl() {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  return base ? `${base}/api/persona-from-transcript` : "/api/persona-from-transcript";
}

export async function postPersonaFromTranscript({ transcriptText, messages, advisorProfile }) {
  const res = await fetch(personaUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript_text: transcriptText || "",
      messages: messages || [],
      advisor_profile: advisorProfile ?? null,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`persona-from-transcript failed (${res.status}): ${t.slice(0, 300)}`);
  }
  return res.json();
}
