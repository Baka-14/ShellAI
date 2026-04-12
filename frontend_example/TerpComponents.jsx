import { useState, useEffect, useRef } from "react";

const C = {
  red: "#E21833", gold: "#FFD520", ink: "#0D0D0C", bg: "#F8F8F6",
  card: "#FFFFFF", border: "#E5E3DD", muted: "#8A8880", subtle: "#F3F1EC",
  green: "#1A7F37", accent2: "#5B4FCF", blue: "#2563EB",
};
const rgba = (h, a) => { const v = parseInt(h.slice(1), 16); return `rgba(${(v>>16)&255},${(v>>8)&255},${v&255},${a})`; };

// ══════════════════════════════════════════
// 1. CIRCLE ORB
// ══════════════════════════════════════════

function CircleOrb({ state = "idle", onClick, size = 200 }) {
  const configs = {
    idle: {
      bg: "radial-gradient(circle at 38% 32%, #f1f5f9 0%, #cbd5e1 30%, #64748b 65%, #334155 100%)",
      glow: "0 0 40px rgba(100,116,139,0.15), 0 0 80px rgba(100,116,139,0.06)",
      ring: "rgba(255,255,255,0.12)",
      shimmer: "rgba(255,255,255,0.06)",
      pulse: false,
    },
    listening: {
      bg: "radial-gradient(circle at 38% 32%, #eff6ff 0%, #93c5fd 25%, #3b82f6 55%, #1d4ed8 80%, #1e3a8a 100%)",
      glow: "0 0 50px rgba(59,130,246,0.25), 0 0 100px rgba(59,130,246,0.08)",
      ring: "rgba(147,197,253,0.25)",
      shimmer: "rgba(186,230,253,0.12)",
      pulse: true,
    },
    thinking: {
      bg: "radial-gradient(circle at 38% 32%, #f0f9ff 0%, #7dd3fc 20%, #38bdf8 40%, #0284c7 65%, #0c4a6e 100%)",
      glow: "0 0 60px rgba(56,189,248,0.3), 0 0 120px rgba(14,165,233,0.1)",
      ring: "rgba(125,211,252,0.3)",
      shimmer: "rgba(224,242,254,0.15)",
      pulse: true,
    },
    matching: {
      bg: "radial-gradient(circle at 38% 32%, #f5f3ff 0%, #c4b5fd 22%, #8b5cf6 50%, #6d28d9 75%, #4c1d95 100%)",
      glow: "0 0 55px rgba(139,92,246,0.25), 0 0 110px rgba(139,92,246,0.08)",
      ring: "rgba(196,181,253,0.25)",
      shimmer: "rgba(237,233,254,0.12)",
      pulse: true,
    },
  };
  const c = configs[state] || configs.idle;

  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => onClick && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      style={{ position: "relative", width: size, height: size, cursor: onClick ? "pointer" : "default", flexShrink: 0 }}>
      {/* Outer glow ring */}
      <div style={{
        position: "absolute", inset: -12, borderRadius: "50%",
        background: "transparent", boxShadow: c.glow,
        transition: "box-shadow 0.8s ease",
      }} />
      {/* Main circle */}
      <div style={{
        width: size, height: size, borderRadius: "50%", position: "relative", overflow: "hidden",
        background: c.bg, transition: "background 0.8s ease",
        boxShadow: `0 0 0 1px ${c.ring} inset, 0 -6px 20px rgba(0,0,0,0.06) inset`,
        animation: c.pulse ? "orbPulse 3s ease-in-out infinite" : "none",
      }}>
        {/* Top-left specular highlight */}
        <div style={{
          position: "absolute", width: "65%", height: "55%", top: "8%", left: "10%", borderRadius: "50%",
          background: `radial-gradient(ellipse at 45% 40%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 50%, transparent 70%)`,
          pointerEvents: "none", transition: "opacity 0.6s",
        }} />
        {/* Shimmer band */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `linear-gradient(135deg, transparent 30%, ${c.shimmer} 48%, transparent 52%, transparent 100%)`,
          animation: state !== "idle" ? "orbShimmer 4s ease-in-out infinite" : "none",
          pointerEvents: "none", transition: "background 0.8s",
        }} />
        {/* Rim light */}
        <div style={{
          position: "absolute", inset: 2, borderRadius: "50%",
          border: `1px solid ${c.ring}`,
          pointerEvents: "none", transition: "border-color 0.8s",
        }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// 2. LOADING / TRANSITION SCREENS
// ══════════════════════════════════════════

// 2a. Course matching loader
function CourseLoader({ onDone }) {
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const done = useRef(false);
  const steps = [
    "Connecting to PlanetTerp...",
    "Pulling grade distributions...",
    "Analyzing professor reviews...",
    "Checking faculty websites & Scholar...",
    "Evaluating section availability...",
    "Scoring & ranking courses...",
  ];
  useEffect(() => {
    const iv = setInterval(() => {
      setProg(p => {
        const n = p + Math.random() * 11 + 4;
        if (n >= 100 && !done.current) { done.current = true; clearInterval(iv); setTimeout(onDone, 600); return 100; }
        return Math.min(n, 100);
      });
      setStep(s => Math.min(s + 1, steps.length - 1));
    }, 800);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 40, background: C.bg }}>
      <CircleOrb state="thinking" size={160} />
      <div style={{ marginTop: 36, width: "100%", maxWidth: 300 }}>
        {/* Progress bar */}
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(90deg, ${C.blue}, #38bdf8)`, borderRadius: 1, transition: "width 0.5s ease" }} />
        </div>
        {/* Steps */}
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
            fontSize: 13, fontWeight: i === step ? 500 : 400,
            color: i <= step ? C.ink : "#d0cec8",
            transition: "all 0.4s ease",
            transform: i === step ? "translateX(4px)" : "translateX(0)",
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, flexShrink: 0, transition: "all 0.3s",
              background: i < step ? C.green : i === step ? C.blue : C.subtle,
              color: i <= step ? "#fff" : "#bbb",
            }}>{i < step ? "✓" : i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 28, textAlign: "center" }}>Analyzing your perfect semester...</p>
    </div>
  );
}

