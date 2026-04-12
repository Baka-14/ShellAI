/**
 * True when preferences or advisor JSON suggests the student has not settled on a major.
 * Scans `preferences.goal`, full preferences JSON, and advisor `profile.program` / full advisor JSON.
 *
 * @param {Record<string, unknown> | null | undefined} preferences
 * @param {Record<string, unknown> | null | undefined} advisorProfile
 */
export function preferencesIndicateUndecidedMajor(preferences, advisorProfile) {
  const chunks = [];

  if (preferences && typeof preferences === "object") {
    chunks.push(JSON.stringify(preferences).toLowerCase());
    const g = /** @type {Record<string, unknown> | undefined} */ (preferences).goal;
    if (g && typeof g === "object") chunks.push(JSON.stringify(g).toLowerCase());
  }

  if (advisorProfile && typeof advisorProfile === "object") {
    chunks.push(JSON.stringify(advisorProfile).toLowerCase());
    const prof = /** @type {Record<string, unknown> | undefined} */ (advisorProfile).profile;
    if (prof && typeof prof === "object") {
      chunks.push(String(prof.program ?? "").toLowerCase());
      chunks.push(String(prof.major ?? "").toLowerCase());
    }
  }

  const hay = chunks.join("\n");

  const needles = [
    "undecided",
    "undeclared",
    "no major",
    "haven't declared",
    "have not declared",
    "havent declared",
    "unsure about major",
    "still deciding",
    "open major",
    "pre-major",
    "pre major",
    "letters and sciences",
    "ltsc",
    "exploring major",
    "exploring majors",
    "major tbd",
    "unknown major",
    "figuring out my major",
    "not sure what to major",
    "undecided major",
    "declaring later",
    "haven't picked a major",
    "have not picked a major",
  ];

  return needles.some((n) => hay.includes(n));
}
