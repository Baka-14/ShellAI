import { useState, useEffect, useRef } from "react";

const C = {
  red: "#E21833", gold: "#FFD520", ink: "#111110", bg: "#F7F7F5",
  card: "#FFFFFF", border: "#E5E3DD", muted: "#8A8880", subtle: "#F3F1EC",
  green: "#1A7F37", accent2: "#5B4FCF", blue: "#2563EB",
};
const rgba = (h, a) => { const v = parseInt(h.slice(1), 16); return `rgba(${(v>>16)&255},${(v>>8)&255},${v&255},${a})`; };

function Flag({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: size * 0.2, overflow: "hidden", flexShrink: 0 }}>
      <rect x="0" y="0" width="50" height="50" fill="#FFD520" /><polygon points="0,0 25,25 50,0" fill="#111" /><polygon points="0,50 25,25 50,50" fill="#111" />
      <rect x="50" y="50" width="50" height="50" fill="#FFD520" /><polygon points="50,50 75,75 100,50" fill="#111" /><polygon points="50,100 75,75 100,100" fill="#111" />
      <rect x="50" y="0" width="50" height="50" fill="#FFF" /><rect x="62" y="8" width="26" height="8" fill="#A51C30" rx="1" /><rect x="71" y="4" width="8" height="42" fill="#A51C30" rx="1" />
      <circle cx="63" cy="12" r="4" fill="#A51C30" /><circle cx="87" cy="12" r="4" fill="#A51C30" /><circle cx="75" cy="5" r="4" fill="#A51C30" /><circle cx="75" cy="44" r="4" fill="#A51C30" />
      <rect x="0" y="50" width="50" height="50" fill="#FFF" /><rect x="12" y="58" width="26" height="8" fill="#A51C30" rx="1" /><rect x="21" y="54" width="8" height="42" fill="#A51C30" rx="1" />
      <circle cx="13" cy="62" r="4" fill="#A51C30" /><circle cx="37" cy="62" r="4" fill="#A51C30" /><circle cx="25" cy="55" r="4" fill="#A51C30" /><circle cx="25" cy="94" r="4" fill="#A51C30" />
    </svg>
  );
}

