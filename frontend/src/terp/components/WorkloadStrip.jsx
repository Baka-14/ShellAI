import { C, rgba } from "../../shared/theme.js";

/** Relative workload visualization from credits × heuristic difficulty. */
export default function WorkloadStrip({ courses }) {
  const rows = (courses || []).map((c) => ({
    code: c.course,
    w: (c.credits || 3) * (1 + (100 - (c.pctA || 50)) / 200),
  }));
  const max = Math.max(...rows.map((r) => r.w), 1);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Relative load (mock)</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Heuristic from credits and historical %A (higher = heavier)</div>
      {rows.map((r) => (
        <div key={r.code} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.ink, width: 88 }}>{r.code}</span>
          <div style={{ flex: 1, height: 8, background: C.subtle, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(r.w / max) * 100}%`, height: "100%", background: rgba(C.red, 0.65), borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
