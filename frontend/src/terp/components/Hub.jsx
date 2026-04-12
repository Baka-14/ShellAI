import { C, rgba } from "../../shared/theme.js";
import { GOALS } from "../data/goals.js";
import { MOCK_COURSES } from "../data/mockCourses.js";
import AdvisorProfilePanel from "./AdvisorProfilePanel.jsx";

export default function Hub({ onCourses, onCircle, circleReady, ans, advisorProfile, advisorDemoLabel }) {
  const goalLine = advisorProfile?.goal?.mode
    ? `${String(advisorProfile.goal.mode).toUpperCase()} · ${advisorProfile.profile?.program ?? ans.program}`
    : `${GOALS.find((g) => g.id === ans.goal)?.label ?? "—"} · ${ans.program} · Fall 2026`;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 18px 50px" }}>
      <div style={{ marginBottom: 24, animation: "fadeUp 0.3s ease both" }}>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Your results are ready</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{goalLine}</p>
      </div>

      <AdvisorProfilePanel data={advisorProfile} demoLabel={advisorDemoLabel} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, animation: "fadeUp 0.3s ease 0.1s both" }}>
        <button
          type="button"
          onClick={onCourses}
          style={{
            padding: "28px 20px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.card,
            cursor: "pointer",
            textAlign: "left",
            transition: "border-color 0.2s, box-shadow 0.2s",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.red;
            e.currentTarget.style.boxShadow = `0 4px 20px ${rgba(C.red, 0.08)}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: rgba(C.red, 0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Courses</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{MOCK_COURSES.length} recommendations with professor insights, grade data, and section details</div>
          </div>
          <span style={{ fontSize: 12, color: C.red, fontWeight: 500, marginTop: "auto" }}>View courses →</span>
        </button>

        <button
          type="button"
          onClick={onCircle}
          style={{
            padding: "28px 20px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.card,
            cursor: "pointer",
            textAlign: "left",
            transition: "border-color 0.2s, box-shadow 0.2s",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.accent2;
            e.currentTarget.style.boxShadow = `0 4px 20px ${rgba(C.accent2, 0.08)}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: rgba(C.accent2, 0.06), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent2} strokeWidth="2" strokeLinecap="round">
              <circle cx="9" cy="7" r="4" />
              <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
              <circle cx="19" cy="7" r="3" />
              <path d="M21 21v-2a3 3 0 00-2-2.8" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Your Circle</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              {circleReady ? "9 classmates matched by interests and goals across your courses" : "Find classmates matched by interests, background, and academic goals"}
            </div>
          </div>
          <span style={{ fontSize: 12, color: C.accent2, fontWeight: 500, marginTop: "auto" }}>{circleReady ? "View matches →" : "Find matches →"}</span>
        </button>
      </div>

      <div style={{ marginTop: 16, padding: "16px 18px", background: C.ink, borderRadius: 8, animation: "fadeUp 0.3s ease 0.2s both" }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.gold, marginBottom: 6 }}>Summary</div>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          Analyzed 12 professors, 105 reviews, 4 semesters of grade data, section availability, and building locations.
        </p>
      </div>
    </div>
  );
}