// ─── Filter pill ───
function FilterBar({ options, value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {label && <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>}
      <div style={{ display: "flex", gap: 3, background: C.subtle, borderRadius: 6, padding: 2 }}>
        {options.map(o => (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: "4px 12px", borderRadius: 4, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: value === o.id ? 600 : 400, transition: "all 0.15s",
            background: value === o.id ? C.card : "transparent",
            color: value === o.id ? C.ink : C.muted,
            boxShadow: value === o.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Animated KPI ───
function KpiRow() {
  const [vals, setVals] = useState({ a: 0, b: 0, c: 0, d: 0 });
  const targets = { a: 2847, b: 8241, c: 1456, d: 4.3 };
  useEffect(() => {
    const dur = 1400, start = Date.now();
    const frame = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setVals({ a: Math.round(targets.a * e), b: Math.round(targets.b * e), c: Math.round(targets.c * e), d: +(targets.d * e).toFixed(1) });
      if (t < 1) requestAnimationFrame(frame);
    };
    frame();
  }, []);
  const items = [
    { label: "Active users", value: vals.a.toLocaleString(), change: "+12%", spark: [20,22,25,28,32,35,38,42,48] },
    { label: "Courses planned", value: vals.b.toLocaleString(), change: "+23%", spark: [30,35,40,42,50,55,60,72,82] },
    { label: "Circle matches", value: vals.c.toLocaleString(), change: null, spark: [10,12,18,22,28,30,35,40,45] },
    { label: "Avg satisfaction", value: vals.d, change: "+0.2", spark: [38,39,40,40,41,41,42,42,43] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
      {items.map((item, i) => {
        const max = Math.max(...item.spark), min = Math.min(...item.spark);
        const pts = item.spark.map((v, j) => `${(j / (item.spark.length - 1)) * 70},${26 - ((v - min) / (max - min + 1)) * 20}`).join(" ");
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 6 }}>{item.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: "-0.03em" }}>{item.value}</span>
                  {item.change && <span style={{ fontSize: 11, fontWeight: 500, color: C.green }}>{item.change}</span>}
                </div>
              </div>
              <svg width="70" height="26" viewBox="0 0 70 26"><polyline points={pts} fill="none" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hover-Reveal Bar Chart ───
function DemandBars() {
  const [hovered, setHovered] = useState(-1);
  const [dept, setDept] = useState("all");
  const allData = [
    { l: "828A", v: 92, cap: 35, wait: 23, dept: "cs" }, { l: "723", v: 78, cap: 30, wait: 8, dept: "cs" },
    { l: "421", v: 88, cap: 40, wait: 15, dept: "cs" }, { l: "606", v: 55, cap: 40, wait: 0, dept: "data" },
    { l: "726", v: 45, cap: 25, wait: 0, dept: "cs" }, { l: "330", v: 70, cap: 50, wait: 5, dept: "cs" },
    { l: "601", v: 60, cap: 45, wait: 2, dept: "data" }, { l: "737", v: 35, cap: 30, wait: 0, dept: "info" },
    { l: "767", v: 28, cap: 25, wait: 0, dept: "info" },
  ];
  const data = dept === "all" ? allData : allData.filter(d => d.dept === dept);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Course demand vs capacity</div>
      </div>
      <FilterBar label="Dept:" value={dept} onChange={setDept} options={[
        { id: "all", label: "All" }, { id: "cs", label: "CS" }, { id: "data", label: "Data" }, { id: "info", label: "INFO" },
      ]} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 120, marginBottom: 4 }}>
        {data.map((d, i) => (
          <div key={d.l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(-1)}>
            {hovered === i && (
              <div style={{
                position: "absolute", bottom: `${(d.v / 100) * 105 + 12}px`, left: "50%", transform: "translateX(-50%)",
                background: C.ink, color: "#fff", padding: "8px 12px", borderRadius: 6, fontSize: 11, whiteSpace: "nowrap",
                animation: "fadeUp 0.12s ease both", zIndex: 5, lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.dept.toUpperCase()} {d.l}</div>
                <div>Demand: {d.v}% of intent</div>
                <div>Capacity: {d.cap} seats</div>
                {d.wait > 0 ? <div style={{ color: C.gold }}>Waitlist: {d.wait} students</div> : <div style={{ color: C.green }}>No waitlist</div>}
                <div style={{ width: 8, height: 8, background: C.ink, position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%) rotate(45deg)" }} />
              </div>
            )}
            <div style={{
              width: "100%", borderRadius: 3, cursor: "pointer", transition: "all 0.2s",
              height: `${(d.v / 100) * 105}px`,
              background: hovered === i ? C.red : d.v > 80 ? rgba(C.red, 0.65) : d.v > 60 ? rgba(C.blue, 0.45) : rgba(C.muted, 0.25),
            }} />
            <span style={{ fontSize: 9, color: hovered === i ? C.ink : C.muted, fontWeight: hovered === i ? 600 : 400, transition: "all 0.2s" }}>{d.l}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.muted, marginTop: 6 }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: rgba(C.red, 0.65), marginRight: 4, verticalAlign: "middle" }} />High ({">"}80%)</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: rgba(C.blue, 0.45), marginRight: 4, verticalAlign: "middle" }} />Medium</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: rgba(C.muted, 0.25), marginRight: 4, verticalAlign: "middle" }} />Low</span>
      </div>
    </div>
  );
}

// ─── Click-to-Drill Donut ───
function GoalDonut() {
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
  const size = 110, r = 40, cx = size / 2, cy = size / 2;
  let cum = 0;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Goal mode distribution</div>
      <FilterBar value={semester} onChange={v => { setSemester(v); setSelected(-1); }} options={[
        { id: "fall26", label: "Fall 2026" }, { id: "spring26", label: "Spring 2026" },
      ]} />
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ cursor: "pointer", flexShrink: 0 }}>
          {(() => { let c2 = 0; return segments.map((s, i) => {
            const start = (c2 / total) * Math.PI * 2 - Math.PI / 2;
            c2 += s.v;
            const end = (c2 / total) * Math.PI * 2 - Math.PI / 2;
            const large = s.v / total > 0.5 ? 1 : 0;
            const d = `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}`;
            return <path key={i} d={d} fill="none" stroke={s.c} strokeWidth={selected === i ? 14 : 10}
              opacity={selected === -1 || selected === i ? 1 : 0.15} style={{ cursor: "pointer", transition: "all 0.25s" }}
              onClick={() => setSelected(selected === i ? -1 : i)} />;
          }); })()}
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="600" fill={C.ink}>
            {selected >= 0 ? segments[selected].v + "%" : total}
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
              <button onClick={() => setSelected(-1)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.muted, padding: 0 }}>← Back to overview</button>
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

