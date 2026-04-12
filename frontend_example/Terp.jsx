import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  red: "#E21833", gold: "#FFD520", ink: "#111110", bg: "#FAFAF7",
  card: "#FFFFFF", border: "#E5E3DD", muted: "#8A8880", subtle: "#F3F1EC",
  accent2: "#5B4FCF", green: "#1A7F37", shell: "#FFF8EE",
};
const rgba = (h, a) => { const v = parseInt(h.slice(1), 16); return `rgba(${(v>>16)&255},${(v>>8)&255},${v&255},${a})`; };

function Flag({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: size * 0.2, overflow: "hidden", flexShrink: 0 }}>
      <rect x="0" y="0" width="50" height="50" fill="#FFD520" />
      <polygon points="0,0 25,25 50,0" fill="#111" /><polygon points="0,50 25,25 50,50" fill="#111" />
      <rect x="50" y="50" width="50" height="50" fill="#FFD520" />
      <polygon points="50,50 75,75 100,50" fill="#111" /><polygon points="50,100 75,75 100,100" fill="#111" />
      <rect x="50" y="0" width="50" height="50" fill="#FFF" />
      <rect x="62" y="8" width="26" height="8" fill="#A51C30" rx="1" /><rect x="71" y="4" width="8" height="42" fill="#A51C30" rx="1" />
      <circle cx="63" cy="12" r="4" fill="#A51C30" /><circle cx="87" cy="12" r="4" fill="#A51C30" />
      <circle cx="75" cy="5" r="4" fill="#A51C30" /><circle cx="75" cy="44" r="4" fill="#A51C30" />
      <rect x="0" y="50" width="50" height="50" fill="#FFF" />
      <rect x="12" y="58" width="26" height="8" fill="#A51C30" rx="1" /><rect x="21" y="54" width="8" height="42" fill="#A51C30" rx="1" />
      <circle cx="13" cy="62" r="4" fill="#A51C30" /><circle cx="37" cy="62" r="4" fill="#A51C30" />
      <circle cx="25" cy="55" r="4" fill="#A51C30" /><circle cx="25" cy="94" r="4" fill="#A51C30" />
    </svg>
  );
}

const GOALS = [
  { id: "research", label: "Research & Publish", desc: "Professors with active labs aligned to your interests" },
  { id: "coast", label: "Coast & GPA", desc: "High-A-rate courses with manageable workloads" },
  { id: "skill", label: "Deep Skill Build", desc: "Best teachers, challenging but rewarding" },
  { id: "prereq", label: "Prerequisite Path", desc: "Clear blockers for future target courses" },
  { id: "balanced", label: "Balanced Semester", desc: "Strategic mix of hard and lighter courses" },
  { id: "explore", label: "Explore Electives", desc: "High-rated courses outside your core" },
];

const PROGRAMS = {
  "MS Data Science": { core: ["DATA 601","DATA 602","DATA 603","DATA 604","DATA 605","DATA 606"], electives: ["CMSC 723","CMSC 828A","CMSC 726","INST 737","INST 767","DATA 698"] },
  "MS Computer Science": { core: ["CMSC 614","CMSC 630","CMSC 657","CMSC 714"], electives: ["CMSC 723","CMSC 726","CMSC 828A","CMSC 828T","CMSC 764","CMSC 818J"] },
  "BS Computer Science": { core: ["CMSC 131","CMSC 132","CMSC 216","CMSC 250","CMSC 330","CMSC 351","CMSC 420","CMSC 451"], electives: ["CMSC 421","CMSC 422","CMSC 423","CMSC 424","CMSC 425","CMSC 430","CMSC 434"] },
};

const QS = [
  { key: "program", text: "Select your program.", type: "program" },
  { key: "year", text: "What year are you in?", ph: "e.g. 1st year, 2nd year" },
  { key: "gpa", text: "Current cumulative GPA?", ph: "e.g. 3.85" },
  { key: "taken", text: "Select courses you've completed.", type: "checklist" },
  { key: "count", text: "How many courses should I recommend?", ph: "e.g. 3" },
  { key: "goal", text: "What's your primary goal?", type: "goal" },
  { key: "extra", text: "Any constraints or preferences?", ph: "No 8AMs, MWF only, NLP focus, etc." },
];

