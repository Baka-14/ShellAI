import { useState } from "react";
import { C } from "../theme.js";
import FilterBar from "./FilterBar.jsx";

export default function GoalDonut() {
  const [selected, setSelected] = useState(-1);
  const [semester, setSemester] = useState("fall26");
  const semData = {
    fall26: [
      { label: "Coast & GPA", v: 32, c: C.red, top: "CMSC 451, DATA 606, CMSC 434", trend: "↑ 4% from Spring", trendC: C.green },
      { label: "Skill Build", v: 28, c: C.blue, top: "CMSC 723, CMSC 828A, CMSC 421", trend: "Stable", trendC: C.muted },
      { label: "Research", v: 18, c: C.green, top: "CMSC 828A, CMSC 764, CMSC 818J", trend: "↓ 6% — needs attention", trendC: C.red },
      { label: "Balanced", v: 12, c: C.gold, top: "DATA 604, CMSC 330, INST 737", trend: "↑ 2%", trendC: C.green },
      { label: "Explore", v: 10, c: C.accent2, top: "CMSC 425, INST 767, CMSC 434", trend: "Stable", trendC: C.muted },
    ],
    spring26: [
      { label: "Coast & GPA", v: 28, c: C.red, top: "CMSC 351, DATA 605, CMSC 420", trend: "Was lower", trendC: C.muted },
      { label: "Skill Build", v: 30, c: C.blue, top: "CMSC 723, CMSC 726, CMSC 421", trend: "Was higher", trendC: C.muted },
      { label: "Research", v: 24, c: C.green, top: "CMSC 828A, CMSC 764", trend: "Was 24% — now 18%", trendC: C.red },
      { label: "Balanced", v: 10, c: C.gold, top: "DATA 603, CMSC 216", trend: "Stable", trendC: C.muted },
      { label: "Explore", v: 8, c: C.accent2, top: "CMSC 425, INST 737", trend: "Stable", trendC: C.muted },
    ],
  };
  const segments = semData[semester];
  const total = segments.reduce((a, s) => a + s.v, 0);
  const size = 110;
  const r = 40;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Goal mode distribution</div>
      <FilterBar
        value={semester}
        onChange={(v) => {
          setSemester(v);
          setSelected(-1);
        }}
        options={[
          { id: "fall26", label: "Fall 2026" },
          { id: "spring26", label: "Spring 2026" },
        ]}
      />
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ cursor: "pointer", flexShrink: 0 }}>
          {(() => {
            let c2 = 0;
            return segments.map((s, i) => {
              const start = (c2 / total) * Math.PI * 2 - Math.PI / 2;
              c2 += s.v;
              const end = (c2 / total) * Math.PI * 2 - Math.PI / 2;
              const large = s.v / total > 0.5 ? 1 : 0;
              const d = `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}`;
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={s.c}
                  strokeWidth={selected === i ? 14 : 10}
                  opacity={selected === -1 || selected === i ? 1 : 0.15}
                  style={{ cursor: "pointer", transition: "all 0.25s" }}
                  onClick={() => setSelected(selected === i ? -1 : i)}
                />
              );
            });
          })()}
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="600" fill={C.ink}>
            {selected >= 0 ? `${segments[selected].v}%` : total}
          </text>
        </svg>
        <div style={{ flex: 1 }}>
          {selected >= 0 ? (
            <div style={{ animation: "fadeUp 0.15s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: segments[selected].c }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{segments[selected].label}</span>
              </div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>Top courses: {segments[selected].top}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: segments[selected].trendC }}>{segments[selected].trend}</div>
              <button type="button" onClick={() => setSelected(-1)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.muted, padding: 0 }}>
                ← Back to overview
              </button>
            </div>
          ) : (
            <div>
              {segments.map((s, i) => (
                <div key={i} onClick={() => setSelected(i)} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, cursor: "pointer", padding: "2px 0" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />
                  <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{s.v}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
