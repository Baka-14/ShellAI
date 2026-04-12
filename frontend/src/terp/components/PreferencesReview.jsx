import { C } from "../../shared/theme.js";

/**
 * After ConvAI (preferences are still computed server-side for later use).
 * Simple choice: courses vs circle.
 */
export default function PreferencesReview({ onYourCourses, onYourCircle, coursesBusy = false }) {
  const busy = Boolean(coursesBusy);
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "36px 18px 48px" }}>
      <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 26, fontWeight: 400, color: C.ink, margin: "0 0 10px", textAlign: "center" }}>
        What&apos;s next?
      </h2>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 32px", textAlign: "center", lineHeight: 1.5 }}>
        Your chat is saved. Pick where you&apos;d like to go.
      </p>

      {busy && (
        <p style={{ fontSize: 13, color: C.ink, textAlign: "center", margin: "0 0 16px" }}>Loading course recommendations…</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onYourCourses()}
          style={{
            padding: "16px 14px",
            borderRadius: 10,
            border: "none",
            background: busy ? C.border : C.ink,
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            textAlign: "center",
            opacity: busy ? 0.75 : 1,
          }}
        >
          Your courses
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onYourCircle()}
          style={{
            padding: "16px 14px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "#fff",
            color: C.ink,
            fontSize: 15,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            textAlign: "center",
            opacity: busy ? 0.75 : 1,
          }}
        >
          Your circle
        </button>
      </div>
    </div>
  );
}