const MOCK_COURSES = [
  { course: "CMSC 828A", title: "Fantastic Ideas in ML", prof: "Tom Goldstein", rating: 4.6, pctA: 68, tags: ["Research","Co-publishes"], reason: "Prof. Goldstein runs an active ML lab and frequently co-authors with graduate students. 68% A rate. His recent work on diffusion models aligns with your interests.", website: "https://www.cs.umd.edu/~tomg/", scholar: true, building: "IRB 0318", times: "TuTh 2:00 – 3:15 PM", section: "0101", seats: "12 / 35", seniors: [{name:"Alex T.",note:"Best ML course at UMD — project-heavy but worth every hour"},{name:"Riya S.",note:"Goldstein is brilliant. Office hours are where the real learning happens"}] },
  { course: "CMSC 723", title: "Computational Linguistics", prof: "Jordan Boyd-Graber", rating: 4.3, pctA: 72, tags: ["NLP","Fair grading"], reason: "Rigorous but fair. 72% A rate with deep modern NLP coverage. Boyd-Graber's lab has open positions. Strong alignment with your NLP interest.", website: "https://users.umiacs.umd.edu/~jbg/", scholar: true, building: "CSI 2120", times: "MWF 11:00 – 11:50 AM", section: "0101", seats: "8 / 30", seniors: [{name:"James K.",note:"Challenging, but you learn more about NLP here than anywhere else"},{name:"Mei L.",note:"JBG is one of the best in the department — go to office hours"}] },
  { course: "DATA 606", title: "Statistical Methodology", prof: "Minsuk Kahng", rating: 4.1, pctA: 78, tags: ["Structured","GPA-safe"], reason: "78% A rate with positive reviews on clarity. Good Bayesian methods coverage. Balances heavier courses.", building: "ESJ 0202", times: "TuTh 9:30 – 10:45 AM", section: "0101", seats: "22 / 40", seniors: [{name:"Priya M.",note:"Very manageable workload. Lectures are clear and well-organized"}] },
];

const PAL = ["#5B4FCF","#0F7B5F","#C44536","#2563EB","#7C3AED","#0891B2","#B45309","#6D28D9","#DC2626"];
const MOCK_MATCHES = {
  "CMSC 828A": [
    { name:"Priya Mehta", prog:"MSDS · Year 1", av:"PM", col:PAL[0], compat:92, tags:["ML Research","PyTorch","GANs"], why:"Exploring generative models with diffusion pipeline experience. Seeking ML research collaborators for 828A.", openers:["I saw you're working with diffusion models — have you looked at Prof. Goldstein's recent papers?","We're both in 828A. Interested in teaming up for the final project?"], li:"linkedin.com/in/priyamehta" },
    { name:"Marcus Chen", prog:"MSCS · Year 2", av:"MC", col:PAL[1], compat:87, tags:["Efficient ML","CUDA","Transformers"], why:"Published at ICML on efficient attention. Currently TA for CMSC 421 and member of the CLIP lab.", openers:["Your ICML paper on efficient attention is interesting — I've been benchmarking inference frameworks, would love to compare.","I saw you're TAing 421 — would love to discuss systems + ML."], li:"linkedin.com/in/marcuschen" },
    { name:"Sofia Kapoor", prog:"MSCS · Year 1", av:"SK", col:PAL[2], compat:81, tags:["Computer Vision","Multi-modal","Research"], why:"CV background from undergrad research. Interested in multi-modal learning and looking for a reading group.", openers:["Your CV background would bring a great perspective to 828A — interested in forming a paper reading group?"] },
  ],
  "CMSC 723": [
    { name:"Aisha Rodriguez", prog:"MSDS · Year 1", av:"AR", col:PAL[3], compat:89, tags:["NLP","Bayesian","Clinical Text"], why:"Biostatistics background applying NLP to clinical text. Experienced with spaCy and HuggingFace.", openers:["Your clinical NLP work sounds fascinating — want to pair up for the probabilistic sections in 723?","I've been doing Bayesian inference with PyMC3 — study group?"], li:"linkedin.com/in/aisharodriguez" },
    { name:"James Okafor", prog:"MSCS · Year 1", av:"JO", col:PAL[4], compat:84, tags:["LLM Agents","Prompting","NLP"], why:"Built an LLM-powered code review agent professionally. Focused on agentic AI systems.", openers:["I see you've built production LLM agents — I've been working with LangGraph, would love to compare architectures."], li:"linkedin.com/in/jamesokafor" },
    { name:"Emily Zhang", prog:"MS Ling · Year 2", av:"EZ", col:PAL[5], compat:76, tags:["Formal Semantics","QA Systems","Research"], why:"Bridging formal linguistics into computational methods. Working with Boyd-Graber on QA.", openers:["Your linguistics foundation must give you a unique lens on 723. Any advice on Boyd-Graber's lab?"] },
  ],
  "DATA 606": [
    { name:"Raj Patel", prog:"MSDS · Year 1", av:"RP", col:PAL[6], compat:85, tags:["Statistics","R","Visualization"], why:"Former Deloitte data analyst. Strong in R, looking for a probability theory study group.", openers:["Your Deloitte analytics experience makes 606 feel very applied — study group?"], li:"linkedin.com/in/rajpatel" },
    { name:"Nina Kowalski", prog:"MSDS · Year 1", av:"NK", col:PAL[7], compat:79, tags:["Probability Theory","ML Theory","Python"], why:"Math undergrad with strong probability foundation. Interested in ML applications of stats.", openers:["Your math background is exactly what our study group needs — join for the proof-heavy sections?"] },
    { name:"Daniel Kim", prog:"MSIS · Year 2", av:"DK", col:PAL[8], compat:73, tags:["A/B Testing","Analytics","Python"], why:"Product analytics background with A/B testing at scale. Strengthening statistical foundations.", openers:["Your A/B testing experience must make hypothesis testing very practical — want to collaborate?"] },
  ],
};

