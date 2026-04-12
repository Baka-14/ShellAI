import { useState, useMemo } from "react";
import { C, rgba } from "../../shared/theme.js";

const GRADES = [
  { key: "A", pts: 4 },
  { key: "A-", pts: 3.7 },
  { key: "B+", pts: 3.3 },
  { key: "B", pts: 3 },
  { key: "B-", pts: 2.7 },
  { key: "C+", pts: 2.3 },
  { key: "C", pts: 2 },
];

function parseGpa(s) {
  const n = parseFloat(String(s).replace(/[^\d.]/g, ""), 10);
  return Number.isFinite(n) ? clamp(n, 0, 4) : 3.5;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Simple semester GPA projection: assumes fixed credits per line (default 3).
 */
export default function GpaSimulator({ baselineGpaStr, courses }) {
  const [priorGpa, setPriorGpa] = useState(() => parseGpa(baselineGpaStr || "3.5"));
  const [priorCredits, setPriorCredits] = useState(60);
  const [picked, setPicked] = useState(() => {
    const o = {};
    (courses || []).forEach((c) => {
      o[c.course] = "A";
    });
    return o;
  });

  const rows = courses || [];

  const projected = useMemo(() => {
    let addPts = 0;
    let addCr = 0;
    rows.forEach((c) => {
      const cr = c.credits || 3;
      const g = GRADES.find((x) => x.key === picked[c.course]) || GRADES[0];
      addPts += g.pts * cr;
      addCr += cr;
    });
    const priorPts = priorGpa * priorCredits;
    const totalCr = priorCredits + addCr;
    if (totalCr <= 0) return priorGpa;
    return (priorPts + addPts) / totalCr;
  }, [picked, priorGpa, priorCredits, rows]);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 4 }}>GPA outlook (simulator)</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Hypothetical grades for this plan — not official.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14, alignItems: "flex-end" }}>
        <label style={{ fontSize: 11, color: C.muted }}>
          Cumulative GPA
          <input
            type="number"
            step="0.01"
            min={0}
            max={4}
            value={priorGpa}
            onChange={(e) => setPriorGpa(clamp(parseFloat(e.target.value, 10) || 0, 0, 4))}
            style={{ display: "block", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, width: 88, fontSize: 13 }}
          />
        </label>
        <label style={{ fontSize: 11, color: C.muted }}>
          Credits completed
          <input
            type="number"
            min={0}
            step={1}
            value={priorCredits}
            onChange={(e) => setPriorCredits(Math.max(0, parseInt(e.target.value, 10) || 0))}
            style={{ display: "block", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, width: 88, fontSize: 13 }}
          />
        </label>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Projected cumulative</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: "-0.03em" }}>{projected.toFixed(3)}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((c) => (
          <div key={c.course} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, minWidth: 100 }}>{c.course}</span>
            <span style={{ fontSize: 11, color: C.muted, flex: 1, minWidth: 120 }}>{c.title}</span>
            <select
              value={picked[c.course] || "A"}
              onChange={(e) => setPicked((p) => ({ ...p, [c.course]: e.target.value }))}
              style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, background: "#fff" }}
            >
              {GRADES.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.key} ({g.pts})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
