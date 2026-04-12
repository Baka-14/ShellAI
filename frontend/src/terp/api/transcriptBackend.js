/**
 * POST session transcript to FastAPI (optional). Enable with VITE_SUBMIT_TRANSCRIPTS=true.
 * Uses VITE_API_BASE_URL when set; otherwise same-origin /api/transcripts (Vite dev proxy).
 */

export async function postSessionTranscript(payload) {
  if (import.meta.env.VITE_SUBMIT_TRANSCRIPTS !== "true") return;

  const base = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  const url = base ? `${base}/api/transcripts` : "/api/transcripts";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Transcript POST failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}