// ─── Blob ───
function Blob({ state, onClick, size = 240 }) {
  const ref = useRef(null), anim = useRef(null), t = useRef(0);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    cv.width = size * dpr; cv.height = size * dpr; cv.style.width = size + "px"; cv.style.height = size + "px"; ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2;
    function draw() {
      t.current += 0.012; const T = t.current; ctx.clearRect(0, 0, size, size);
      const spd = state === "listening" ? 2 : state === "thinking" ? 3 : state === "matching" ? 2.5 : 0.6;
      const amp = state === "listening" ? 12 : state === "thinking" ? 18 : state === "matching" ? 14 : 5;
      const bR = size * (state === "thinking" || state === "matching" ? 0.3 : 0.34);
      const gR = ctx.createRadialGradient(cx, cy, bR * 0.5, cx, cy, bR + 50);
      const gc = state === "thinking" ? rgba(C.gold, 0.1) : state === "listening" ? rgba(C.red, 0.08) : state === "matching" ? rgba(C.accent2, 0.08) : "rgba(160,150,140,0.04)";
      gR.addColorStop(0, gc); gR.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = gR; ctx.fillRect(0, 0, size, size);
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const n = Math.sin(a * 3 + T * spd) * amp * 0.45 + Math.cos(a * 5 - T * spd * 0.6) * amp * 0.3 + Math.sin(a * 8 + T * spd * 1.1) * amp * 0.15;
        const x = cx + Math.cos(a) * (bR + n), y = cy + Math.sin(a) * (bR + n);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      const fg = ctx.createLinearGradient(cx - bR, cy - bR, cx + bR, cy + bR);
      if (state === "thinking") { fg.addColorStop(0, C.red); fg.addColorStop(0.4, "#D4451C"); fg.addColorStop(0.7, C.gold); fg.addColorStop(1, C.red); }
      else if (state === "matching") { fg.addColorStop(0, C.accent2); fg.addColorStop(0.6, "#7C3AED"); fg.addColorStop(1, C.red); }
      else if (state === "listening") { fg.addColorStop(0, C.red); fg.addColorStop(1, "#8B1225"); }
      else { fg.addColorStop(0, "#2C2C2A"); fg.addColorStop(0.5, C.red); fg.addColorStop(1, "#1A1A18"); }
      ctx.fillStyle = fg; ctx.fill();
      const hi = ctx.createRadialGradient(cx - bR * 0.18, cy - bR * 0.22, bR * 0.04, cx, cy, bR);
      hi.addColorStop(0, "rgba(255,255,255,0.18)"); hi.addColorStop(0.3, "rgba(255,255,255,0.02)"); hi.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = hi; ctx.fill();
      anim.current = requestAnimationFrame(draw);
    }
    draw(); return () => cancelAnimationFrame(anim.current);
  }, [state, size]);
  return <canvas ref={ref} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }} />;
}

