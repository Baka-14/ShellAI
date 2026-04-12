import { C, rgba } from "../../shared/theme.js";
import { ILLUSTRATIVE_UNDECIDED_PEERS } from "../data/undecidedMajorPeers.js";
import { getMajorSelectionPeersBucket } from "../data/majorSelectionPeers.js";

/** @param {Record<string, unknown>} s */
function formatMeetingLine(s) {
  const meets = Array.isArray(s.meetings)
    ? s.meetings
        .map((m) => {
          if (m?.days && m?.start)
            return `${m.days} ${m.start}–${m.end || ""}${m.location ? ` · ${m.location}` : ""}`;
          if (m?.raw) return m.raw;
          return null;
        })
        .filter(Boolean)
    : [];
  return meets[0] || "—";
}

/** @param {Record<string, unknown>} s */
function formatLocationLine(s) {
  const meets = Array.isArray(s.meetings) ? s.meetings : [];
  const m = meets[0];
  if (m?.location) return m.location;
  if (typeof m?.raw === "string" && m.raw.includes("-")) {
    const parts = m.raw.split("-");
    if (parts.length >= 4) return parts.slice(3).join("-").trim() || "TBA";
  }
  return "TBA";
}

/** @param {Record<string, unknown>} s */
function primaryInstructor(s) {
  const inst = Array.isArray(s.instructors) ? s.instructors : [];
  const first = inst[0];
  if (first && typeof first === "object" && first.name) return String(first.name);
  if (typeof first === "string") return first;
  return "Instructor TBA";
}

/**
 * @param {{ s: Record<string, unknown> }} props
 */
function SectionRow({ s }) {
  const meets = Array.isArray(s.meetings)
    ? s.meetings
        .map((m) => {
          if (m?.days && m?.start) return `${m.days} ${m.start}–${m.end || ""}${m.location ? ` · ${m.location}` : ""}`;
          if (m?.raw) return m.raw;
          return null;
        })
        .filter(Boolean)
    : [];
  const inst = Array.isArray(s.instructors) ? s.instructors.map((i) => (i?.name ? i.name : i)).filter(Boolean) : [];
  return (
    <div
      style={{
        fontSize: 12,
        color: C.ink,
        padding: "12px 14px",
        borderTop: `1px solid ${C.border}`,
        background: C.subtle,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 13 }}>Section {s.section_code ?? "—"}</div>
      {inst.length > 0 && <div style={{ color: C.muted, marginTop: 4, fontWeight: 500 }}>{inst.join(", ")}</div>}
      {meets.length > 0 && <div style={{ marginTop: 6, lineHeight: 1.5, color: "#444" }}>{meets.join(" · ")}</div>}
      {s.open_seats != null && s.total_seats != null && (
        <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
          <span style={{ fontWeight: 600, color: C.ink }}>{s.open_seats}</span> / {s.total_seats} seats open
          {s.waitlist != null && s.waitlist > 0 ? ` · ${s.waitlist} waitlist` : ""}
        </div>
      )}
    </div>
  );
}

const SEATS_BAR_H = 6;

/** PlanetTerp /grades letter buckets in display order (excludes `total`). */
const GRADE_DIST_KEYS = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
  "W",
  "Other",
];

/** @param {string} k */
function gradeDistColor(k) {
  if (k === "W" || k === "Other") return "#9ca3af";
  if (k.startsWith("A")) return "#15803d";
  if (k.startsWith("B")) return "#22c55e";
  if (k.startsWith("C")) return "#ca8a04";
  if (k.startsWith("D")) return "#ea580c";
  if (k === "F") return C.red;
  return C.muted;
}

/**
 * Historical grade distribution from PlanetTerp (`grades.aggregated`).
 * @param {{ planetterp: Record<string, unknown> | null | undefined }} props
 */
