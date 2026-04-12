import { useState, useMemo, useEffect } from "react";
import { C } from "../../shared/theme.js";

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
 * Cumulative GPA projection: (sum of prior grade points + sum of hypothetical line items)
 * divided by (prior credits + credits for selected courses). User enters **current** cumulative GPA and completed credits.
 */
export default function GpaSimulator({ baselineGpaStr, courses }) {
  const [priorGpa, setPriorGpa] = useState(() => parseGpa(baselineGpaStr || "3.5"));
  const [priorCredits, setPriorCredits] = useState(60);
  const rows = courses || [];

  const [picked, setPicked] = useState(() => {
    const o = {};
    rows.forEach((c) => {
      o[c.course] = "A";
    });
    return o;
  });

  const [rowCredits, setRowCredits] = useState(() => {
    const o = {};
    rows.forEach((c) => {
      o[c.course] = Number.isFinite(Number(c.credits)) ? Number(c.credits) : 3;
    });
    return o;
  });

  useEffect(() => {
    const s = baselineGpaStr;
    if (s != null && String(s).trim() !== "") {
      setPriorGpa(parseGpa(s));
    }
  }, [baselineGpaStr]);

  const { projected, addPts, addCr, priorPts } = useMemo(() => {
    let ap = 0;
    let ac = 0;
    rows.forEach((c) => {
      const cr = Math.max(0, Number(rowCredits[c.course]) || 0);
      const g = GRADES.find((x) => x.key === picked[c.course]) || GRADES[0];
      ap += g.pts * cr;
      ac += cr;
    });
    const pp = priorGpa * priorCredits;
    const totalCr = priorCredits + ac;
    const proj = totalCr <= 0 ? priorGpa : (pp + ap) / totalCr;
    return { projected: proj, addPts: ap, addCr: ac, priorPts: pp };
  }, [picked, priorGpa, priorCredits, rows, rowCredits]);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 16px", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 4 }}>GPA outlook (simulator)</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, lineHeight: 1.45 }}>
        Enter your <strong>current cumulative GPA</strong> and <strong>credits completed so far</strong>. Then set hypothetical grades (and credits per line if not 3).
        Projected GPA = (prior grade points + points from rows below) ÷ (prior credits + credits in rows).
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14, alignItems: "flex-end" }}>
        <label style={{ fontSize: 11, color: C.muted }}>
          Current cumulative GPA
          <input
            type="number"
            step="0.01"
            min={0}
            max={4}
            value={priorGpa}
            onChange={(e) => setPriorGpa(clamp(parseFloat(e.target.value, 10) || 0, 0, 4))}
            style={{ display: "block", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, width: 96, fontSize: 13 }}
          />
        </label>
        <label style={{ fontSize: 11, color: C.muted }}>
          Credits completed (before these courses)
          <input
            type="number"
            min={0}
            step={1}
            value={priorCredits}
            onChange={(e) => setPriorCredits(Math.max(0, parseInt(e.target.value, 10) || 0))}
            style={{ display: "block", marginTop: 4, padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, width: 96, fontSize: 13 }}
          />
        </label>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Projected cumulative</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: "-0.03em" }}>{projected.toFixed(3)}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 12, lineHeight: 1.4 }}>
        Check: prior pts = {priorGpa.toFixed(3)} × {priorCredits} = {priorPts.toFixed(2)} · this plan +{addPts.toFixed(2)} pts / +{addCr} cr → total{" "}
        {(priorPts + addPts).toFixed(2)} pts / {priorCredits + addCr} cr
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((c) => (
          <div key={c.course} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, minWidth: 100 }}>{c.course}</span>
            <span style={{ fontSize: 11, color: C.muted, flex: 1, minWidth: 120 }}>{c.title}</span>
            <label style={{ fontSize: 10, color: C.muted }}>
              Cr
              <input
                type="number"
                min={0}
                max={20}
                step={1}
                value={rowCredits[c.course] ?? 3}
                onChange={(e) =>
                  setRowCredits((rc) => ({
                    ...rc,
                    [c.course]: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
                style={{ display: "block", marginTop: 2, padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, width: 52, fontSize: 12 }}
              />
            </label>
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