// 2b. Circle matching loader
function CircleLoader({ onDone }) {
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const done = useRef(false);
  const steps = [
    "Scanning Canvas introductions...",
    "Extracting interests & backgrounds...",
    "Cross-referencing LinkedIn profiles...",
    "Scoring compatibility...",
    "Writing conversation starters...",
  ];
  useEffect(() => {
    const iv = setInterval(() => {
      setProg(p => {
        const n = p + Math.random() * 13 + 5;
        if (n >= 100 && !done.current) { done.current = true; clearInterval(iv); setTimeout(onDone, 600); return 100; }
        return Math.min(n, 100);
      });
      setStep(s => Math.min(s + 1, steps.length - 1));
    }, 750);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 40, background: C.bg }}>
      <CircleOrb state="matching" size={160} />
      <div style={{ marginTop: 36, width: "100%", maxWidth: 300 }}>
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(90deg, ${C.accent2}, #a78bfa)`, borderRadius: 1, transition: "width 0.5s ease" }} />
        </div>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
            fontSize: 13, fontWeight: i === step ? 500 : 400,
            color: i <= step ? C.ink : "#d0cec8", transition: "all 0.4s ease",
            transform: i === step ? "translateX(4px)" : "translateX(0)",
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, flexShrink: 0, transition: "all 0.3s",
              background: i < step ? C.green : i === step ? C.accent2 : C.subtle,
              color: i <= step ? "#fff" : "#bbb",
            }}>{i < step ? "✓" : i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 28, textAlign: "center" }}>Finding your people...</p>
    </div>
  );
}

// 2c. Generic transition overlay (use between any two screens)
function TransitionOverlay({ text = "Loading...", show, orbState = "thinking" }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: C.bg, zIndex: 100,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.3s ease both",
    }}>
      <CircleOrb state={orbState} size={120} />
      <p style={{ fontSize: 14, color: C.muted, marginTop: 24, fontWeight: 450 }}>{text}</p>
      <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: 3, background: C.muted,
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// 3. SHARED UI BITS
// ══════════════════════════════════════════

function Tag({ children, color = C.muted }) {
  return <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", padding: "3px 8px", borderRadius: 4, background: rgba(color, 0.07), color }}>{children}</span>;
}
function GradeBar({ pct, h = 5 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: h, background: C.subtle, borderRadius: h / 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct > 70 ? C.green : pct > 50 ? C.gold : C.red, borderRadius: h / 2, transition: "width 0.8s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.ink, minWidth: 36 }}>{pct}% A</span>
    </div>
  );
}
function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 8 }}>{children}</div>;
}