function GradeDistribution({ planetterp }) {
  if (!planetterp || typeof planetterp !== "object") return null;
  const gradesObj = planetterp.grades;
  const aggregated =
    gradesObj && typeof gradesObj === "object" && gradesObj.aggregated && typeof gradesObj.aggregated === "object"
      ? gradesObj.aggregated
      : null;
  if (!aggregated) return null;

  const total = Number(aggregated.total);
  if (!Number.isFinite(total) || total <= 0) return null;

  const sectionsCount =
    gradesObj && typeof gradesObj === "object" && gradesObj.sections_count != null
      ? Number(gradesObj.sections_count)
      : null;
  const gpa = planetterp.average_gpa != null ? Number(planetterp.average_gpa) : null;
  const gpaLabel = Number.isFinite(gpa) ? gpa.toFixed(2) : null;
  const url = typeof planetterp.url === "string" ? planetterp.url : null;

  const segments = GRADE_DIST_KEYS.map((k) => {
    const n = Number(aggregated[k]);
    const count = Number.isFinite(n) && n > 0 ? n : 0;
    return { key: k, count, pct: total > 0 ? (count / total) * 100 : 0 };
  }).filter((s) => s.count > 0);

  if (segments.length === 0) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>
          Grade distribution
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: C.muted }}>
          {gpaLabel != null && (
            <span>
              Avg GPA <span style={{ fontWeight: 700, color: C.ink }}>{gpaLabel}</span>
            </span>
          )}
          <span>
            <span style={{ fontWeight: 600, color: C.ink }}>{total.toLocaleString()}</span> grades
            {sectionsCount != null && Number.isFinite(sectionsCount) ? ` · ${sectionsCount} section records` : ""}
          </span>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: C.accent2, fontWeight: 600 }}>
              PlanetTerp →
            </a>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          height: 12,
          borderRadius: 4,
          overflow: "hidden",
          marginTop: 8,
          border: `1px solid ${C.border}`,
        }}
        title={segments.map((s) => `${s.key}: ${s.count}`).join(" · ")}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${s.pct}%`,
              minWidth: s.pct > 0.5 ? 2 : 0,
              height: "100%",
              background: gradeDistColor(s.key),
              transition: "width 0.35s ease",
            }}
            title={`${s.key}: ${s.count} (${s.pct.toFixed(1)}%)`}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginTop: 8 }}>
        {segments.map((s) => (
          <span key={s.key} style={{ fontSize: 10, color: C.muted }}>
            <span style={{ fontWeight: 700, color: gradeDistColor(s.key) }}>{s.key}</span> {s.count}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 10, color: rgba(C.muted, 0.95), margin: "6px 0 0", lineHeight: 1.4 }}>
        Historical aggregates from PlanetTerp (UMD reported grades); not specific to your current section.
      </p>
    </div>
  );
}

/** Static seat availability bar (no mock “live” pulse). */
function SeatsBar({ open, total }) {
  const oRaw = Number(open);
  const tRaw = Number(total);
  const o = Number.isFinite(oRaw) && oRaw >= 0 ? oRaw : 0;
  const t = Number.isFinite(tRaw) && tRaw > 0 ? tRaw : 1;
  const pctOpen = Math.min(100, Math.round((o / t) * 100));
  const stress = pctOpen <= 15 ? C.red : pctOpen <= 40 ? "#B8860B" : C.green;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>Seats</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: stress }}>
        {o} / {t}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 80,
          height: SEATS_BAR_H,
          background: C.subtle,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pctOpen}%`,
            height: SEATS_BAR_H,
            background: stress,
            borderRadius: 2,
            transition: "width 0.35s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: C.muted }}>{pctOpen}% open</span>
    </div>
  );
}

/**
 * @param {{
 *   coursesPayload: Record<string, unknown> | null | undefined;
 *   terpaiScheduling: Record<string, unknown> | null | undefined;
 *   showUndecidedMajorPeers?: boolean;
 *   majorSelectionPeersBucket?: string | null;
 * }} props
 *
 * `coursesPayload` = Jupiterp + PlanetTerp only.
 * `terpaiScheduling` = `{ summary?, error?, skipped? }` from TerpAI (separate API object).
 */
