import { C, rgba } from "../../shared/theme.js";

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: C.ink }}>{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ color: C.muted, fontSize: 12 }}>{label}: </span>
      <span style={{ fontWeight: 500 }}>{display}</span>
    </div>
  );
}

function BoolRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ color: C.muted, fontSize: 12 }}>{label}: </span>
      <span style={{ fontWeight: 500 }}>{value ? "Yes" : "No"}</span>
    </div>
  );
}

/**
 * Renders structured advisor output (profile, goal, constraints, personal, matching_preferences).
 */
export default function AdvisorProfilePanel({ data, demoLabel }) {
  if (!data) return null;
  const p = data.profile || {};
  const g = data.goal || {};
  const c = data.constraints || {};
  const per = data.personal || {};
  const m = data.matching_preferences || {};

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "18px 18px 14px",
        marginBottom: 16,
        animation: "fadeUp 0.35s ease both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>Advisor intake</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Structured output (for courses &amp; Circle)</div>
        </div>
        {demoLabel && (
          <span style={{ fontSize: 10, fontWeight: 600, color: C.accent2, background: rgba(C.accent2, 0.08), padding: "3px 8px", borderRadius: 4 }}>{demoLabel}</span>
        )}
      </div>

      <Section title="Profile">
        <Row label="Program" value={p.program} />
        <Row label="Year" value={p.year} />
        <Row label="GPA" value={p.gpa} />
        <Row label="Courses taken" value={p.courses_taken} />
        <Row label="Courses wanted" value={p.num_courses_wanted} />
      </Section>

      <Section title="Goal">
        <Row label="Mode" value={g.mode} />
        <Row label="Area" value={g.area} />
        <Row label="Target professor" value={g.target_professor} />
        <Row label="Research experience" value={g.research_experience} />
        <Row label="Intent" value={g.intent} />
        <Row label="GPA target" value={g.gpa_target} />
        <Row label="Exploring" value={g.exploring_areas} />
      </Section>

      <Section title="Constraints">
        <BoolRow label="No early classes" value={c.no_early_classes} />
        <Row label="Preferred days" value={c.preferred_days} />
        <Row label="Free days" value={c.free_days} />
        <Row label="Other" value={c.other} />
      </Section>

      <Section title="Personal">
        <Row label="Hometown" value={per.hometown} />
        <Row label="Hobbies" value={per.hobbies} />
        <Row label="Clubs" value={per.clubs} />
        <Row label="Social" value={per.social_preference} />
        <Row label="Other" value={per.other_context} />
      </Section>

      <Section title="Matching">
        <Row label="Looking for" value={m.looking_for} />
        <BoolRow label="Existing network" value={m.existing_network} />
      </Section>
    </div>
  );
}
