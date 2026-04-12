import { C } from "../../shared/theme.js";

/** Branching majors diagram for Explorer persona (static demo). */
export default function MajorPathwayDiagram() {
  return (
    <div
      style={{
        marginBottom: 20,
        padding: "18px 16px",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>
        Major pathway map
      </div>
      <svg viewBox="0 0 360 108" width="100%" height="108" style={{ display: "block" }}>
        <defs>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={C.accent2} stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <path d="M 180 36 L 64 76" fill="none" stroke="url(#pathGrad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 180 36 L 180 76" fill="none" stroke="url(#pathGrad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M 180 36 L 296 76" fill="none" stroke="url(#pathGrad)" strokeWidth="2" strokeLinecap="round" />
        <g>
          <circle cx="180" cy="28" r="20" fill={C.ink} />
          <text x="180" y="33" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600" fontFamily="Outfit, sans-serif">
            You
          </text>
        </g>
        <g>
          <circle cx="64" cy="86" r="18" fill="#fff" stroke={C.border} strokeWidth="1.5" />
          <text x="64" y="90" textAnchor="middle" fill={C.ink} fontSize="10" fontWeight="600" fontFamily="Outfit, sans-serif">
            CS
          </text>
          <text x="64" y="104" textAnchor="middle" fill={C.muted} fontSize="8" fontFamily="Outfit, sans-serif">
            Systems · ML
          </text>
        </g>
        <g>
          <circle cx="180" cy="86" r="18" fill="#fff" stroke={C.border} strokeWidth="1.5" />
          <text x="180" y="90" textAnchor="middle" fill={C.ink} fontSize="10" fontWeight="600" fontFamily="Outfit, sans-serif">
            Data Sci
          </text>
          <text x="180" y="104" textAnchor="middle" fill={C.muted} fontSize="8" fontFamily="Outfit, sans-serif">
            Stats · ML apps
          </text>
        </g>
        <g>
          <circle cx="296" cy="86" r="18" fill="#fff" stroke={C.border} strokeWidth="1.5" />
          <text x="296" y="90" textAnchor="middle" fill={C.ink} fontSize="10" fontWeight="600" fontFamily="Outfit, sans-serif">
            INFO
          </text>
          <text x="296" y="104" textAnchor="middle" fill={C.muted} fontSize="8" fontFamily="Outfit, sans-serif">
            UX · HCI
          </text>
        </g>
      </svg>
      <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", lineHeight: 1.55 }}>
        Each course below shows which doors it opens — taste-test before you declare.
      </p>
    </div>
  );
}
