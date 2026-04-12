import { useState } from "react";
import { C, rgba } from "../../shared/theme.js";

export default function PersonCard({ m }) {
  const [showO, setShowO] = useState(false);
  const [cp, setCp] = useState(-1);
  const copy = (t, i) => {
    navigator.clipboard.writeText(t).catch(() => {});
    setCp(i);
    setTimeout(() => setCp(-1), 1200);
  };
  return (
    <div
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", transition: "box-shadow 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: m.col,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {m.av}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{m.name}</span>
              <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{m.prog}</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: m.compat >= 90 ? C.green : C.muted,
                background: m.compat >= 90 ? rgba(C.green, 0.08) : C.subtle,
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {m.compat}%
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {m.tags.map((t) => (
              <span key={t} style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 3, background: rgba(m.col, 0.06), color: m.col }}>
                {t}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.55, color: "#666", margin: "8px 0 0" }}>{m.why}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => setShowO(!showO)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: C.accent2, padding: 0 }}>
              {showO ? "Hide openers" : "Conversation starters"} {showO ? "↑" : "↓"}
            </button>
            {m.li && <span style={{ fontSize: 11, color: "#0A66C2", fontWeight: 500 }}>LinkedIn →</span>}
          </div>
          {showO && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {m.openers.map((o, oi) => (
                <div key={oi} style={{ padding: "8px 10px", background: C.subtle, borderRadius: 6, fontSize: 12, lineHeight: 1.55, color: "#555", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ flex: 1 }}>{o}</span>
                  <button
                    type="button"
                    onClick={() => copy(o, oi)}
                    style={{
                      background: cp === oi ? C.green : "transparent",
                      border: `1px solid ${cp === oi ? C.green : C.border}`,
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      color: cp === oi ? "#fff" : C.muted,
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {cp === oi ? "✓" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
