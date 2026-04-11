import { useState, useEffect, useRef } from "react";

const C = {
  red: "#E21833", gold: "#FFD520", ink: "#111110", bg: "#F7F7F5",
  card: "#FFFFFF", border: "#E5E3DD", muted: "#8A8880", subtle: "#F3F1EC",
  accent2: "#5B4FCF", green: "#1A7F37", blue: "#2563EB",
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

// ─── Mini bar chart ───
function MiniBar({ data, color, height = 60 }) {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", height: `${(d.v / max) * height * 0.85}px`, background: color, borderRadius: 2, transition: "height 0.6s ease", minHeight: 2, opacity: 0.15 + (d.v / max) * 0.85 }} />
          <span style={{ fontSize: 9, color: C.muted }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut ───
function Donut({ segments, size = 80 }) {
  const total = segments.reduce((a, s) => a + s.v, 0);
  let cum = 0;
  const r = size / 2 - 6, cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => {
        const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
        cum += s.v;
        const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
        const large = s.v / total > 0.5 ? 1 : 0;
        const d = `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}`;
        return <path key={i} d={d} fill="none" stroke={s.c} strokeWidth={10} strokeLinecap="round" />;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="14" fontWeight="600" fill={C.ink}>{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill={C.muted}>total</text>
    </svg>
  );
}

// ─── Stat card ───
function Stat({ label, value, change, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: "-0.03em" }}>{value}</span>
        {change && <span style={{ fontSize: 12, fontWeight: 500, color: change.startsWith("+") ? C.green : C.red }}>{change}</span>}
      </div>
    </div>
  );
}

// ─── Nudge control ───
function NudgeControl({ label, desc, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <input type="range" min="0" max="100" value={value} onChange={e => onChange(+e.target.value)}
          style={{ width: 80, accentColor: C.red, cursor: "pointer" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, width: 30, textAlign: "right" }}>{value}%</span>
      </div>
    </div>
  );
}

// ─── Alert row ───
function AlertRow({ icon, text, action, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: rgba(color, 0.04), borderRadius: 6, border: `1px solid ${rgba(color, 0.1)}`, marginBottom: 6 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{text}</span>
      <button style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", color: color }}>{action}</button>
    </div>
  );
}

// ─── Chat ───
function ChatPanel({ open, onClose }) {
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "I'm connected to all student interaction data from Terp. Ask me anything about enrollment patterns, student sentiment, or demand signals." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const mockResponses = {
    "demand": "CMSC 828A has 3.2x more intent-to-register signals than available seats this cycle. The waitlist started forming 2 weeks earlier than last fall. Recommend opening a second section or increasing capacity to 50.",
    "research": "Research-mode selections are down 14% → 8% year-over-year among MS students. Primary driver: students report uncertainty about lab availability. Suggestion: surface lab openings directly in course recommendations.",
    "retention": "12 students in the current MSDS cohort show coast-mode + declining GPA trajectory. 4 are international students who haven't connected with study groups yet. The Circle feature matched them but they haven't acted on openers. Consider advisor outreach.",
    "default": "Based on current Terp interaction data, I can see enrollment intent, goal-mode distribution, professor sentiment trends, and social matching patterns. What specific area would you like to explore?"
  };

  const send = () => {
    if (!input.trim()) return;
    const q = input.toLowerCase();
    setMsgs(p => [...p, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      const key = q.includes("demand") || q.includes("828") || q.includes("section") ? "demand"
        : q.includes("research") || q.includes("lab") ? "research"
        : q.includes("retention") || q.includes("risk") || q.includes("struggling") ? "retention"
        : "default";
      setMsgs(p => [...p, { role: "ai", text: mockResponses[key] }]);
    }, 800);
  };

  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, right: 0, width: 380, height: "100vh", background: C.card, borderLeft: `1px solid ${C.border}`, zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flag size={20} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Terp Intelligence</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 0 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div style={{ maxWidth: "85%", padding: "10px 14px", fontSize: 13, lineHeight: 1.6, borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px", background: m.role === "user" ? C.ink : C.subtle, color: m.role === "user" ? "#fff" : C.ink }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {["Demand for 828A?", "Research trends?", "At-risk students?"].map(q => (
            <button key={q} onClick={() => { setInput(q); }} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 11, color: C.muted, fontWeight: 500 }}>{q}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask about student data..." style={{ flex: 1, padding: "9px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, background: "#fff", color: C.ink, outline: "none" }} />
          <button onClick={send} style={{ width: 36, height: 36, borderRadius: 6, border: "none", background: C.ink, color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ─── Login ───
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ width: 360, animation: "fadeUp 0.5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" }}>
          <Flag size={28} />
          <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, color: C.ink }}>Terp</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, background: C.subtle, padding: "2px 6px", borderRadius: 3, marginLeft: -4 }}>Admin</span>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "28px 24px" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>University administrator access</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "block", marginBottom: 4 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@umd.edu" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 14, color: C.ink, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, display: "block", marginBottom: 4 }}>Password</label>
            <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 14, color: C.ink, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={onLogin} style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: C.ink, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.red} onMouseLeave={e => e.currentTarget.style.background = C.ink}>
            Sign in
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 16 }}>Terp University Dashboard · UMD</p>
      </div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [nudges, setNudges] = useState({ research: 35, ta: 20, new_program: 15, retention: 50 });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit',sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: `1px solid ${C.border}`, background: "#fff", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flag size={24} />
          <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 18, color: C.ink }}>Terp</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, background: C.subtle, padding: "2px 6px", borderRadius: 3 }}>Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setChatOpen(!chatOpen)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 6,
            border: chatOpen ? `1.5px solid ${C.red}` : `1px solid ${C.border}`,
            background: chatOpen ? rgba(C.red, 0.04) : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, color: chatOpen ? C.red : C.ink, transition: "all 0.2s",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Terp AI
          </button>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: C.subtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: C.muted }}>AD</div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 60px", transition: "margin-right 0.3s", marginRight: chatOpen ? 380 : "auto" }}>
        {/* Title */}
        <div style={{ marginBottom: 24, animation: "fadeUp 0.3s ease both" }}>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 26, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Fall 2026 registration cycle · 2,847 active students</p>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20, animation: "fadeUp 0.3s ease 0.05s both" }}>
          <Stat label="Active users" value="2,847" change="+12%" />
          <Stat label="Courses planned" value="8,241" change="+23%" />
          <Stat label="Circle matches" value="1,456" />
          <Stat label="Avg. satisfaction" value="4.3" change="+0.2" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Goal mode distribution */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", animation: "fadeUp 0.3s ease 0.1s both" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Goal mode distribution</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Donut segments={[
                { v: 32, c: C.red }, { v: 28, c: C.blue }, { v: 18, c: C.green },
                { v: 12, c: C.gold }, { v: 10, c: C.accent2 },
              ]} size={90} />
              <div style={{ flex: 1, fontSize: 12 }}>
                {[{ l: "Coast & GPA", v: "32%", c: C.red }, { l: "Skill Build", v: "28%", c: C.blue }, { l: "Research", v: "18%", c: C.green }, { l: "Balanced", v: "12%", c: C.gold }, { l: "Explore", v: "10%", c: C.accent2 }].map(r => (
                  <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: r.c }} />
                    <span style={{ color: C.muted, flex: 1 }}>{r.l}</span>
                    <span style={{ fontWeight: 600, color: C.ink }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Demand heatmap */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", animation: "fadeUp 0.3s ease 0.15s both" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Course demand vs capacity</div>
            <MiniBar data={[
              { l: "828A", v: 92 }, { l: "723", v: 78 }, { l: "726", v: 45 },
              { l: "606", v: 55 }, { l: "421", v: 88 }, { l: "451", v: 65 },
              { l: "330", v: 70 }, { l: "434", v: 30 },
            ]} color={C.red} height={70} />
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Bars show registration intent relative to seat capacity</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Major migration */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", animation: "fadeUp 0.3s ease 0.2s both" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Major migration signals</div>
            {[
              { from: "CS", to: "Data Science", n: 47, pct: "14%", trend: "up" },
              { from: "INFO", to: "CS", n: 23, pct: "8%", trend: "up" },
              { from: "Math", to: "Data Science", n: 18, pct: "6%", trend: "stable" },
              { from: "CS", to: "Undeclared", n: 12, pct: "3%", trend: "down" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
                <span style={{ fontWeight: 500, color: C.ink, width: 50 }}>{r.from}</span>
                <span style={{ color: C.muted }}>→</span>
                <span style={{ fontWeight: 500, color: C.ink, flex: 1 }}>{r.to}</span>
                <span style={{ color: C.muted }}>{r.n} students ({r.pct})</span>
                <span style={{ fontSize: 10, color: r.trend === "up" ? C.green : r.trend === "down" ? C.red : C.muted }}>
                  {r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Alerts */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", animation: "fadeUp 0.3s ease 0.25s both" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Action items</div>
            <AlertRow icon="🔴" text="CMSC 828A at 92% intent — consider adding section" action="Review" color={C.red} />
            <AlertRow icon="🟡" text="12 at-risk students flagged in MSDS cohort" action="View" color="#B8860B" />
            <AlertRow icon="🟢" text="Research mode up 3% after nudge adjustment" action="Details" color={C.green} />
            <AlertRow icon="🔵" text="New interdisciplinary AI program — 89 students exploring" action="Promote" color={C.blue} />
          </div>
        </div>

        {/* Nudge Controls */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", marginBottom: 20, animation: "fadeUp 0.3s ease 0.3s both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Institutional nudges</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Soft-weight course recommendations toward institutional priorities</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.green, background: rgba(C.green, 0.08), padding: "3px 8px", borderRadius: 4 }}>Active</span>
          </div>
          <NudgeControl label="Research participation" desc="Boost research-mode courses and lab-active professors" value={nudges.research} onChange={v => setNudges({...nudges, research: v})} />
          <NudgeControl label="TA pipeline" desc="Surface courses needing TAs to qualified students" value={nudges.ta} onChange={v => setNudges({...nudges, ta: v})} />
          <NudgeControl label="New program discovery" desc="Promote interdisciplinary AI program to exploring students" value={nudges.new_program} onChange={v => setNudges({...nudges, new_program: v})} />
          <NudgeControl label="Retention support" desc="Weight GPA-safe courses higher for at-risk students" value={nudges.retention} onChange={v => setNudges({...nudges, retention: v})} />
        </div>

        {/* Professor sentiment */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px", animation: "fadeUp 0.3s ease 0.35s both" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Professor sentiment trends</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Based on student reviews and goal-mode selection patterns</div>
          {[
            { name: "Tom Goldstein", dept: "CS", rating: 4.6, trend: "+0.3", demand: "High", flag: null },
            { name: "Jordan Boyd-Graber", dept: "CS / UMIACS", rating: 4.3, trend: "+0.1", demand: "High", flag: null },
            { name: "Minsuk Kahng", dept: "INFO", rating: 4.1, trend: "0.0", demand: "Medium", flag: null },
            { name: "John Smith", dept: "CS", rating: 2.8, trend: "-0.4", demand: "Low", flag: "Declining" },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: C.subtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: C.muted, flexShrink: 0 }}>
                {p.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: C.ink }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{p.dept}</div>
              </div>
              <div style={{ textAlign: "right", marginRight: 8 }}>
                <div style={{ fontWeight: 600, color: C.ink }}>{p.rating}</div>
                <div style={{ fontSize: 10, color: p.trend.startsWith("-") ? C.red : p.trend === "0.0" ? C.muted : C.green }}>{p.trend}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: p.demand === "High" ? C.red : p.demand === "Medium" ? "#B8860B" : C.muted, background: p.demand === "High" ? rgba(C.red, 0.06) : p.demand === "Medium" ? rgba("#B8860B", 0.08) : C.subtle, padding: "2px 8px", borderRadius: 4 }}>{p.demand}</span>
              {p.flag && <span style={{ fontSize: 10, fontWeight: 600, color: C.red, background: rgba(C.red, 0.06), padding: "2px 6px", borderRadius: 3 }}>{p.flag}</span>}
            </div>
          ))}
        </div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Instrument+Serif&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input:focus{outline:none}::selection{background:${rgba(C.red,0.15)}}
      `}</style>
      {authed ? <Dashboard /> : <Login onLogin={() => setAuthed(true)} />}
    </div>
  );
}
