import { useState } from "react";
import { C, rgba } from "../theme.js";
import Flag from "../../shared/components/Flag.jsx";
import KpiRow from "./KpiRow.jsx";
import DemandBars from "./DemandBars.jsx";
import GoalDonut from "./GoalDonut.jsx";
import Migration from "./Migration.jsx";
import Alerts from "./Alerts.jsx";
import NudgeSection from "./NudgeSection.jsx";
import BeforeAfter from "./BeforeAfter.jsx";
import ChatPanel from "./ChatPanel.jsx";

export default function Dashboard() {
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
          <button
            type="button"
            onClick={() => setChatOpen(!chatOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 6,
              border: chatOpen ? `1.5px solid ${C.red}` : `1px solid ${C.border}`,
              background: chatOpen ? rgba(C.red, 0.04) : "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: chatOpen ? C.red : C.ink,
              transition: "all 0.2s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
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
          <div style={{ animation: "fadeUp 0.3s ease 0.1s both" }}>
            <DemandBars />
          </div>
          <div style={{ animation: "fadeUp 0.3s ease 0.15s both" }}>
            <GoalDonut />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ animation: "fadeUp 0.3s ease 0.2s both" }}>
            <Migration />
          </div>
          <div style={{ animation: "fadeUp 0.3s ease 0.25s both" }}>
            <Alerts />
          </div>
        </div>

        <div style={{ animation: "fadeUp 0.3s ease 0.3s both", marginBottom: 14 }}>
          <NudgeSection />
        </div>
        <div style={{ animation: "fadeUp 0.3s ease 0.35s both" }}>
          <BeforeAfter />
        </div>
      </div>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