// ══════════════════════════════════════════
// 4. RESEARCH COURSE CARD
// ══════════════════════════════════════════

const RES_DATA = [
  { course: "CMSC 828A", title: "Fantastic Ideas in ML", prof: "Tom Goldstein", rating: 4.6, pctA: 68, building: "IRB 0318", times: "TuTh 2:00–3:15", seats: "12/35", lab: "ML & Signal Processing Lab", openings: 2, areas: ["Diffusion Models","Adversarial ML","Efficient Training"], coauthors: true, papers: [{t:"Scalable Diffusion Models with SSM Backbones",v:"ICML '25"},{t:"Progressive Distillation for Fast Sampling",v:"NeurIPS '24"},{t:"Adversarial Training for Free!",v:"NeurIPS '24"}], reason: "Goldstein co-publishes with grad students. 2 open RA positions. Diffusion work aligns with your LLM efficiency interest.", web: "#", scholar: "#" },
  { course: "CMSC 723", title: "Computational Linguistics", prof: "Jordan Boyd-Graber", rating: 4.3, pctA: 72, building: "CSI 2120", times: "MWF 11:00–11:50", seats: "8/30", lab: "CLIP Lab", openings: 3, areas: ["Question Answering","Interactive ML","Multilingual NLP"], coauthors: true, papers: [{t:"QA with Retrieval-Augmented LLMs",v:"ACL '25"},{t:"Interactive Machine Learning for NLP",v:"EMNLP '24"}], reason: "CLIP lab has 3 open positions. QA and retrieval focus directly relevant to NLP. Course projects can seed publications.", web: "#", scholar: "#" },
];

