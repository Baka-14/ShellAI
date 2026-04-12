import { C } from "../theme.js";
import Flag from "../../shared/components/Flag.jsx";

export default function Login({ onLogin }) {
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
          <button
            type="button"
            onClick={onLogin}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: C.ink, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.red)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.ink)}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