function LoadingView({ steps, blobState, onDone, accent }) {
  const [step, setStep] = useState(0), [prog, setProg] = useState(0), done = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setProg(p => { const n = p + Math.random() * 10 + 5; if (n >= 100 && !done.current) { done.current = true; clearInterval(iv); setTimeout(onDone, 500); return 100; } return Math.min(n, 100); });
      setStep(s => Math.min(s + 1, steps.length - 1));
    }, 800);
    return () => clearInterval(iv);
  }, [onDone, steps.length]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 32, padding: 40 }}>
      <Blob state={blobState} size={160} />
      <div style={{ width: "100%", maxWidth: 300 }}>
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: accent, borderRadius: 1, transition: "width 0.6s ease" }} />
        </div>
        {steps.map((s, i) => (
          <div key={i} style={{ fontSize: 13, color: i <= step ? C.ink : "#ccc", fontWeight: i === step ? 500 : 400, marginBottom: 8, display: "flex", alignItems: "center", gap: 10, transition: "all 0.3s" }}>
            <span style={{ width: 16, textAlign: "center", fontSize: 10, color: i < step ? C.green : i === step ? accent : "#ddd" }}>{i < step ? "✓" : i === step ? "●" : "·"}</span>{s}
          </div>
        ))}
      </div>
    </div>
  );
}

const CS = ["Querying PlanetTerp API...","Fetching grade distributions...","Analyzing professor reviews...","Checking websites & Scholar...","Evaluating section availability...","Ranking recommendations..."];
const MS = ["Scanning Canvas introductions...","Extracting interests & backgrounds...","Cross-referencing LinkedIn profiles...","Scoring compatibility...","Generating conversation starters..."];

