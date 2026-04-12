import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Flag from "../shared/components/Flag.jsx";
import "./UniversityAnalytics.css";

const C = {
  red: "#E21833",
  gold: "#FFD520",
  ink: "#111110",
  bg: "#F7F7F5",
  card: "#FFFFFF",
  border: "#E5E3DD",
  muted: "#8A8880",
  subtle: "#F3F1EC",
  green: "#1A7F37",
  accent2: "#5B4FCF",
  blue: "#2563EB",
};

function rgba(hex, a) {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function FilterBar({ label, value, options, onChange }) {
  return (
    <div className="ua-filter-row">
      {label ? <span className="ua-filter-label">{label}</span> : null}
      <div className="ua-filter-pills">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`ua-filter-pill ${value === o.id ? "ua-selected" : ""}`}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const KPI_TARGETS = { a: 2847, b: 8241, c: 1456, d: 4.3 };

const ALL_DEMAND = [
  { l: "828A", v: 92, cap: 35, wait: 23, dept: "cs" },
  { l: "723", v: 78, cap: 30, wait: 8, dept: "cs" },
  { l: "421", v: 88, cap: 40, wait: 15, dept: "cs" },
  { l: "606", v: 55, cap: 40, wait: 0, dept: "data" },
  { l: "726", v: 45, cap: 25, wait: 0, dept: "cs" },
  { l: "330", v: 70, cap: 50, wait: 5, dept: "cs" },
  { l: "601", v: 60, cap: 45, wait: 2, dept: "data" },
  { l: "737", v: 35, cap: 30, wait: 0, dept: "info" },
  { l: "767", v: 28, cap: 25, wait: 0, dept: "info" },
];

const SEM_DATA = {
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

const ALL_MIGRATION = [
  { from: "CS", to: "Data Science", n: 47, pct: "14%", trend: "up", prog: "undergrad" },
  { from: "INFO", to: "CS", n: 23, pct: "8%", trend: "up", prog: "undergrad" },
  { from: "Math", to: "Data Science", n: 18, pct: "6%", trend: "stable", prog: "undergrad" },
  { from: "CS", to: "Undeclared", n: 12, pct: "3%", trend: "down", prog: "undergrad" },
  { from: "MSDS", to: "MSCS", n: 8, pct: "5%", trend: "up", prog: "grad" },
  { from: "MSCS", to: "MSDS", n: 5, pct: "3%", trend: "stable", prog: "grad" },
];

const ALERTS = [
  { icon: "🔴", text: "CMSC 828A at 92% demand — consider adding a section", action: "Review", color: C.red },
  { icon: "🟡", text: "12 at-risk students flagged in MSDS cohort", action: "View", color: "#B8860B" },
  { icon: "🟢", text: "Research mode up 3% after nudge adjustment", action: "Details", color: C.green },
  { icon: "🔵", text: "New interdisciplinary AI program — 89 students exploring", action: "Promote", color: C.blue },
];

const NUDGES = [
  {
    id: "research",
    label: "Research participation",
    desc: "Boost research-mode courses and lab-active professors",
    icon: "🔬",
    metrics: { reached: 342, acted: 48, impact: "+3% research-mode", ic: C.green },
  },
  {
    id: "ta",
    label: "TA pipeline",
    desc: "Surface courses needing TAs to qualified students",
    icon: "🎓",
    metrics: { reached: 156, acted: 23, impact: "12 TA applications", ic: C.blue },
  },
  {
    id: "new_prog",
    label: "New program discovery",
    desc: "Promote interdisciplinary AI program to explorers",
    icon: "🧭",
    metrics: { reached: 89, acted: 31, impact: "31 enrollments", ic: C.accent2 },
  },
  {
    id: "retention",
    label: "Retention support",
    desc: "Weight GPA-safe courses for at-risk students",
    icon: "🛡️",
    metrics: { reached: 67, acted: 52, impact: "−18% drop risk", ic: C.green },
  },
];

const LEVELS = ["off", "low", "medium", "high"];
const LEVEL_COLORS = { off: C.muted, low: "#B8860B", medium: C.blue, high: C.green };

const BA_DATASETS = {
  research: {
    label: "Research mode enrollment",
    data: [
      { l: "828A", base: 45, nudge: 62 },
      { l: "723", base: 38, nudge: 44 },
      { l: "726", base: 22, nudge: 35 },
      { l: "764", base: 18, nudge: 32 },
      { l: "818J", base: 12, nudge: 28 },
      { l: "606", base: 8, nudge: 10 },
    ],
  },
  retention: {
    label: "At-risk student course selection",
    data: [
      { l: "606", base: 30, nudge: 52 },
      { l: "601", base: 35, nudge: 48 },
      { l: "434", base: 20, nudge: 38 },
      { l: "330", base: 40, nudge: 45 },
      { l: "451", base: 55, nudge: 42 },
      { l: "828A", base: 25, nudge: 15 },
    ],
  },
};

const CHAT_SUGGESTIONS = ["828A demand?", "Research trends?", "At-risk students?", "Nudge impact?"];

const CHAT_RESPONSES = {
  demand:
    "CMSC 828A has 3.2x more intent signals than available seats. Waitlist started 2 weeks earlier than last fall. Recommend opening a second section or increasing capacity to 50.",
  research:
    'Research-mode selections dropped from 24% to 18% year-over-year. Primary driver: students report uncertainty about lab availability. Since activating the research nudge at "Medium", we\'ve seen a 3% recovery.',
  retention:
    "12 MSDS students show coast-mode + declining GPA trajectory. 4 are international students who haven't engaged with Circle matches. Consider targeted advisor outreach for these students.",
  nudge:
    'The research nudge at "Medium" intensity has reached 342 students and 48 have acted (14% conversion). Research-mode selections are up 3% since activation. Recommend increasing to "High" for the remaining registration window.',
  default:
    "I can analyze enrollment intent, goal-mode trends, professor sentiment, nudge effectiveness, and at-risk student patterns. What would you like to explore?",
};

function sparkPoints(data) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  return data.map((v, j) => `${(j / (data.length - 1)) * 70},${26 - ((v - min) / (max - min + 1)) * 20}`).join(" ");
}

function levelColor(l) {
  return LEVEL_COLORS[l] ?? C.muted;
}

export default function UniversityAnalytics() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kpi, setKpi] = useState({ a: 0, b: 0, c: 0, d: 0 });

  const [demandDept, setDemandDept] = useState("all");
  const [hoveredBar, setHoveredBar] = useState(-1);
  const [goalSem, setGoalSem] = useState("fall26");
  const [goalSelected, setGoalSelected] = useState(-1);
  const [migProg, setMigProg] = useState("all");

  const [nudgeLevels, setNudgeLevels] = useState({
    research: "medium",
    ta: "off",
    new_prog: "low",
    retention: "high",
  });

  const [showNudge, setShowNudge] = useState(false);
  const [baMetric, setBaMetric] = useState("research");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    {
      role: "ai",
      text: "I have access to all Terp interaction data. Ask me about enrollment patterns, student sentiment, demand signals, or nudge effectiveness.",
    },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!authed) return;
    const dur = 1400;
    const start = Date.now();
    let raf = 0;
    const frame = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - (1 - t) ** 3;
      setKpi({
        a: Math.round(KPI_TARGETS.a * e),
        b: Math.round(KPI_TARGETS.b * e),
        c: Math.round(KPI_TARGETS.c * e),
        d: +(KPI_TARGETS.d * e).toFixed(1),
      });
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [authed]);

  const kpiItems = useMemo(
    () => [
      { label: "Active users", value: kpi.a.toLocaleString(), change: "+12%", spark: [20, 22, 25, 28, 32, 35, 38, 42, 48] },
      { label: "Courses planned", value: kpi.b.toLocaleString(), change: "+23%", spark: [30, 35, 40, 42, 50, 55, 60, 72, 82] },
      { label: "Circle matches", value: kpi.c.toLocaleString(), change: null, spark: [10, 12, 18, 22, 28, 30, 35, 40, 45] },
      { label: "Avg satisfaction", value: kpi.d, change: "+0.2", spark: [38, 39, 40, 40, 41, 41, 42, 42, 43] },
    ],
    [kpi],
  );

  const filteredDemand = useMemo(
    () => (demandDept === "all" ? ALL_DEMAND : ALL_DEMAND.filter((d) => d.dept === demandDept)),
    [demandDept],
  );

  const goalSegments = useMemo(() => SEM_DATA[goalSem] ?? SEM_DATA.fall26, [goalSem]);
  const goalTotal = useMemo(() => goalSegments.reduce((acc, s) => acc + s.v, 0), [goalSegments]);

  const donutSize = 110;
  const donutR = 40;

  const goalArcs = useMemo(() => {
    const segs = goalSegments;
    const total = goalTotal || 1;
    const cx = donutSize / 2;
    const cy = donutSize / 2;
    const r = donutR;
    let cum = 0;
    return segs.map((s) => {
      const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
      cum += s.v;
      const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
      const large = s.v / total > 0.5 ? 1 : 0;
      const d = `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}`;
      return { d, c: s.c };
    });
  }, [goalSegments, goalTotal]);

  const filteredMigration = useMemo(
    () => (migProg === "all" ? ALL_MIGRATION : ALL_MIGRATION.filter((r) => r.prog === migProg)),
    [migProg],
  );

  const activeNudgeCount = useMemo(() => Object.values(nudgeLevels).filter((l) => l !== "off").length, [nudgeLevels]);

  const baDataset = BA_DATASETS[baMetric] ?? BA_DATASETS.research;

  const setNudgeLevel = useCallback((id, level) => {
    setNudgeLevels((prev) => ({ ...prev, [id]: level }));
  }, []);

  const sendChat = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const q = trimmed.toLowerCase();
    setChatMsgs((prev) => [...prev, { role: "user", text: trimmed }]);
    setChatInput("");
    setTimeout(() => {
      const key =
        q.includes("demand") || q.includes("828") || q.includes("capacity")
          ? "demand"
          : q.includes("research") || q.includes("lab")
            ? "research"
            : q.includes("retention") || q.includes("risk") || q.includes("drop")
              ? "retention"
              : q.includes("nudge") || q.includes("impact") || q.includes("effective")
                ? "nudge"
                : "default";
      setChatMsgs((prev) => [...prev, { role: "ai", text: CHAT_RESPONSES[key] }]);
    }, 700);
  }, [chatInput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  if (!authed) {
    return (
      <div className="ua-page ua-login-wrap">
        <div className="ua-login-box">
          <div className="ua-login-brand">
            <Flag size={26} />
            <span className="ua-brand-serif">Terp</span>
            <span className="ua-badge">Admin</span>
          </div>
          <div className="ua-login-card">
            <div className="ua-login-title">Sign in</div>
            <div className="ua-login-sub">University administrator access</div>
            <label className="ua-field-label" htmlFor="ua-email">
              Email
            </label>
            <input
              id="ua-email"
              className="ua-field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@umd.edu"
              autoComplete="username"
            />
            <label className="ua-field-label" htmlFor="ua-password">
              Password
            </label>
            <input
              id="ua-password"
              className="ua-field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" className="ua-login-btn" onClick={() => setAuthed(true)}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ua-page ua-dashboard">
      <header className="ua-topbar">
        <div className="ua-topbar-left">
          <Flag size={24} />
          <span className="ua-brand-serif" style={{ fontSize: 20 }}>
            Terp
          </span>
          <span className="ua-badge">Admin</span>
        </div>
        <div className="ua-topbar-right">
          <button
            type="button"
            className={`ua-chat-toggle ${chatOpen ? "ua-active" : ""}`}
            onClick={() => setChatOpen((o) => !o)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Terp AI
          </button>
          <div className="ua-avatar">AD</div>
        </div>
      </header>

      <div className="ua-main-content">
        <div className="ua-fade-up">
          <h1 className="ua-page-title">Dashboard</h1>
          <p className="ua-page-sub">
            Fall 2026 registration cycle · {kpi.a.toLocaleString()} active students
          </p>
        </div>

        <div className="ua-kpi-grid">
          {kpiItems.map((item, i) => (
            <div key={item.label} className="ua-kpi-card ua-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="ua-kpi-top">
                <div>
                  <div className="ua-kpi-label">{item.label}</div>
                  <div className="ua-kpi-value-row">
                    <span className="ua-kpi-value">{item.value}</span>
                    {item.change ? <span className="ua-kpi-change">{item.change}</span> : null}
                  </div>
                </div>
                <svg width="70" height="26" viewBox="0 0 70 26">
                  <polyline
                    points={sparkPoints(item.spark)}
                    fill="none"
                    stroke={C.green}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="ua-grid-2">
          <div className="ua-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="ua-card">
              <div className="ua-card-header">
                <span className="ua-card-title">Course demand vs capacity</span>
              </div>
              <FilterBar
                label="Dept:"
                value={demandDept}
                options={[
                  { id: "all", label: "All" },
                  { id: "cs", label: "CS" },
                  { id: "data", label: "Data" },
                  { id: "info", label: "INFO" },
                ]}
                onChange={setDemandDept}
              />
              <div className="ua-bars-container">
                {filteredDemand.map((d, i) => (
                  <div
                    key={d.l}
                    className="ua-bar-col"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(-1)}
                  >
                    {hoveredBar === i ? (
                      <div className="ua-bar-tooltip" style={{ bottom: `${(d.v / 100) * 105 + 12}px` }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                          {d.dept.toUpperCase()} {d.l}
                        </div>
                        <div>Demand: {d.v}% of intent</div>
                        <div>Capacity: {d.cap} seats</div>
                        <div style={{ color: d.wait > 0 ? C.gold : C.green }}>
                          {d.wait > 0 ? `Waitlist: ${d.wait} students` : "No waitlist"}
                        </div>
                        <div className="ua-tooltip-arrow" />
                      </div>
                    ) : null}
                    <div
                      className="ua-bar"
                      style={{
                        height: `${(d.v / 100) * 105}px`,
                        background:
                          hoveredBar === i
                            ? C.red
                            : d.v > 80
                              ? rgba(C.red, 0.65)
                              : d.v > 60
                                ? rgba(C.blue, 0.45)
                                : rgba(C.muted, 0.25),
                      }}
                    />
                    <span className={`ua-bar-label ${hoveredBar === i ? "ua-active" : ""}`}>{d.l}</span>
                  </div>
                ))}
              </div>
              <div className="ua-legend">
                <span>
                  <span className="ua-legend-dot" style={{ background: rgba(C.red, 0.65) }} />
                  High (&gt;80%)
                </span>
                <span>
                  <span className="ua-legend-dot" style={{ background: rgba(C.blue, 0.45) }} />
                  Medium
                </span>
                <span>
                  <span className="ua-legend-dot" style={{ background: rgba(C.muted, 0.25) }} />
                  Low
                </span>
              </div>
            </div>
          </div>

          <div className="ua-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="ua-card">
              <div className="ua-card-title" style={{ marginBottom: 4 }}>
                Goal mode distribution
              </div>
              <FilterBar
                value={goalSem}
                options={[
                  { id: "fall26", label: "Fall 2026" },
                  { id: "spring26", label: "Spring 2026" },
                ]}
                onChange={(id) => {
                  setGoalSem(id);
                  setGoalSelected(-1);
                }}
              />
              <div className="ua-donut-row">
                <svg
                  width={donutSize}
                  height={donutSize}
                  viewBox={`0 0 ${donutSize} ${donutSize}`}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                >
                  {goalArcs.map((seg, i) => (
                    <path
                      key={i}
                      d={seg.d}
                      fill="none"
                      stroke={seg.c}
                      strokeWidth={goalSelected === i ? 14 : 10}
                      opacity={goalSelected === -1 || goalSelected === i ? 1 : 0.15}
                      style={{ cursor: "pointer", transition: "all 0.25s" }}
                      onClick={() => setGoalSelected((s) => (s === i ? -1 : i))}
                    />
                  ))}
                  <text x={donutSize / 2} y={donutSize / 2 + 5} textAnchor="middle" fontSize="16" fontWeight="600" fill={C.ink}>
                    {goalSelected >= 0 ? `${goalSegments[goalSelected].v}%` : goalTotal}
                  </text>
                </svg>
                <div className="ua-donut-legend">
                  {goalSelected >= 0 ? (
                    <div className="ua-fade-up" style={{ animationDuration: "0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <div className="ua-legend-dot-lg" style={{ background: goalSegments[goalSelected].c }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{goalSegments[goalSelected].label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
                        Top courses: {goalSegments[goalSelected].top}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: goalSegments[goalSelected].trendC }}>
                        {goalSegments[goalSelected].trend}
                      </div>
                      <button type="button" className="ua-back-btn" onClick={() => setGoalSelected(-1)}>
                        ← Back to overview
                      </button>
                    </div>
                  ) : (
                    goalSegments.map((s, i) => (
                      <div key={s.label} className="ua-donut-legend-row" onClick={() => setGoalSelected(i)} role="presentation">
                        <div className="ua-legend-dot" style={{ background: s.c }} />
                        <span style={{ fontSize: 12, flex: 1, color: C.muted }}>{s.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{s.v}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ua-grid-2">
          <div className="ua-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="ua-card">
              <div className="ua-card-title" style={{ marginBottom: 4 }}>
                Major migration signals
              </div>
              <FilterBar
                value={migProg}
                options={[
                  { id: "all", label: "All" },
                  { id: "undergrad", label: "Undergrad" },
                  { id: "grad", label: "Graduate" },
                ]}
                onChange={setMigProg}
              />
              {filteredMigration.map((r, i) => (
                <div
                  key={`${r.from}-${r.to}-${i}`}
                  className={`ua-mig-row ${i < filteredMigration.length - 1 ? "ua-bordered" : ""}`}
                >
                  <span className="ua-mig-from">{r.from}</span>
                  <span style={{ color: C.muted }}>→</span>
                  <span className="ua-mig-to">{r.to}</span>
                  <span style={{ color: C.muted }}>
                    {r.n} ({r.pct})
                  </span>
                  <span
                    className="ua-mig-trend"
                    style={{
                      color: r.trend === "up" ? C.green : r.trend === "down" ? C.red : C.muted,
                    }}
                  >
                    {r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="ua-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="ua-card">
              <div className="ua-card-title" style={{ marginBottom: 12 }}>
                Action items
              </div>
              {ALERTS.map((a, i) => (
                <div
                  key={i}
                  className="ua-alert-row"
                  style={{ background: rgba(a.color, 0.03), border: `1px solid ${rgba(a.color, 0.08)}` }}
                >
                  <span style={{ fontSize: 13 }}>{a.icon}</span>
                  <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{a.text}</span>
                  <button type="button" className="ua-alert-action" style={{ color: a.color }}>
                    {a.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ua-fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="ua-card">
            <div className="ua-nudge-header">
              <div>
                <div className="ua-card-title">Institutional nudges</div>
                <div style={{ fontSize: 11, marginTop: 2, color: C.muted }}>Soft-weight recommendations toward priorities</div>
              </div>
              <span className="ua-active-badge">{activeNudgeCount} active</span>
            </div>
            <div className="ua-nudge-grid">
              {NUDGES.map((n) => {
                const lvl = nudgeLevels[n.id] ?? "off";
                const lc = levelColor(lvl);
                return (
                  <div
                    key={n.id}
                    className="ua-nudge-card"
                    style={{
                      border: `1px solid ${lvl !== "off" ? rgba(lc, 0.25) : C.border}`,
                    }}
                  >
                    <div className="ua-nudge-inner">
                      <div className="ua-nudge-top">
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 14 }}>{n.icon}</span>
                          <div>
                            <div className={`ua-nudge-label ${lvl !== "off" ? "ua-on" : ""}`}>{n.label}</div>
                            <div style={{ fontSize: 10, marginTop: 2, color: C.muted }}>{n.desc}</div>
                          </div>
                        </div>
                        <span
                          className="ua-level-badge"
                          style={{
                            color: lc,
                            background: lvl !== "off" ? rgba(lc, 0.08) : C.subtle,
                          }}
                        >
                          {lvl === "off" ? "OFF" : lvl.toUpperCase()}
                        </span>
                      </div>
                      <div className="ua-level-btns">
                        {LEVELS.map((l) => (
                          <button
                            key={l}
                            type="button"
                            className={`ua-level-btn ${lvl === l ? "ua-selected" : ""}`}
                            style={{
                              background: lvl === l ? rgba(levelColor(l), 0.1) : "transparent",
                              color: lvl === l ? levelColor(l) : C.muted,
                              outline: lvl === l ? `1.5px solid ${rgba(levelColor(l), 0.2)}` : "none",
                            }}
                            onClick={() => setNudgeLevel(n.id, l)}
                          >
                            {l === "off" ? "Off" : l.charAt(0).toUpperCase() + l.slice(1)}
                          </button>
                        ))}
                      </div>
                      {lvl !== "off" ? (
                        <div className="ua-nudge-metrics ua-fade-up">
                          <div className="ua-metric-cell">
                            <div className="ua-metric-val">{n.metrics.reached}</div>
                            <div className="ua-metric-label">reached</div>
                          </div>
                          <div className="ua-metric-sep" />
                          <div className="ua-metric-cell">
                            <div className="ua-metric-val">{n.metrics.acted}</div>
                            <div className="ua-metric-label">acted</div>
                          </div>
                          <div className="ua-metric-sep" />
                          <div className="ua-metric-cell">
                            <div className="ua-metric-impact" style={{ color: n.metrics.ic }}>
                              {n.metrics.impact}
                            </div>
                            <div className="ua-metric-label">impact</div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="ua-fade-up" style={{ animationDelay: "0.35s" }}>
          <div className="ua-card">
            <div className="ua-card-title" style={{ marginBottom: 4 }}>
              Nudge impact analysis
            </div>
            <div className="ua-ba-controls">
              <FilterBar
                value={baMetric}
                options={[
                  { id: "research", label: "Research" },
                  { id: "retention", label: "Retention" },
                ]}
                onChange={setBaMetric}
              />
              <button type="button" className={`ua-nudge-toggle ${showNudge ? "ua-on" : ""}`} onClick={() => setShowNudge((s) => !s)}>
                {showNudge ? "With nudge ✓" : "Without nudge"}
              </button>
            </div>
            <div style={{ fontSize: 12, marginBottom: 12, color: C.muted }}>{baDataset.label}</div>
            <div className="ua-ba-bars">
              {baDataset.data.map((d) => {
                const primary = showNudge ? d.nudge : d.base;
                const ghost = showNudge ? d.base : d.nudge;
                const maxH = Math.max(primary, ghost, 1);
                return (
                  <div key={d.l} className="ua-ba-col">
                    <span
                      className="ua-ba-val"
                      style={{
                        color: showNudge && d.nudge > d.base ? C.green : C.ink,
                      }}
                    >
                      {primary}%
                    </span>
                    <div className="ua-ba-bar-wrap" style={{ height: `${(maxH / 65) * 80}px` }}>
                      <div className="ua-ba-ghost" style={{ height: `${(ghost / 65) * 80}px` }} />
                      <div
                        className="ua-ba-fill"
                        style={{
                          height: `${(primary / 65) * 80}px`,
                          background: showNudge ? C.green : C.red,
                        }}
                      />
                    </div>
                    <span className="ua-ba-label">{d.l}</span>
                  </div>
                );
              })}
            </div>
            <div className="ua-ba-legend">
              <span>
                <span className="ua-legend-dot" style={{ background: showNudge ? C.green : C.red }} />
                Current
              </span>
              <span>
                <span className="ua-legend-dot" style={{ background: C.border }} />
                Comparison
              </span>
            </div>
          </div>
        </div>
      </div>

      {chatOpen ? (
        <div className="ua-chat-panel">
          <div className="ua-chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flag size={18} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Terp Intelligence</span>
            </div>
            <button type="button" className="ua-chat-close" onClick={() => setChatOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="ua-chat-body">
            {chatMsgs.map((m, i) => (
              <div key={i} className={`ua-chat-msg ${m.role === "user" ? "ua-user" : "ua-ai"}`}>
                <div className={`ua-chat-bubble ${m.role === "user" ? "ua-user" : "ua-ai"}`}>{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="ua-chat-footer">
            <div className="ua-chat-suggestions">
              {CHAT_SUGGESTIONS.map((q) => (
                <button key={q} type="button" className="ua-chat-suggestion" onClick={() => setChatInput(q)}>
                  {q}
                </button>
              ))}
            </div>
            <div className="ua-chat-input-row">
              <input
                className="ua-chat-input"
                placeholder="Ask about student data..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChat();
                }}
              />
              <button type="button" className="ua-chat-send" onClick={sendChat} aria-label="Send">
                ↑
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