function ResearchCard({ r, i }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", animation: `fadeUp 0.4s ease ${i * 0.1}s both`, transition: "box-shadow 0.25s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.06)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ padding: "10px 20px", background: rgba(C.green, 0.04), borderBottom: `1px solid ${rgba(C.green, 0.08)}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: C.green }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>{r.lab}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.green, background: rgba(C.green, 0.08), padding: "2px 8px", borderRadius: 4 }}>{r.openings} open positions</span>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{r.course}</span><span style={{ fontSize: 13, color: C.muted }}>{r.title}</span></div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginTop: 4 }}>{r.prof}</div>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{r.rating}</div><div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>rating</div></div>
        </div>
        <div style={{ display: "flex", gap: 5, marginTop: 12, flexWrap: "wrap" }}>
          {r.areas.map(a => <Tag key={a} color={C.green}>{a}</Tag>)}
          {r.coauthors && <Tag color={C.blue}>Co-publishes</Tag>}
        </div>
        <div style={{ marginTop: 16 }}>
          <SectionLabel>Recent publications</SectionLabel>
          {r.papers.map((p, pi) => (
            <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: C.muted, flexShrink: 0, minWidth: 65 }}>{p.v}</span>
              <span style={{ color: "#444", fontWeight: 450 }}>{p.t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 12, color: C.muted }}>
          <span>{r.building}</span><span style={{ color: C.border }}>|</span><span>{r.times}</span><span style={{ color: C.border }}>|</span>
          <span style={{ color: parseInt(r.seats) <= 12 ? C.red : C.muted, fontWeight: parseInt(r.seats) <= 12 ? 600 : 400 }}>{r.seats} seats</span>
        </div>
        <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.red }}>Why this course</span>
          <span style={{ fontSize: 12, color: C.muted }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && <div style={{ animation: "fadeUp 0.2s ease both" }}><p style={{ fontSize: 13, lineHeight: 1.75, color: "#555", margin: "10px 0 12px" }}>{r.reason}</p><div style={{ display: "flex", gap: 14 }}><a href={r.web} style={{ fontSize: 12, color: C.blue, fontWeight: 500, textDecoration: "none" }}>Faculty page →</a><a href={r.scholar} style={{ fontSize: 12, color: C.blue, fontWeight: 500, textDecoration: "none" }}>Google Scholar →</a></div></div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// 5. COAST COURSE CARD
// ══════════════════════════════════════════

const COAST_DATA = [
  { course: "INST 737", title: "Intro to Data Analytics", prof: "Joel Chan", rating: 4.2, pctA: 82, building: "HBK 1114", times: "TuTh 11:00–12:15", seats: "18/35", workload: "Minimal", hrs: 5, exams: "0%", projects: "60%", gpa: 3.48, ifA: 3.55, reviews: [{t:"No exams! Just projects and participation.",s:5},{t:"Most chill class. Prof Chan is great.",s:5}], reason: "82% A rate, zero exams, 5 hrs/week. Safest pick. An A pushes you past 3.5 comfortably." },
  { course: "DATA 606", title: "Statistical Methodology", prof: "Minsuk Kahng", rating: 4.1, pctA: 78, building: "ESJ 0202", times: "TuTh 9:30–10:45", seats: "22/40", workload: "Light", hrs: 6, exams: "40%", projects: "30%", gpa: 3.48, ifA: 3.54, reviews: [{t:"Very manageable. Clear lectures and fair grading.",s:5},{t:"Easiest grad course I've taken.",s:4}], reason: "78% A rate. Light workload gives time for interview prep. An A here gets you to 3.54." },
  { course: "CMSC 434", title: "Human-Computer Interaction", prof: "Huaishu Peng", rating: 3.9, pctA: 74, building: "IRB 1116", times: "MWF 1:00–1:50", seats: "30/45", workload: "Light", hrs: 7, exams: "20%", projects: "50%", gpa: 3.48, ifA: 3.53, reviews: [{t:"Fun, mostly project-based. Generous grading.",s:4},{t:"Easy A if you show up.",s:5}], reason: "74% A rate, project-heavy, no high-stakes exams. An A gets you to 3.53." },
];

function CoastCard({ r, i }) {
  const [open, setOpen] = useState(false);
  const gain = (r.ifA - r.gpa).toFixed(2);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", animation: `fadeUp 0.4s ease ${i * 0.1}s both`, transition: "box-shadow 0.25s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.06)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ padding: "10px 20px", background: rgba(C.green, 0.04), borderBottom: `1px solid ${rgba(C.green, 0.08)}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#555" }}>
          If A → <span style={{ fontWeight: 700, color: C.ink }}>{r.gpa}</span><span style={{ color: C.muted }}> → </span><span style={{ fontWeight: 700, color: C.green }}>{r.ifA}</span>
          <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}> (+{gain})</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: r.pctA >= 80 ? rgba(C.green, 0.08) : rgba(C.gold, 0.12), color: r.pctA >= 80 ? C.green : "#B8860B" }}>{r.pctA}% A</span>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{r.course}</span><span style={{ fontSize: 13, color: C.muted }}>{r.title}</span></div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginTop: 4 }}>{r.prof}</div>
          </div>
          <div style={{ width: 80 }}><GradeBar pct={r.pctA} h={8} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 14 }}>
          {[{l:"Weekly",v:r.hrs+"h",ok:r.hrs<=6},{l:"Workload",v:r.workload,ok:true},{l:"Exams",v:r.exams,ok:r.exams==="0%"},{l:"Projects",v:r.projects,ok:false}].map((s,si) => (
            <div key={si} style={{ textAlign: "center", padding: "8px 0", background: C.subtle, borderRadius: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: s.ok ? C.green : C.ink }}>{s.v}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 12, color: C.muted }}>
          <span>{r.building}</span><span style={{ color: C.border }}>|</span><span>{r.times}</span><span style={{ color: C.border }}>|</span><span>{r.seats} seats</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <SectionLabel>Student reviews</SectionLabel>
          {r.reviews.map((rv, ri) => (
            <div key={ri} style={{ padding: "8px 12px", background: C.subtle, borderRadius: 6, marginBottom: 5, borderLeft: `2px solid ${C.gold}` }}>
              <span style={{ fontSize: 12, color: "#555" }}>{rv.t}</span>
              <span style={{ fontSize: 11, color: C.gold, marginLeft: 6 }}>{"★".repeat(rv.s)}</span>
            </div>
          ))}
        </div>
        <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.red }}>Analysis</span>
          <span style={{ fontSize: 12, color: C.muted }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && <p style={{ fontSize: 13, lineHeight: 1.75, color: "#555", margin: "10px 0 0", animation: "fadeUp 0.2s ease both" }}>{r.reason}</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// 6. EXPLORE COURSE CARD
// ══════════════════════════════════════════

const EXPLORE_DATA = [
  { course: "CMSC 421", title: "Intro to Artificial Intelligence", prof: "Tom Goldstein", rating: 4.4, pctA: 65, building: "IRB 0324", times: "TuTh 3:30–4:45", seats: "28/50", paths: ["Machine Learning","Robotics","NLP","Computer Vision"], leadsTo: ["CMSC 422 (ML)","CMSC 723 (NLP)","CMSC 726 (CV)"], majors: {CS:65,CE:12,Math:8,INFO:10,Other:5}, alumni: [{name:"Sarah L.",dest:"BS CS → ML Engineer @ Google",path:"421 → 422 → 828A → ML career",email:"sarahliu@terpmail.umd.edu"},{name:"David K.",dest:"BS CS → PhD Robotics (CMU)",path:"421 sparked his AI interest → research track",email:"davidk@terpmail.umd.edu"}], reason: "The gateway to all AI specializations. Find out which branch clicks — ML, NLP, CV, or robotics. Opens 4 upper-level paths." },
  { course: "INST 326", title: "Object-Oriented Programming", prof: "Aric Bills", rating: 4.0, pctA: 70, building: "HBK 0302", times: "MWF 10:00–10:50", seats: "15/35", paths: ["Information Science","Data Science","UX Research"], leadsTo: ["INST 335 (Teams)","INST 414 (Data Science)","INST 462 (Ethics)"], majors: {INFO:55,CS:15,Undeclared:20,Other:10}, alumni: [{name:"Maya T.",dest:"BS INFO → UX Designer @ Figma",path:"Tried INFO → loved design + data intersection",email:"mayat@terpmail.umd.edu"},{name:"Alex R.",dest:"BS INFO → Data Analyst @ Spotify",path:"Started undeclared, INFO gave the best blend",email:"alexr@terpmail.umd.edu"}], reason: "If you're choosing between CS and INFO, this shows you the INFO side. Less theory, more applied. 20% of students were undeclared." },
];

function ExploreCard({ r, i }) {
  const [open, setOpen] = useState(false);
  const [showAlumni, setShowAlumni] = useState(false);
  const me = Object.entries(r.majors); const mx = Math.max(...me.map(e => e[1]));
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", animation: `fadeUp 0.4s ease ${i * 0.1}s both`, transition: "box-shadow 0.25s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.06)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ padding: "10px 20px", background: rgba(C.accent2, 0.04), borderBottom: `1px solid ${rgba(C.accent2, 0.08)}`, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.accent2, fontWeight: 600 }}>Pathways:</span>
        {r.paths.map(p => <Tag key={p} color={C.accent2}>{p}</Tag>)}
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{r.course}</span><span style={{ fontSize: 13, color: C.muted }}>{r.title}</span></div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginTop: 4 }}>{r.prof}</div>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{r.rating}</div><div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>rating</div></div>
        </div>
        {/* Major breakdown */}
        <div style={{ marginTop: 16 }}>
          <SectionLabel>Who takes this course</SectionLabel>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48 }}>
            {me.map(([m, pct]) => (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.ink }}>{pct}%</span>
                <div style={{ width: "100%", height: `${(pct / mx) * 32}px`, background: m === "Undeclared" ? C.accent2 : rgba(C.blue, 0.2 + (pct / mx) * 0.5), borderRadius: 2, minHeight: 3, transition: "height 0.5s" }} />
                <span style={{ fontSize: 7, color: C.muted }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Leads to */}
        <div style={{ marginTop: 14 }}>
          <SectionLabel>This unlocks</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {r.leadsTo.map(c => <span key={c} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, background: C.subtle, border: `1px solid ${C.border}`, color: "#555", fontWeight: 450 }}>{c}</span>)}
          </div>
        </div>
        {/* Alumni */}
        <div style={{ marginTop: 14 }}>
          <button onClick={() => setShowAlumni(!showAlumni)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 600, color: C.accent2 }}>
            {showAlumni ? "Hide" : "Show"} alumni stories {showAlumni ? "↑" : "↓"}
          </button>
          {showAlumni && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, animation: "fadeUp 0.2s ease both" }}>
              {r.alumni.map((a, ai) => (
                <div key={ai} style={{ padding: "10px 14px", background: C.subtle, borderRadius: 8, borderLeft: `3px solid ${C.accent2}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{a.name}</span>
                    <span style={{ fontSize: 11, color: C.accent2, fontWeight: 500 }}>{a.email}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>{a.dest}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontStyle: "italic" }}>{a.path}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 12, color: C.muted }}>
          <span>{r.building}</span><span style={{ color: C.border }}>|</span><span>{r.times}</span><span style={{ color: C.border }}>|</span><span>{r.seats} seats</span>
        </div>
        <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.red }}>Why this course for you</span>
          <span style={{ fontSize: 12, color: C.muted }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && <p style={{ fontSize: 13, lineHeight: 1.75, color: "#555", margin: "10px 0 0", animation: "fadeUp 0.2s ease both" }}>{r.reason}</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// DEMO APP — shows everything
// ══════════════════════════════════════════

export default function App() {
  const [screen, setScreen] = useState("orb"); // orb | courseLoad | circleLoad | research | coast | explore
  const [orbState, setOrbState] = useState("idle");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;450;500;600;700&family=Instrument+Serif&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes orbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
        @keyframes orbShimmer{0%,100%{opacity:0.3;transform:rotate(0deg)}50%{opacity:0.7;transform:rotate(8deg)}}
        @keyframes dotPulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
        *{box-sizing:border-box}::selection{background:${rgba(C.blue,0.15)}}
      `}</style>

      {/* ─── Loading screens ─── */}
      {screen === "courseLoad" && <CourseLoader onDone={() => setScreen("research")} />}
      {screen === "circleLoad" && <CircleLoader onDone={() => setScreen("orb")} />}

      {/* ─── Orb showcase ─── */}
      {screen === "orb" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 60px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
            <CircleOrb state={orbState} size={200} />
            <div style={{ display: "flex", gap: 4, marginTop: 20 }}>
              {["idle", "listening", "thinking", "matching"].map(s => (
                <button key={s} onClick={() => setOrbState(s)} style={{
                  padding: "5px 14px", borderRadius: 5, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: orbState === s ? 600 : 400,
                  background: orbState === s ? C.ink : C.subtle, color: orbState === s ? "#fff" : C.muted,
                  transition: "all 0.15s",
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 10 }}>Demo transitions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 32 }}>
            <button onClick={() => setScreen("courseLoad")} style={{ padding: "14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.blue} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Course matching loader</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Blue orb + step-by-step progress</div>
            </button>
            <button onClick={() => setScreen("circleLoad")} style={{ padding: "14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent2} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Circle matching loader</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Purple orb + compatibility steps</div>
            </button>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 10 }}>Persona result pages</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[{id:"research",label:"Research",sub:"Labs · Papers · Scholar",c:C.green},{id:"coast",label:"Coast",sub:"GPA sim · Workload · Reviews",c:C.gold},{id:"explore",label:"Explore",sub:"Paths · Alumni · Majors",c:C.accent2}].map(p => (
              <button key={p.id} onClick={() => setScreen(p.id)} style={{ padding: "14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = p.c} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{p.label}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{p.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Persona result pages ─── */}
      {["research", "coast", "explore"].includes(screen) && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 60px" }}>
          <button onClick={() => setScreen("orb")} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", color: C.muted, marginBottom: 16 }}>← Back</button>

          {screen === "research" && (
            <>
              <div style={{ marginBottom: 16, animation: "fadeUp 0.3s ease both" }}>
                <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Research-Optimized Courses</h2>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Ranked by lab openings, co-publishing history, and research fit</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{RES_DATA.map((r, i) => <ResearchCard key={r.course} r={r} i={i} />)}</div>
            </>
          )}

          {screen === "coast" && (
            <>
              <div style={{ marginBottom: 16, animation: "fadeUp 0.3s ease both" }}>
                <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>GPA-Safe Courses</h2>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Current GPA: 3.48 · Target: 3.50+ · Ranked by A-rate and workload</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{COAST_DATA.map((r, i) => <CoastCard key={r.course} r={r} i={i} />)}</div>
            </>
          )}

          {screen === "explore" && (
            <>
              <div style={{ marginBottom: 16, animation: "fadeUp 0.3s ease both" }}>
                <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Exploration Courses</h2>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Taste-test different fields · See where alumni ended up</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{EXPLORE_DATA.map((r, i) => <ExploreCard key={r.course} r={r} i={i} />)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