export default function JupiterpCoursesSection({
  coursesPayload = null,
  terpaiScheduling = null,
  showUndecidedMajorPeers = false,
  majorSelectionPeersBucket = null,
}) {
  const majorPeers =
    !showUndecidedMajorPeers && majorSelectionPeersBucket ? getMajorSelectionPeersBucket(majorSelectionPeersBucket) : null;
  const schedulingSummary =
    typeof terpaiScheduling?.summary === "string" ? terpaiScheduling.summary.trim() : "";
  const schedulingError =
    typeof terpaiScheduling?.error === "string" ? terpaiScheduling.error.trim() : "";
  const schedulingSkipped =
    typeof terpaiScheduling?.skipped === "string" ? terpaiScheduling.skipped.trim() : "";
  const hasTerpaiBlock = Boolean(schedulingSummary || schedulingError || schedulingSkipped);

  const showCourses = coursesPayload != null && coursesPayload.ok !== false;
  const details = showCourses && Array.isArray(coursesPayload.course_details) ? coursesPayload.course_details : [];

  if (!showCourses && !hasTerpaiBlock) return null;
  if (showCourses && details.length === 0 && !hasTerpaiBlock) return null;

  const level = coursesPayload?.student_level_inferred;
  const policy = typeof coursesPayload?.course_level_policy === "string" ? coursesPayload.course_level_policy : "";
  const showMainHeader = showCourses;

  return (
    <div style={{ marginBottom: 28, animation: "fadeUp 0.35s ease both" }}>
      <style>{`
        .jp-details > summary { list-style: none; }
        .jp-details > summary::-webkit-details-marker { display: none; }
        .jp-details[open] .jp-chevron { transform: rotate(180deg); }
        .jp-sum { list-style: none; cursor: pointer; }
        .jp-sum::-webkit-details-marker { display: none; }
      `}</style>

      {showMainHeader && (
        <div
          style={{
            marginBottom: 20,
            padding: "16px 18px",
            borderRadius: 12,
            background: `linear-gradient(135deg, ${rgba(C.red, 0.06)}, ${rgba(C.accent2, 0.05)})`,
            border: `1px solid ${C.border}`,
          }}
        >
          <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 400, color: C.ink, margin: "0 0 8px" }}>
            Courses matched for you
          </h3>
          <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>
            {level && level !== "unknown" && (
              <>
                <span style={{ fontWeight: 600, color: C.ink }}>{level === "graduate" ? "Graduate" : "Undergraduate"}</span>
                {" · "}
              </>
            )}
            {policy}
          </p>
        </div>
      )}

      {hasTerpaiBlock && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 18px",
            borderRadius: 12,
            background: C.card,
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: C.muted,
              marginBottom: 8,
            }}
          >
            Scheduling insight · TerpAI
          </div>
          {schedulingSummary && (
            <p style={{ fontSize: 14, color: C.ink, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{schedulingSummary}</p>
          )}
          {schedulingError && (
            <p style={{ fontSize: 13, color: C.red, margin: schedulingSummary ? "10px 0 0" : 0, lineHeight: 1.45 }}>
              {schedulingError}
            </p>
          )}
          {!schedulingSummary && !schedulingError && schedulingSkipped && (
            <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>{schedulingSkipped}</p>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {details.map((d, cardIdx) => {
          const sections = Array.isArray(d.sections) ? d.sections : [];
          const first = sections[0] || {};
          const building = formatLocationLine(first);
          const times = formatMeetingLine(first);
          const secCode = first.section_code ?? "—";
          const prof = sections.length ? primaryInstructor(first) : "—";
          const open = first.open_seats;
          const total = first.total_seats;

          const creditMin = d.min_credits;
          const creditMax = d.max_credits;
          const creditLabel =
            creditMin != null
              ? creditMax != null && creditMax !== creditMin
                ? `${creditMin}–${creditMax}`
                : String(creditMin)
              : "—";

          const tagSource = [
            ...(Array.isArray(d.gen_eds) ? d.gen_eds.map((g) => String(g)) : []),
            ...(Array.isArray(d.match_reasons) ? d.match_reasons.map((m) => String(m)) : []),
          ];
          const tags = [...new Set(tagSource)].slice(0, 6);

          return (
            <article
              key={d.course_code}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: "hidden",
                animation: `fadeUp 0.4s ease ${cardIdx * 0.06}s both`,
                transition: "box-shadow 0.2s, border-color 0.2s",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "#d4d0c8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>{d.course_code}</span>
                      <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 8 }}>{prof}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1.1 }}>{creditLabel}</div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>credits</div>
                  </div>
                </div>

                {sections.length > 0 && (
                  <div style={{ display: "flex", gap: 12, marginTop: 14, fontSize: 12, color: C.muted, flexWrap: "wrap", alignItems: "center" }}>
                    <span>{building}</span>
                    <span style={{ color: C.border }}>|</span>
                    <span>{times}</span>
                    <span style={{ color: C.border }}>|</span>
                    <span>
                      Sec {secCode}
                    </span>
                  </div>
                )}

                {open != null && total != null && <SeatsBar open={open} total={total} />}

                <GradeDistribution planetterp={d.planetterp} />

                {showUndecidedMajorPeers && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.muted,
                        marginBottom: 8,
                      }}
                    >
                      Classmates to connect with
                    </div>
                    <p style={{ fontSize: 11, color: rgba(C.muted, 0.95), margin: "0 0 10px", lineHeight: 1.45 }}>
                      Illustrative peers (your major is still open-ended). Each took this course recently — reach out on Terpmail.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ILLUSTRATIVE_UNDECIDED_PEERS.map((peer) => (
                        <div
                          key={peer.terpMail}
                          style={{
                            padding: "10px 12px",
                            background: C.subtle,
                            borderRadius: 8,
                            borderLeft: `3px solid ${C.accent2}`,
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{peer.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{peer.terpMail}</div>
                          <div style={{ fontSize: 12, color: "#444", marginTop: 6, lineHeight: 1.5 }}>
                            Took <strong>{d.course_code}</strong> — happy to compare notes on workload and whether it helped them pick a direction.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {majorPeers && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.muted,
                        marginBottom: 8,
                      }}
                    >
                      Peers in {majorPeers.label}
                    </div>
                    <p style={{ fontSize: 11, color: rgba(C.muted, 0.95), margin: "0 0 10px", lineHeight: 1.45 }}>
                      Illustrative students already in this path (from your goals around major or selection). Fictional Terpmail
                      contacts — each took this course and can speak to fit for the major.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {majorPeers.peers.map((peer) => (
                        <div
                          key={peer.terpMail}
                          style={{
                            padding: "10px 12px",
                            background: C.subtle,
                            borderRadius: 8,
                            borderLeft: `3px solid ${C.red}`,
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{peer.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{peer.terpMail}</div>
                          <div style={{ fontSize: 12, color: "#444", marginTop: 6, lineHeight: 1.5 }}>
                            Took <strong>{d.course_code}</strong> — ask how it mapped to requirements and whether they’d take it again on
                            this track.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14, alignItems: "center" }}>
                    {tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: C.subtle,
                          color: C.muted,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {d.description && (
                  <details style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <summary
                      className="jp-sum"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.accent2,
                      }}
                    >
                      Course description
                    </summary>
                    <p style={{ fontSize: 13, color: "#444", margin: "10px 0 0", lineHeight: 1.65 }}>{String(d.description)}</p>
                  </details>
                )}

                {Array.isArray(d.conditions) && d.conditions.length > 0 && (
                  <details style={{ marginTop: 10 }}>
                    <summary className="jp-sum" style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>
                      Prerequisites & conditions ({d.conditions.length})
                    </summary>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: C.muted, lineHeight: 1.55 }}>
                      {d.conditions.slice(0, 6).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              {sections.length > 0 && (
                <details className="jp-details" style={{ borderTop: `1px solid ${C.border}` }}>
                  <summary
                    style={{
                      padding: "14px 20px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.ink,
                      background: "#fafaf8",
                      userSelect: "none",
                    }}
                  >
                    <span>
                      All sections <span style={{ fontWeight: 500, color: C.muted }}>({sections.length})</span>
                    </span>
                    <span className="jp-chevron" style={{ fontSize: 10, color: C.muted, transition: "transform 0.2s ease" }}>
                      ▼
                    </span>
                  </summary>
                  <div>
                    {sections.map((s, i) => (
                      <SectionRow key={`${d.course_code}-${s.section_code ?? i}`} s={s} />
                    ))}
                  </div>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