function CourseCard({ r, i }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", animation: `fadeUp 0.4s ease ${i * 0.08}s both`, cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#ccc"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; }}>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>{r.course}</span>
              <span style={{ fontSize: 13, color: C.muted }}>{r.title}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginTop: 6 }}>{r.prof}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{r.rating}</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>rating</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: C.muted }}>
          <span>{r.building}</span><span style={{ color: C.border }}>|</span>
          <span>{r.times}</span><span style={{ color: C.border }}>|</span>
          <span>Sec {r.section}</span><span style={{ color: C.border }}>|</span>
          <span style={{ color: parseInt(r.seats) <= 12 ? C.red : C.muted, fontWeight: parseInt(r.seats) <= 12 ? 600 : 400 }}>{r.seats} seats</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, height: 4, background: C.subtle, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${r.pctA}%`, height: "100%", background: C.red, borderRadius: 2, transition: "width 0.8s ease" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, minWidth: 40 }}>{r.pctA}% A</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {r.tags.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 4, background: C.subtle, color: C.muted }}>{t}</span>)}
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.red, marginBottom: 8 }}>Analysis</div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: "#555", margin: "0 0 16px" }}>{r.reason}</p>
            {r.seniors?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 8 }}>Senior Reviews</div>
                {r.seniors.map((s, si) => (
                  <div key={si} style={{ padding: "10px 14px", background: C.subtle, borderRadius: 6, marginBottom: 6, borderLeft: `2px solid ${C.gold}` }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: "#666" }}> — {s.note}</span>
                  </div>
                ))}
              </>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {r.website && <a href={r.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: C.red, fontWeight: 500, textDecoration: "none" }}>Professor website →</a>}
              {r.scholar && <span style={{ fontSize: 12, color: C.red, fontWeight: 500 }}>Google Scholar →</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonCard({ m }) {
  const [showO, setShowO] = useState(false);
  const [cp, setCp] = useState(-1);
  const copy = (t, i) => { navigator.clipboard.writeText(t).catch(() => {}); setCp(i); setTimeout(() => setCp(-1), 1200); };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", transition: "box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: m.col, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{m.av}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{m.name}</span>
              <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{m.prog}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: m.compat >= 90 ? C.green : C.muted, background: m.compat >= 90 ? rgba(C.green, 0.08) : C.subtle, padding: "2px 8px", borderRadius: 4 }}>{m.compat}%</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {m.tags.map(t => <span key={t} style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 3, background: rgba(m.col, 0.06), color: m.col }}>{t}</span>)}
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.55, color: "#666", margin: "8px 0 0" }}>{m.why}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <button onClick={() => setShowO(!showO)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: C.accent2, padding: 0 }}>
              {showO ? "Hide openers" : "Conversation starters"} {showO ? "↑" : "↓"}
            </button>
            {m.li && <span style={{ fontSize: 11, color: "#0A66C2", fontWeight: 500 }}>LinkedIn →</span>}
          </div>
          {showO && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {m.openers.map((o, oi) => (
                <div key={oi} style={{ padding: "8px 10px", background: C.subtle, borderRadius: 6, fontSize: 12, lineHeight: 1.55, color: "#555", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ flex: 1 }}>{o}</span>
                  <button onClick={() => copy(o, oi)} style={{ background: cp === oi ? C.green : "transparent", border: `1px solid ${cp === oi ? C.green : C.border}`, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 600, cursor: "pointer", color: cp === oi ? "#fff" : C.muted, flexShrink: 0, transition: "all 0.2s" }}>{cp === oi ? "✓" : "Copy"}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Hub View ───
function Hub({ onCourses, onCircle, circleReady, ans }) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 18px 50px" }}>
      <div style={{ marginBottom: 24, animation: "fadeUp 0.3s ease both" }}>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Your results are ready</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{GOALS.find(g => g.id === ans.goal)?.label} · {ans.program} · Fall 2026</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, animation: "fadeUp 0.3s ease 0.1s both" }}>
        <button onClick={onCourses} style={{
          padding: "28px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card,
          cursor: "pointer", textAlign: "left", transition: "border-color 0.2s, box-shadow 0.2s",
          display: "flex", flexDirection: "column", gap: 14,
        }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.boxShadow = `0 4px 20px ${rgba(C.red, 0.08)}`; }}
           onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: rgba(C.red, 0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Courses</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{MOCK_COURSES.length} recommendations with professor insights, grade data, and section details</div>
          </div>
          <span style={{ fontSize: 12, color: C.red, fontWeight: 500, marginTop: "auto" }}>View courses →</span>
        </button>

        <button onClick={onCircle} style={{
          padding: "28px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card,
          cursor: "pointer", textAlign: "left", transition: "border-color 0.2s, box-shadow 0.2s",
          display: "flex", flexDirection: "column", gap: 14,
        }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent2; e.currentTarget.style.boxShadow = `0 4px 20px ${rgba(C.accent2, 0.08)}`; }}
           onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: rgba(C.accent2, 0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent2} strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="7" r="3"/><path d="M21 21v-2a3 3 0 00-2-2.8"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Your Circle</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{circleReady ? "9 classmates matched by interests and goals across your courses" : "Find classmates matched by interests, background, and academic goals"}</div>
          </div>
          <span style={{ fontSize: 12, color: C.accent2, fontWeight: 500, marginTop: "auto" }}>{circleReady ? "View matches →" : "Find matches →"}</span>
        </button>
      </div>

      {/* Quick summary */}
      <div style={{ marginTop: 16, padding: "16px 18px", background: C.ink, borderRadius: 8, animation: "fadeUp 0.3s ease 0.2s both" }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.gold, marginBottom: 6 }}>Summary</div>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.6)", margin: 0 }}>Analyzed 12 professors, 105 reviews, 4 semesters of grade data, section availability, and building locations.</p>
      </div>
    </div>
  );
}

// ─── App ───
export default function App() {
  const [profile, setProfile] = useState(null);
  // phases: loading | onboarding | chat | thinking | hub | courses | matchLoading | circle | dashboard
  const [phase, setPhase] = useState("loading");
  const [blobSt, setBlobSt] = useState("idle");
  const [qi, setQi] = useState(0);
  const [ans, setAns] = useState({});
  const [input, setInput] = useState("");
  const [goal, setGoal] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [selProg, setSelProg] = useState("");
  const [circleReady, setCircleReady] = useState(false);
  const inRef = useRef(null), endRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("terp_v7"); if (r?.value) { setProfile(JSON.parse(r.value)); setPhase("dashboard"); } else setPhase("onboarding"); }
      catch { setPhase("onboarding"); }
    })();
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const addMsg = useCallback((role, text) => setMsgs(p => [...p, { role, text }]), []);

  const startChat = () => {
    setPhase("chat"); setBlobSt("listening"); setQi(0); setAns({}); setMsgs([]); setGoal(null); setInput(""); setChecked(new Set()); setSelProg(""); setCircleReady(false);
    setTimeout(() => addMsg("ai", QS[0].text), 300);
  };

  const submit = () => {
    const q = QS[qi], na = { ...ans };
    if (q.type === "goal") { if (!goal) return; addMsg("user", GOALS.find(g => g.id === goal).label); na[q.key] = goal; }
    else if (q.type === "program") { if (!selProg) return; addMsg("user", selProg); na[q.key] = selProg; }
    else if (q.type === "checklist") { const l = [...checked]; addMsg("user", l.length ? l.join(", ") : "None yet"); na[q.key] = l.join(", "); }
    else { if (!input.trim()) return; addMsg("user", input); na[q.key] = input; setInput(""); }
    setAns(na);
    if (qi < QS.length - 1) { const n = qi + 1; setQi(n); setTimeout(() => { addMsg("ai", QS[n].text); inRef.current?.focus(); }, 300); }
    else {
      const p = { program: na.program, year: na.year, gpa: na.gpa };
      setProfile(p); try { window.storage.set("terp_v7", JSON.stringify(p)); } catch {}
      addMsg("ai", "Analyzing courses and professors...");
      setTimeout(() => { setPhase("thinking"); setBlobSt("thinking"); }, 500);
    }
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };
  const reset = () => { try { window.storage.delete("terp_v7"); } catch {} setProfile(null); setPhase("onboarding"); };
  const toggle = c => { const s = new Set(checked); s.has(c) ? s.delete(c) : s.add(c); setChecked(s); };
  const curQ = QS[qi];
  const curr = PROGRAMS[selProg || ans.program] || PROGRAMS["MS Data Science"];

  const headerBack = (label, action) => (
    <button onClick={action} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", color: C.muted }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit',sans-serif", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Instrument+Serif&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input:focus{outline:none}::selection{background:${rgba(C.red,0.15)}}
      `}</style>

      {!["onboarding","loading"].includes(phase) && (
        <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", borderBottom:`1px solid ${C.border}`, background:"#fff", position:"sticky", top:0, zIndex:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Flag size={26} />
            <span style={{ fontFamily:"'Instrument Serif',serif", fontSize:18, fontWeight:400, color:C.ink }}>Terp</span>
          </div>
          {phase === "courses" && headerBack("← Back", () => setPhase("hub"))}
          {phase === "circle" && headerBack("← Back", () => setPhase("hub"))}
          {phase === "hub" && headerBack("Home", () => setPhase("dashboard"))}
        </header>
      )}

      {phase === "loading" && <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}><Blob state="idle" size={90} /></div>}

      {phase === "onboarding" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:40, textAlign:"center" }}>
          <div style={{ animation:"fadeUp 0.6s ease both" }}><Blob state="idle" onClick={startChat} size={180} /></div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:32, animation:"fadeUp 0.6s ease 0.1s both" }}>
            <Flag size={24} />
            <h1 style={{ fontFamily:"'Instrument Serif',serif", fontSize:32, fontWeight:400, color:C.ink, margin:0 }}>Terp</h1>
          </div>
          <p style={{ fontSize:11, fontWeight:600, color:C.red, textTransform:"uppercase", letterSpacing:"0.14em", margin:"8px 0 0", animation:"fadeUp 0.6s ease 0.15s both" }}>University of Maryland</p>
          <p style={{ fontSize:14, color:C.muted, maxWidth:340, lineHeight:1.65, margin:"16px 0 32px", animation:"fadeUp 0.6s ease 0.2s both" }}>AI-powered course planning, professor research, and classmate matching.</p>
          <button onClick={startChat} style={{ background:C.ink, color:"#fff", border:"none", borderRadius:8, padding:"12px 32px", fontSize:14, fontWeight:500, cursor:"pointer", animation:"fadeUp 0.6s ease 0.3s both", transition:"background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = C.red} onMouseLeave={e => e.currentTarget.style.background = C.ink}>Get started</button>
          <p style={{ fontSize:11, color:"#ccc", marginTop:24, animation:"fadeUp 0.6s ease 0.4s both" }}>PlanetTerp · RateMyProfessor · Google Scholar</p>
        </div>
      )}

      {phase === "chat" && (
        <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 47px)" }}>
          <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 2px" }}><Blob state={blobSt} size={120} /></div>
          <div style={{ flex:1, overflowY:"auto", padding:"8px 16px", maxWidth:500, width:"100%", margin:"0 auto" }}>
            {msgs.map((m,i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role === "user" ? "flex-end" : "flex-start", marginBottom:8, animation:"fadeUp 0.2s ease both" }}>
                <div style={{ maxWidth:"82%", padding:"10px 14px", fontSize:14, lineHeight:1.5, borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: m.role === "user" ? C.ink : "#fff", color: m.role === "user" ? "#fff" : C.ink, border: m.role === "ai" ? `1px solid ${C.border}` : "none" }}>{m.text}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div style={{ padding:"10px 16px 16px", maxWidth:500, width:"100%", margin:"0 auto" }}>
            {curQ?.type === "program" ? (
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {Object.keys(PROGRAMS).map(p => (
                  <button key={p} onClick={() => setSelProg(p)} style={{ padding:"11px 14px", borderRadius:8, border: selProg === p ? `1.5px solid ${C.ink}` : `1px solid ${C.border}`, background: selProg === p ? rgba(C.ink, 0.03) : "#fff", cursor:"pointer", textAlign:"left", fontSize:14, fontWeight: selProg === p ? 600 : 400, color:C.ink, transition:"all 0.15s" }}>{p}</button>
                ))}
                <button onClick={submit} disabled={!selProg} style={{ padding:11, borderRadius:8, border:"none", background:selProg ? C.ink : C.border, color:selProg ? "#fff" : "#bbb", fontSize:14, fontWeight:500, cursor:selProg ? "pointer" : "default", marginTop:4 }}>Continue</button>
              </div>
            ) : curQ?.type === "checklist" ? (
              <div>
                {["core","electives"].map(g => (
                  <div key={g} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:C.muted, marginBottom:6 }}>{g}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {(curr[g]||[]).map(c => (
                        <button key={c} onClick={() => toggle(c)} style={{ padding:"5px 10px", borderRadius:6, fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.1s", border: checked.has(c) ? `1.5px solid ${C.ink}` : `1px solid ${C.border}`, background: checked.has(c) ? rgba(C.ink, 0.04) : "#fff", color: checked.has(c) ? C.ink : C.muted }}>{checked.has(c) ? "✓ " : ""}{c}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={submit} style={{ width:"100%", padding:11, borderRadius:8, border:"none", background:C.ink, color:"#fff", fontSize:14, fontWeight:500, cursor:"pointer", marginTop:4 }}>Continue · {checked.size} selected</button>
              </div>
            ) : curQ?.type === "goal" ? (
              <div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
                  {GOALS.map(g => (
                    <button key={g.id} onClick={() => setGoal(g.id)} style={{ padding:"11px 14px", borderRadius:8, textAlign:"left", cursor:"pointer", transition:"all 0.15s", border: goal === g.id ? `1.5px solid ${C.ink}` : `1px solid ${C.border}`, background: goal === g.id ? rgba(C.ink, 0.03) : "#fff" }}>
                      <div style={{ fontSize:14, fontWeight: goal === g.id ? 600 : 500, color:C.ink }}>{g.label}</div>
                      <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{g.desc}</div>
                    </button>
                  ))}
                </div>
                <button onClick={submit} disabled={!goal} style={{ width:"100%", padding:11, borderRadius:8, border:"none", background:goal ? C.ink : C.border, color:goal ? "#fff" : "#bbb", fontSize:14, fontWeight:500, cursor:goal ? "pointer" : "default" }}>Continue</button>
              </div>
            ) : (
              <div style={{ display:"flex", gap:6 }}>
                <input ref={inRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={curQ?.ph || "Type..."} style={{ flex:1, padding:"10px 14px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:14, background:"#fff", color:C.ink }} />
                <button onClick={submit} style={{ width:40, height:40, borderRadius:8, border:"none", background:C.ink, color:"#fff", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>↑</button>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "thinking" && <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 47px)" }}><LoadingView steps={CS} blobState="thinking" accent={C.red} onDone={() => { setPhase("hub"); setBlobSt("idle"); }} /></div>}
      {phase === "matchLoading" && <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 47px)" }}><LoadingView steps={MS} blobState="matching" accent={C.accent2} onDone={() => { setCircleReady(true); setPhase("circle"); }} /></div>}

      {phase === "hub" && <Hub ans={ans} circleReady={circleReady} onCourses={() => setPhase("courses")} onCircle={() => circleReady ? setPhase("circle") : setPhase("matchLoading")} />}

      {phase === "courses" && (
        <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 18px 50px" }}>
          <div style={{ marginBottom:16, animation:"fadeUp 0.3s ease both" }}>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:24, fontWeight:400, color:C.ink, margin:"0 0 4px" }}>Recommended Courses</h2>
            <p style={{ fontSize:12, color:C.muted, margin:0 }}>{GOALS.find(g => g.id === ans.goal)?.label} · {ans.program}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{MOCK_COURSES.map((r,i) => <CourseCard key={r.course} r={r} i={i} />)}</div>
        </div>
      )}

      {phase === "circle" && (
        <div style={{ maxWidth:600, margin:"0 auto", padding:"20px 18px 50px" }}>
          <div style={{ marginBottom:16, animation:"fadeUp 0.3s ease both" }}>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:24, fontWeight:400, color:C.ink, margin:"0 0 4px" }}>Your Circle</h2>
            <p style={{ fontSize:12, color:C.muted, margin:0 }}>Matched by interests, background, and academic goals</p>
          </div>
          {MOCK_COURSES.map((course, ci) => (
            <div key={course.course} style={{ marginBottom:22, animation:`fadeUp 0.3s ease ${ci * 0.08}s both` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, padding:"8px 12px", background:C.subtle, borderRadius:6 }}>
                <div style={{ width:3, height:18, borderRadius:1, background:C.red }} />
                <span style={{ fontSize:14, fontWeight:600, color:C.ink }}>{course.course}</span>
                <span style={{ fontSize:12, color:C.muted }}>{course.title}</span>
                <span style={{ marginLeft:"auto", fontSize:11, color:C.muted }}>{(MOCK_MATCHES[course.course]||[]).length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {(MOCK_MATCHES[course.course]||[]).map(m => <PersonCard key={m.name} m={m} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === "dashboard" && (
        <div style={{ maxWidth:600, margin:"0 auto", padding:"28px 18px 50px" }}>
          <div style={{ marginBottom:20, animation:"fadeUp 0.3s ease both" }}>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:24, fontWeight:400, color:C.ink, margin:"0 0 4px" }}>Welcome back</h2>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>{profile?.program} · Year {profile?.year} · GPA {profile?.gpa}</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20, animation:"fadeUp 0.3s ease 0.1s both" }}>
            {[{title:"New search",desc:"Plan next semester",action:startChat},{title:"Update profile",desc:"Change your info",action:reset}].map(b => (
              <button key={b.title} onClick={b.action} style={{ padding:"16px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", textAlign:"left", transition:"border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#bbb"} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ fontSize:14, fontWeight:600, color:C.ink }}>{b.title}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{b.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"#bbb", marginBottom:10 }}>Previous results</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{MOCK_COURSES.map((r,i) => <CourseCard key={r.course} r={r} i={i} />)}</div>
        </div>
      )}
    </div>
  );
}
