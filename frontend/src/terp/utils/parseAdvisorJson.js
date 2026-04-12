/**
 * Extract advisor JSON from agent text (final message may be raw JSON or ```json ... ```).
 * @param {string} text
 * @returns {object | null}
 */
export function parseAdvisorOutputFromText(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** True if parsed object looks like our advisor shape (has profile + goal). */
export function isAdvisorShape(obj) {
  return Boolean(obj && typeof obj === "object" && obj.profile && obj.goal);
}

/**
 * True when all top-level sections exist (what we need for hub / matching).
 * Stricter than {@link isAdvisorShape}; use to auto-end ConvAI when JSON is complete.
 */
export function isAdvisorComplete(obj) {
  if (!isAdvisorShape(obj)) return false;
  const sections = ["constraints", "personal", "matching_preferences"];
  for (const k of sections) {
    const v = obj[k];
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  }
  return true;
}