// ─── Before/After ───
function BeforeAfter() {
  const [showNudge, setShowNudge] = useState(false);
  const [metric, setMetric] = useState("research");
  const datasets = {
    research: { label: "Research mode enrollment", data: [
      { l: "828A", base: 45, nudge: 62 }, { l: "723", base: 38, nudge: 44 },
      { l: "726", base: 22, nudge: 35 }, { l: "764", base: 18, nudge: 32 },
      { l: "818J", base: 12, nudge: 28 }, { l: "606", base: 8, nudge: 10 },
    ]},
    retention: { label: "At-risk student course selection", data: [
      { l: "606", base: 30, nudge: 52 }, { l: "601", base: 35, nudge: 48 },
      { l: "434", base: 20, nudge: 38 }, { l: "330", base: 40, nudge: 45 },
      { l: "451", base: 55, nudge: 42 }, { l: "828A", base: 25, nudge: 15 },
    ]},
  };
  const { label, data } = datasets[metric];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Nudge impact analysis</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <FilterBar value={metric} onChange={setMetric} options={[
          { id: "research", label: "Research" }, { id: "retention", label: "Retention" },
        ]} />
        <button onClick={() => setShowNudge(!showNudge)} style={{
          padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", marginBottom: 14,
          fontSize: 11, fontWeight: 600, transition: "all 0.2s",
          background: showNudge ? rgba(C.green, 0.1) : C.subtle,
          color: showNudge ? C.green : C.muted,
        }}>{showNudge ? "With nudge ✓" : "Without nudge"}</button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
        {data.map((d, i) => {
          const v = showNudge ? d.nudge : d.base;
          const other = showNudge ? d.base : d.nudge;
          const max = 65;
          const better = showNudge && d.nudge > d.base;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: better ? C.green : C.ink, transition: "color 0.3s" }}>{v}%</span>
              <div style={{ width: "100%", position: "relative", height: `${(Math.max(v, other) / max) * 80}px` }}>
                <div style={{
                  width: "100%", borderRadius: 3, position: "absolute", bottom: 0,
                  height: `${(other / max) * 80}px`,
                  background: C.border, opacity: 0.5, transition: "height 0.5s ease",
                }} />
                <div style={{
                  width: "100%", borderRadius: 3, position: "absolute", bottom: 0,
                  height: `${(v / max) * 80}px`,
                  background: showNudge ? C.green : C.red, transition: "all 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: 9, color: C.muted }}>{d.l}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, fontSize: 10, color: C.muted }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: showNudge ? C.green : C.red, marginRight: 4, verticalAlign: "middle" }} />Current</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.border, marginRight: 4, verticalAlign: "middle" }} />Comparison</span>
      </div>
    </div>
  );
}

// ─── Combined Nudge Cards ───
const NUDGES = [
  { id: "research", label: "Research participation", desc: "Boost research-mode courses and lab-active professors", icon: "🔬", metrics: { reached: 342, acted: 48, impact: "+3% research-mode", ic: C.green } },
  { id: "ta", label: "TA pipeline", desc: "Surface courses needing TAs to qualified students", icon: "🎓", metrics: { reached: 156, acted: 23, impact: "12 TA applications", ic: C.blue } },
  { id: "new_prog", label: "New program discovery", desc: "Promote interdisciplinary AI program to explorers", icon: "🧭", metrics: { reached: 89, acted: 31, impact: "31 enrollments", ic: C.accent2 } },
  { id: "retention", label: "Retention support", desc: "Weight GPA-safe courses for at-risk students", icon: "🛡️", metrics: { reached: 67, acted: 52, impact: "−18% drop risk", ic: C.green } },
];
const LEVELS = ["off", "low", "medium", "high"];
const LC = { off: C.muted, low: "#B8860B", medium: C.blue, high: C.green };

function NudgeSection() {
  const [levels, setLevels] = useState({ research: "medium", ta: "off", new_prog: "low", retention: "high" });
  const set = (id, l) => setLevels({ ...levels, [id]: l });
  const active = Object.values(levels).filter(l => l !== "off").length;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Institutional nudges</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Soft-weight recommendations toward priorities</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.green, background: rgba(C.green, 0.08), padding: "3px 10px", borderRadius: 4 }}>{active} active</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {NUDGES.map(n => {
          const lv = levels[n.id]; const on = lv !== "off"; const m = n.metrics;
          return (
            <div key={n.id} style={{
              borderRadius: 8, border: `1px solid ${on ? rgba(LC[lv], 0.25) : C.border}`,
              overflow: "hidden", transition: "all 0.2s", background: C.bg,
            }}>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 14 }}>{n.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: on ? C.ink : C.muted }}>{n.label}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{n.desc}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3, color: LC[lv], background: on ? rgba(LC[lv], 0.08) : C.subtle }}>
                    {lv === "off" ? "OFF" : lv.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {LEVELS.map(l => (
                    <button key={l} onClick={() => set(n.id, l)} style={{
                      flex: 1, padding: "5px 0", borderRadius: 4, border: "none", cursor: "pointer",
                      fontSize: 10, fontWeight: lv === l ? 600 : 400, transition: "all 0.15s",
                      background: lv === l ? rgba(LC[l], 0.1) : "transparent",
                      color: lv === l ? LC[l] : C.muted,
                      outline: lv === l ? `1.5px solid ${rgba(LC[l], 0.2)}` : "none",
                    }}>{l === "off" ? "Off" : l.charAt(0).toUpperCase() + l.slice(1)}</button>
                  ))}
                </div>
                {on && (
                  <div style={{ display: "flex", gap: 0, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, animation: "fadeUp 0.15s ease both" }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{m.reached}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>reached</div>
                    </div>
                    <div style={{ width: 1, background: C.border }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{m.acted}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>acted</div>
                    </div>
                    <div style={{ width: 1, background: C.border }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: m.ic }}>{m.impact}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>impact</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Alerts ───
function Alerts() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Action items</div>
      {[
        { icon: "🔴", text: "CMSC 828A at 92% demand — consider adding a section", action: "Review", color: C.red },
        { icon: "🟡", text: "12 at-risk students flagged in MSDS cohort", action: "View", color: "#B8860B" },
        { icon: "🟢", text: "Research mode up 3% after nudge adjustment", action: "Details", color: C.green },
        { icon: "🔵", text: "New interdisciplinary AI program — 89 students exploring", action: "Promote", color: C.blue },
      ].map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: rgba(a.color, 0.03), borderRadius: 6, border: `1px solid ${rgba(a.color, 0.08)}`, marginBottom: 6 }}>
          <span style={{ fontSize: 13 }}>{a.icon}</span>
          <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{a.text}</span>
          <button style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", color: a.color }}>{a.action}</button>
        </div>
      ))}
    </div>
  );
}

