import { C } from "../../shared/theme.js";
import { PERSONA_COPY } from "../utils/inferPersona.js";

export default function PersonaMatchBanner({ personaId, llmRationale }) {
  const p = PERSONA_COPY[personaId] || PERSONA_COPY.researcher;
  return (
    <div
      style={{
        marginBottom: 18,
        padding: "14px 16px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(255,255,255,0.9) 50%, rgba(14,165,233,0.05) 100%)",
        animation: "fadeUp 0.35s ease both",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
        Matched to your conversation
      </div>
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, fontWeight: 400, color: C.ink, marginBottom: 8 }}>{p.title}</div>
      <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{p.blurb}</p>
      {llmRationale ? (
        <p style={{ fontSize: 12, color: C.ink, margin: "12px 0 0", paddingTop: 12, borderTop: `1px solid ${C.border}`, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 600, color: C.accent2 }}>Model read on your transcript: </span>
          {llmRationale}
        </p>
      ) : null}
    </div>
  );
}
