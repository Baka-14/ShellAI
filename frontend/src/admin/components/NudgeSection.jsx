import { useState } from "react";
import { C, rgba } from "../theme.js";

const NUDGES = [
  { id: "research", label: "Research participation", desc: "Boost research-mode courses and lab-active professors", icon: "🔬", metrics: { reached: 342, acted: 48, impact: "+3% research-mode", ic: C.green } },
  { id: "ta", label: "TA pipeline", desc: "Surface courses needing TAs to qualified students", icon: "🎓", metrics: { reached: 156, acted: 23, impact: "12 TA applications", ic: C.blue } },
  { id: "new_prog", label: "New program discovery", desc: "Promote interdisciplinary AI program to explorers", icon: "🧭", metrics: { reached: 89, acted: 31, impact: "31 enrollments", ic: C.accent2 } },
  { id: "retention", label: "Retention support", desc: "Weight GPA-safe courses for at-risk students", icon: "🛡️", metrics: { reached: 67, acted: 52, impact: "−18% drop risk", ic: C.green } },
];
const LEVELS = ["off", "low", "medium", "high"];
const LC = { off: C.muted, low: "#B8860B", medium: C.blue, high: C.green };

export default function NudgeSection() {
  const [levels, setLevels] = useState({ research: "medium", ta: "off", new_prog: "low", retention: "high" });
  const set = (id, l) => setLevels({ ...levels, [id]: l });
  const active = Object.values(levels).filter((l) => l !== "off").length;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Institutional nudges</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Soft-weight recommendations toward priorities</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.green, background: rgba(C.green, 0.08), padding: "3px 10px", borderRadius: 4 }}>{active} active</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {NUDGES.map((n) => {
          const lv = levels[n.id];
          const on = lv !== "off";
          const m = n.metrics;
          return (
            <div
              key={n.id}
              style={{
                borderRadius: 8,
                border: `1px solid ${on ? rgba(LC[lv], 0.25) : C.border}`,
                overflow: "hidden",
                transition: "all 0.2s",
                background: C.bg,
              }}
            >
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 14 }}>{n.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: on ? C.ink : C.muted }}>{n.label}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{n.desc}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3, color: LC[lv], background: on ? rgba(LC[lv], 0.08) : C.subtle }}>
                    {lv === "off" ? "OFF" : lv.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => set(n.id, l)}
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 10,
                        fontWeight: lv === l ? 600 : 400,
                        transition: "all 0.15s",
                        background: lv === l ? rgba(LC[l], 0.1) : "transparent",
                        color: lv === l ? LC[l] : C.muted,
                        outline: lv === l ? `1.5px solid ${rgba(LC[l], 0.2)}` : "none",
                      }}
                    >
                      {l === "off" ? "Off" : l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
                {on && (
                  <div style={{ display: "flex", gap: 0, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, animation: "fadeUp 0.15s ease both" }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{m.reached}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>reached</div>
                    </div>
                    <div style={{ width: 1, background: C.border }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{m.acted}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>acted</div>
                    </div>
                    <div style={{ width: 1, background: C.border }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: m.ic }}>{m.impact}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>impact</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
