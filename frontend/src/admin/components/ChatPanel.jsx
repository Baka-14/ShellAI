import { useState, useEffect, useRef } from "react";
import { C } from "../theme.js";
import Flag from "../../shared/components/Flag.jsx";

export default function ChatPanel({ open, onClose }) {
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "I have access to all Terp interaction data. Ask me about enrollment patterns, student sentiment, demand signals, or nudge effectiveness." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const responses = {
    demand:
      "CMSC 828A has 3.2x more intent signals than available seats. Waitlist started 2 weeks earlier than last fall. Recommend opening a second section or increasing capacity to 50.",
    research:
      "Research-mode selections dropped from 24% to 18% year-over-year. Primary driver: students report uncertainty about lab availability. Since activating the research nudge at 'Medium', we've seen a 3% recovery.",
    retention:
      "12 MSDS students show coast-mode + declining GPA trajectory. 4 are international students who haven't engaged with Circle matches. Consider targeted advisor outreach for these students.",
    nudge:
      "The research nudge at 'Medium' intensity has reached 342 students and 48 have acted (14% conversion). Research-mode selections are up 3% since activation. Recommend increasing to 'High' for the remaining registration window.",
    default: "I can analyze enrollment intent, goal-mode trends, professor sentiment, nudge effectiveness, and at-risk student patterns. What would you like to explore?",
  };

  const send = () => {
    if (!input.trim()) return;
    const q = input.toLowerCase();
    setMsgs((p) => [...p, { role: "user", text: input }]);
    setInput("");
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
      setMsgs((p) => [...p, { role: "ai", text: responses[key] }]);
    }, 700);
  };

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 370,
        height: "100vh",
        background: C.card,
        borderLeft: `1px solid ${C.border}`,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flag size={18} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Terp Intelligence</span>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 0, lineHeight: 1 }}>
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div
              style={{
                maxWidth: "88%",
                padding: "9px 13px",
                fontSize: 12,
                lineHeight: 1.6,
                borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                background: m.role === "user" ? C.ink : C.subtle,
                color: m.role === "user" ? "#fff" : C.ink,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {["828A demand?", "Research trends?", "At-risk students?", "Nudge impact?"].map((q) => (
            <button key={q} type="button" onClick={() => setInput(q)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 10, color: C.muted, fontWeight: 500 }}>
              {q}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about student data..."
            style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, background: "#fff", color: C.ink, outline: "none" }}
          />
          <button type="button" onClick={send} style={{ width: 34, height: 34, borderRadius: 6, border: "none", background: C.ink, color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