// ─── Migration ───
function Migration() {
  const [program, setProgram] = useState("all");
  const allRows = [
    { from: "CS", to: "Data Science", n: 47, pct: "14%", trend: "up", prog: "undergrad" },
    { from: "INFO", to: "CS", n: 23, pct: "8%", trend: "up", prog: "undergrad" },
    { from: "Math", to: "Data Science", n: 18, pct: "6%", trend: "stable", prog: "undergrad" },
    { from: "CS", to: "Undeclared", n: 12, pct: "3%", trend: "down", prog: "undergrad" },
    { from: "MSDS", to: "MSCS", n: 8, pct: "5%", trend: "up", prog: "grad" },
    { from: "MSCS", to: "MSDS", n: 5, pct: "3%", trend: "stable", prog: "grad" },
  ];
  const rows = program === "all" ? allRows : allRows.filter(r => r.prog === program);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Major migration signals</div>
      <FilterBar value={program} onChange={setProgram} options={[
        { id: "all", label: "All" }, { id: "undergrad", label: "Undergrad" }, { id: "grad", label: "Graduate" },
      ]} />
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
          <span style={{ fontWeight: 500, color: C.ink, width: 50 }}>{r.from}</span>
          <span style={{ color: C.muted }}>→</span>
          <span style={{ fontWeight: 500, color: C.ink, flex: 1 }}>{r.to}</span>
          <span style={{ color: C.muted }}>{r.n} ({r.pct})</span>
          <span style={{ fontSize: 10, color: r.trend === "up" ? C.green : r.trend === "down" ? C.red : C.muted }}>
            {r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Chat Panel ───
function ChatPanel({ open, onClose }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: "I have access to all Terp interaction data. Ask me about enrollment patterns, student sentiment, demand signals, or nudge effectiveness." }]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const responses = {
    demand: "CMSC 828A has 3.2x more intent signals than available seats. Waitlist started 2 weeks earlier than last fall. Recommend opening a second section or increasing capacity to 50.",
    research: "Research-mode selections dropped from 24% to 18% year-over-year. Primary driver: students report uncertainty about lab availability. Since activating the research nudge at 'Medium', we've seen a 3% recovery.",
    retention: "12 MSDS students show coast-mode + declining GPA trajectory. 4 are international students who haven't engaged with Circle matches. Consider targeted advisor outreach for these students.",
    nudge: "The research nudge at 'Medium' intensity has reached 342 students and 48 have acted (14% conversion). Research-mode selections are up 3% since activation. Recommend increasing to 'High' for the remaining registration window.",
    default: "I can analyze enrollment intent, goal-mode trends, professor sentiment, nudge effectiveness, and at-risk student patterns. What would you like to explore?"
  };

  const send = () => {
    if (!input.trim()) return;
    const q = input.toLowerCase();
    setMsgs(p => [...p, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      const key = q.includes("demand") || q.includes("828") || q.includes("capacity") ? "demand"
        : q.includes("research") || q.includes("lab") ? "research"
        : q.includes("retention") || q.includes("risk") || q.includes("drop") ? "retention"
        : q.includes("nudge") || q.includes("impact") || q.includes("effective") ? "nudge"
        : "default";
      setMsgs(p => [...p, { role: "ai", text: responses[key] }]);
    }, 700);
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 370, height: "100vh", background: C.card, borderLeft: `1px solid ${C.border}`, zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flag size={18} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Terp Intelligence</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div style={{ maxWidth: "88%", padding: "9px 13px", fontSize: 12, lineHeight: 1.6, borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px", background: m.role === "user" ? C.ink : C.subtle, color: m.role === "user" ? "#fff" : C.ink }}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {["828A demand?", "Research trends?", "At-risk students?", "Nudge impact?"].map(q => (
            <button key={q} onClick={() => setInput(q)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 10, color: C.muted, fontWeight: 500 }}>{q}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask about student data..." style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, background: "#fff", color: C.ink, outline: "none" }} />
          <button onClick={send} style={{ width: 34, height: 34, borderRadius: 6, border: "none", background: C.ink, color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ─── Login ───
function Login({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 340, animation: "fadeUp 0.5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <Flag size={26} />
          <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: C.ink }}>Terp</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, background: C.subtle, padding: "2px 6px", borderRadius: 3 }}>Admin</span>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "24px 22px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>University administrator access</div>
          <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block", marginBottom: 4 }}>Email</label>
          <input placeholder="admin@umd.edu" style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.ink, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
          <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block", marginBottom: 4 }}>Password</label>
          <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, color: C.ink, outline: "none", marginBottom: 16, boxSizing: "border-box" }} />
          <button onClick={onLogin} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: C.ink, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.red} onMouseLeave={e => e.currentTarget.style.background = C.ink}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───
