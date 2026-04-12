import { C, rgba } from "../../shared/theme.js";

export default function AlternativesPanel({ alternatives }) {
  if (!alternatives?.length) return null;
  return (
    <div style={{ marginTop: 12, padding: "12px 14px", background: rgba(C.accent2, 0.04), borderRadius: 8, border: `1px solid ${rgba(C.accent2, 0.15)}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.accent2, marginBottom: 8 }}>Alternatives</div>
      {alternatives.map((a) => (
        <div key={a.course} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
            {a.course} · {a.title}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{a.times}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{a.reason}</div>
        </div>
      ))}
    </div>
  );
}
