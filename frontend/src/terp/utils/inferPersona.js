/**
 * Infer demo persona from structured advisor JSON (post-transcription parse).
 * Maps student goals to: researcher | closer | explorer.
 */

export const PERSONA_IDS = /** @type {const} */ (["researcher", "closer", "explorer"]);

/** @typedef {(typeof PERSONA_IDS)[number]} PersonaId */

/** @param {Record<string, unknown> | null | undefined} ap */
export function inferPersonaFromAdvisor(ap) {
  if (!ap || typeof ap !== "object") return /** @type {PersonaId} */ ("researcher");

  const profile = /** @type {Record<string, unknown>} */ (ap.profile || {});
  const goal = /** @type {Record<string, unknown>} */ (ap.goal || {});
  const prefs = /** @type {Record<string, unknown>} */ (ap.matching_preferences || {});

  const program = String(profile.program ?? "").toLowerCase();
  const year = String(profile.year ?? "").toLowerCase();
  const intent = String(goal.intent ?? "").toLowerCase();
  const mode = String(goal.mode ?? "").toLowerCase();
  const looking = String(prefs.looking_for ?? "").toLowerCase();
  const targetProf = goal.target_professor != null && String(goal.target_professor).trim() !== "";
  const researchExp = goal.research_experience != null && String(goal.research_experience).trim() !== "";
  const exploring = Array.isArray(goal.exploring_areas) && goal.exploring_areas.length > 0;
  const gpaTarget = goal.gpa_target != null && String(goal.gpa_target).trim() !== "";
  const gpaNum = parseFloat(String(profile.gpa ?? "").replace(/[^\d.]/g, ""));

  const explorerSignals =
    mode === "explore" ||
    mode === "exploration" ||
    exploring ||
    program.includes("undeclared") ||
    program.includes("undecided") ||
    program.includes("exploring") ||
    (/\b(sophomore|2nd year|second year)\b/i.test(year + program) &&
      (intent.includes("figure out") || intent.includes("not sure") || intent.includes("try")));

  if (explorerSignals) return /** @type {PersonaId} */ ("explorer");

  const closerSignals =
    mode === "gpa" ||
    mode === "coast" ||
    gpaTarget ||
    intent.includes("3.5") ||
    intent.includes("gpa") ||
    intent.includes("offer") ||
    intent.includes("capital one") ||
    intent.includes("contingent") ||
    intent.includes("last semester") ||
    (Number.isFinite(gpaNum) && gpaNum < 3.55 && (/\b(senior|4th|last)\b/i.test(year + intent) || intent.includes("graduate")));

  if (closerSignals) return /** @type {PersonaId} */ ("closer");

  const researcherSignals =
    mode === "research" ||
    looking.includes("research") ||
    looking.includes("collaborat") ||
    looking.includes("lab") ||
    targetProf ||
    researchExp ||
    intent.includes("publish") ||
    intent.includes("venue") ||
    intent.includes("icml") ||
    intent.includes("paper") ||
    intent.includes("lab");

  if (researcherSignals) return /** @type {PersonaId} */ ("researcher");

  if (mode === "career") return /** @type {PersonaId} */ ("closer");
  return /** @type {PersonaId} */ ("researcher");
}

export const PERSONA_COPY = {
  researcher: {
    title: "The Researcher",
    blurb:
      "Terp is prioritizing co-publication culture, lab capacity, Scholar signals, and peers who already ship papers — so every course card doubles as a research map.",
  },
  closer: {
    title: "The Closer",
    blurb:
      "Terp is optimizing for GPA lift, curve-friendly sections, and workload you can actually survive — simulations and %A bars lead every recommendation.",
  },
  explorer: {
    title: "The Explorer",
    blurb:
      "Terp is surfacing cross-major tasters, where each path leads, and people who already chose CS vs Data vs INFO — ask them why.",
  },
};
