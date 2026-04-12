/**
 * “People in related research areas” only when copy sounds like **exploring research domain(s)**,
 * not generic “research” interest alone.
 */

/**
 * @param {string} text
 */
export function textIndicatesExploringResearchDomains(text) {
  const s = String(text).toLowerCase().replace(/\s+/g, " ").trim();
  if (!s) return false;
  if (/\bresearch\s+domains?\b/.test(s)) return true;
  if (/\bexploring\s+research\b/.test(s)) return true;
  if (/\bexplore\s+research\s+domains?\b/.test(s)) return true;
  if (/\bexplor(e|ing)\s+(a\s+)?research\s+domain/.test(s)) return true;
  return false;
}

/**
 * @param {Record<string, unknown> | null | undefined} preferences
 */
export function preferencesIndicateResearchExploration(preferences) {
  if (!preferences || typeof preferences !== "object") return false;
  const parts = [];
  const g = /** @type {Record<string, unknown> | undefined} */ (preferences).goal;
  if (g && typeof g === "object") {
    parts.push(String(g.statement ?? ""));
    const targets = /** @type {unknown} */ (g).targets;
    if (Array.isArray(targets)) parts.push(...targets.map((t) => String(t)));
  }
  const interests = /** @type {unknown} */ (preferences).interests;
  if (Array.isArray(interests)) parts.push(...interests.map((x) => String(x)));
  const keywords = /** @type {unknown} */ (preferences).interest_keywords;
  if (Array.isArray(keywords)) parts.push(...keywords.map((x) => String(x)));

  const blob = parts.join(" · ");
  if (textIndicatesExploringResearchDomains(blob)) return true;
  return false;
}

/**
 * @param {Record<string, unknown> | null | undefined} ap
 */
export function advisorProfileIndicatesResearchExploration(ap) {
  if (!ap || typeof ap !== "object") return false;
  const goal = /** @type {Record<string, unknown>} */ (ap.goal || {});
  const intent = String(goal.intent ?? "");
  const modeLine = String(goal.mode ?? "");
  if (textIndicatesExploringResearchDomains(intent)) return true;
  if (textIndicatesExploringResearchDomains(modeLine)) return true;
  if (Array.isArray(goal.exploring_areas)) {
    const joined = goal.exploring_areas.map((x) => String(x)).join(" · ");
    if (textIndicatesExploringResearchDomains(joined)) return true;
  }
  try {
    if (textIndicatesExploringResearchDomains(JSON.stringify(goal))) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * @param {Record<string, unknown> | null | undefined} preferences
 * @param {Record<string, unknown> | null | undefined} advisorProfile
 */
export function shouldShowResearchPeople(preferences, advisorProfile) {
  if (preferencesIndicateResearchExploration(preferences)) return true;
  if (advisorProfileIndicatesResearchExploration(advisorProfile)) return true;
  return false;
}

export { resolveResearchPeopleBucket } from "../data/researchDomainPeople.js";
