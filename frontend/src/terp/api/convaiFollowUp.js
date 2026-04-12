/**
 * POST after "What's next?"
 *
 * Body should include `preferences` (same object as POST /get_preferences).
 *
 * POST /getCourses returns `{ courses }` (Jupiterp + PlanetTerp). `terpai_scheduling` is disabled on the backend for now.
 */

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

async function postJson(path, payload) {
  const base = apiBase();
  const url = base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : path;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${path} failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}

export function postGetCourses(payload) {
  return postJson("/getCourses", payload);
}

export function postGetPeople(payload) {
  return postJson("/getPeople", payload);
}
