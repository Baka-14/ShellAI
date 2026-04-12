import { C, rgba } from "../theme.js";

export default function Alerts() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Action items</div>
      {[
        { icon: "🔴", text: "CMSC 828A at 92% demand — consider adding a section", action: "Review", color: C.red },
        { icon: "🟡", text: "12 at-risk students flagged in MSDS cohort", action: "View", color: "#B8860B" },
        { icon: "🟢", text: "Research mode up 3% after nudge adjustment", action: "Details", color: C.green },
        { icon: "🔵", text: "New interdisciplinary AI program — 89 students exploring", action: "Promote", color: C.blue },
      ].map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: rgba(a.color, 0.03),
            borderRadius: 6,
            border: `1px solid ${rgba(a.color, 0.08)}`,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 13 }}>{a.icon}</span>
          <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{a.text}</span>
          <button type="button" style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", color: a.color }}>
            {a.action}
          </button>
        </div>
      ))}
    </div>
  );
}
