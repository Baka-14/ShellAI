import { preferencesIndicateUndecidedMajor } from "./preferencesUndecidedMajor.js";

/**
 * @param {Record<string, unknown> | null | undefined} preferences
 * @param {Record<string, unknown> | null | undefined} advisorProfile
 */
function buildHaystack(preferences, advisorProfile) {
  const chunks = [];

  if (preferences && typeof preferences === "object") {
    chunks.push(JSON.stringify(preferences).toLowerCase());
    const g = /** @type {Record<string, unknown> | undefined} */ (preferences).goal;
    if (g && typeof g === "object") {
      chunks.push(JSON.stringify(g).toLowerCase());
      chunks.push(String(g.intent ?? "").toLowerCase());
      chunks.push(String(g.mode ?? "").toLowerCase());
    }
    const pp = /** @type {Record<string, unknown> | undefined} */ (preferences).profile;
    if (pp && typeof pp === "object") chunks.push(JSON.stringify(pp).toLowerCase());
  }

  if (advisorProfile && typeof advisorProfile === "object") {
    chunks.push(JSON.stringify(advisorProfile).toLowerCase());
    const prof = /** @type {Record<string, unknown> | undefined} */ (advisorProfile).profile;
    if (prof && typeof prof === "object") {
      chunks.push(String(prof.program ?? "").toLowerCase());
      chunks.push(String(prof.major ?? "").toLowerCase());
      chunks.push(String(prof.year ?? "").toLowerCase());
    }
    const ag = /** @type {Record<string, unknown> | undefined} */ (advisorProfile).goal;
    if (ag && typeof ag === "object") {
      chunks.push(String(ag.intent ?? "").toLowerCase());
      chunks.push(String(ag.mode ?? "").toLowerCase());
    }
  }

  return chunks.join("\n");
}

/**
 * Undergrad-ish: year text, profile fields, or explicit wording (not graduate-only).
 * @param {string} hay
 * @param {Record<string, unknown> | null | undefined} advisorProfile
 */
function profileSuggestsUndergrad(preferences, advisorProfile) {
  const profiles = [];
  const ap = advisorProfile && typeof advisorProfile === "object" ? advisorProfile.profile : null;
  if (ap && typeof ap === "object") profiles.push(ap);
  const pp = preferences && typeof preferences === "object" ? preferences.profile : null;
  if (pp && typeof pp === "object") profiles.push(pp);
  for (const prof of profiles) {
    const y = String(prof.year ?? "").toLowerCase();
    if (/^[1-3]$/.test(y.trim())) return true;
    if (/\b(freshman|sophomore|junior)\b/.test(y)) return true;
  }
  return false;
}

function looksLikeUndergrad(hay, preferences, advisorProfile) {
  if (profileSuggestsUndergrad(preferences, advisorProfile)) return true;

  if (/\b(graduate|grad student|master'?s|ph\.?d|doctoral)\b/.test(hay) && !/\bundergrad|undergraduate\b/.test(hay)) {
    const prof = advisorProfile && typeof advisorProfile === "object" ? advisorProfile.profile : null;
    const y = prof && typeof prof === "object" ? String(prof.year ?? "").toLowerCase() : "";
    if (y.includes("grad") || y.includes("master") || y.includes("phd")) return false;
  }
  return (
    /\b(undergrad|undergraduate|freshman|sophomore|first year|second year|junior year 1|u1|u2)\b/.test(hay) ||
    /\b(year|class)\s*[:=]?\s*['"]?[1234]\b/.test(hay) ||
    /\"year\"\s*:\s*['"]?[1234]/.test(hay) ||
    /\bstudent_level\b.*undergrad/.test(hay)
  );
}

const STRONG_MAJOR_SELECTION = [
  "major selection",
  "selection of a major",
  "selecting a major",
  "select a major",
  "choosing a major",
  "choose a major",
  "choose my major",
  "pick a major",
  "picking a major",
  "finding a major",
  "find a major",
  "find my major",
  "what major",
  "which major",
  "declare a major",
  "declaring a major",
  "explore majors",
  "exploring majors",
  "compare majors",
  "between majors",
  "switch majors",
  "switching majors",
  "change my major",
  "transfer to a major",
];

/**
 * True when goals/preferences read as major exploration / selection (undergrad-oriented),
 * but not the dedicated “undecided” case (that uses its own peer list).
 *
 * @param {Record<string, unknown> | null | undefined} preferences
 * @param {Record<string, unknown> | null | undefined} advisorProfile
 */
export function preferencesIndicateMajorSelectionPeers(preferences, advisorProfile) {
  if (preferencesIndicateUndecidedMajor(preferences, advisorProfile)) return false;

  const hay = buildHaystack(preferences, advisorProfile);
  if (!hay.trim()) return false;

  if (STRONG_MAJOR_SELECTION.some((p) => hay.includes(p))) return true;

  const ug = looksLikeUndergrad(hay, preferences, advisorProfile);
  if (!ug) return false;

  const hasMajor = /\bmajor\b/.test(hay);
  const selectionWord =
    hay.includes("selection") ||
    hay.includes("selecting") ||
    hay.includes("selector") ||
    hay.includes("choose") ||
    hay.includes("choosing") ||
    hay.includes("decid") ||
    hay.includes("pick ") ||
    hay.includes("picking");

  const findingMajor =
    (hay.includes("find") || hay.includes("finding") || hay.includes("figure out") || hay.includes("figuring out")) &&
    hasMajor;

  return hasMajor && (selectionWord || findingMajor);
}

/**
 * Infer which hardcoded peer bucket to show from text (course codes, program names).
 *
 * @param {Record<string, unknown> | null | undefined} preferences
 * @param {Record<string, unknown> | null | undefined} advisorProfile
 * @returns {"cs"|"data"|"info"|"math"|"default"}
 */
export function resolveMajorSelectionPeerBucket(preferences, advisorProfile) {
  const hay = buildHaystack(preferences, advisorProfile);

  if (/\bcmsc\b|\bcomsc\b|computer science|\bcomp sci\b|\bcs major\b|\bcs degree\b/.test(hay)) return "cs";
  if (/\bdata science\b|\bdata sci\b|\bmsds\b|\bdatascience\b/.test(hay)) return "data";
  if (/\binformatics\b|\binfo sci\b|\binst\b|\binfo major\b/.test(hay)) return "info";
  if (/\bmath\b|\bmathematics\b|\bmth\b/.test(hay)) return "math";

  return "default";
}