function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: `1px solid ${C.border}`, background: "#fff", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flag size={24} />
          <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 18, color: C.ink }}>Terp</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, background: C.subtle, padding: "2px 6px", borderRadius: 3 }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setChatOpen(!chatOpen)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6,
            border: chatOpen ? `1.5px solid ${C.red}` : `1px solid ${C.border}`,
            background: chatOpen ? rgba(C.red, 0.04) : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500,
            color: chatOpen ? C.red : C.ink, transition: "all 0.2s",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Terp AI
          </button>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: C.subtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.muted }}>AD</div>
        </div>
      </header>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "22px 24px 60px", transition: "max-width 0.3s" }}>
        <div style={{ marginBottom: 20, animation: "fadeUp 0.3s ease both" }}>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Fall 2026 registration cycle · 2,847 active students</p>
        </div>

        <KpiRow />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ animation: "fadeUp 0.3s ease 0.1s both" }}><DemandBars /></div>
          <div style={{ animation: "fadeUp 0.3s ease 0.15s both" }}><GoalDonut /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ animation: "fadeUp 0.3s ease 0.2s both" }}><Migration /></div>
          <div style={{ animation: "fadeUp 0.3s ease 0.25s both" }}><Alerts /></div>
        </div>

        <div style={{ animation: "fadeUp 0.3s ease 0.3s both", marginBottom: 14 }}><NudgeSection /></div>
        <div style={{ animation: "fadeUp 0.3s ease 0.35s both" }}><BeforeAfter /></div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  return (
    <div style={{ fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Instrument+Serif&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input:focus{outline:none}::selection{background:${rgba(C.red,0.15)}}
      `}</style>
      {authed ? <Dashboard /> : <Login onLogin={() => setAuthed(true)} />}
    </div>
  );
}
