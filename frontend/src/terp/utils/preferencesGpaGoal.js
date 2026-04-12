/**
 * GPA calculator on **Your courses** only when the **goal** explicitly mentions GPA
 * (structured `preferences.goal` or advisor `goal` fields).
 */

/**
 * @param {Record<string, unknown> | null | undefined} preferences
 */
export function preferencesIndicateGpaGoal(preferences) {
  if (!preferences || typeof preferences !== "object") return false;
  const g = /** @type {Record<string, unknown> | undefined} */ (preferences).goal;
  if (!g || typeof g !== "object") return false;
  const statement = String(g.statement ?? "");
  const targets = /** @type {unknown} */ (g).targets;
  const targetStr = Array.isArray(targets) ? targets.map((t) => String(t)).join(" ") : "";
  const blob = `${statement} ${targetStr}`.toLowerCase();
  return blob.includes("gpa");
}

/**
 * Advisor JSON: only when goal clearly references GPA (text or structured fields).
 * @param {Record<string, unknown> | null | undefined} ap
 */
export function advisorProfileIndicatesGpaGoal(ap) {
  if (!ap || typeof ap !== "object") return false;
  const goal = /** @type {Record<string, unknown>} */ (ap.goal || {});
  if (goal.gpa_target != null && String(goal.gpa_target).trim() !== "") return true;
  const mode = String(goal.mode ?? "").toLowerCase();
  if (mode === "gpa") return true;
  const intent = String(goal.intent ?? "").toLowerCase();
  if (intent.includes("gpa")) return true;
  try {
    const goalJson = JSON.stringify(goal).toLowerCase();
    return goalJson.includes("gpa");
  } catch {
    return false;
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} preferences
 * @param {Record<string, unknown> | null | undefined} advisorProfile
 */
export function shouldShowGpaCalculator(preferences, advisorProfile) {
  if (preferencesIndicateGpaGoal(preferences)) return true;
  if (advisorProfileIndicatesGpaGoal(advisorProfile)) return true;
  return false;
}
