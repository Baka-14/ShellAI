import { useState } from "react";
import { C, rgba } from "../theme.js";
import FilterBar from "./FilterBar.jsx";

export default function BeforeAfter() {
  const [showNudge, setShowNudge] = useState(false);
  const [metric, setMetric] = useState("research");
  const datasets = {
    research: {
      label: "Research mode enrollment",
      data: [
        { l: "828A", base: 45, nudge: 62 },
        { l: "723", base: 38, nudge: 44 },
        { l: "726", base: 22, nudge: 35 },
        { l: "764", base: 18, nudge: 32 },
        { l: "818J", base: 12, nudge: 28 },
        { l: "606", base: 8, nudge: 10 },
      ],
    },
    retention: {
      label: "At-risk student course selection",
      data: [
        { l: "606", base: 30, nudge: 52 },
        { l: "601", base: 35, nudge: 48 },
        { l: "434", base: 20, nudge: 38 },
        { l: "330", base: 40, nudge: 45 },
        { l: "451", base: 55, nudge: 42 },
        { l: "828A", base: 25, nudge: 15 },
      ],
    },
  };
  const { label, data } = datasets[metric];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Nudge impact analysis</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <FilterBar
          value={metric}
          onChange={setMetric}
          options={[
            { id: "research", label: "Research" },
            { id: "retention", label: "Retention" },
          ]}
        />
        <button
          type="button"
          onClick={() => setShowNudge(!showNudge)}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            marginBottom: 14,
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.2s",
            background: showNudge ? rgba(C.green, 0.1) : C.subtle,
            color: showNudge ? C.green : C.muted,
          }}
        >
          {showNudge ? "With nudge ✓" : "Without nudge"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
        {data.map((d, i) => {
          const v = showNudge ? d.nudge : d.base;
          const other = showNudge ? d.base : d.nudge;
          const max = 65;
          const better = showNudge && d.nudge > d.base;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: better ? C.green : C.ink, transition: "color 0.3s" }}>{v}%</span>
              <div style={{ width: "100%", position: "relative", height: `${(Math.max(v, other) / max) * 80}px` }}>
                <div
                  style={{
                    width: "100%",
                    borderRadius: 3,
                    position: "absolute",
                    bottom: 0,
                    height: `${(other / max) * 80}px`,
                    background: C.border,
                    opacity: 0.5,
                    transition: "height 0.5s ease",
                  }}
                />
                <div
                  style={{
                    width: "100%",
                    borderRadius: 3,
                    position: "absolute",
                    bottom: 0,
                    height: `${(v / max) * 80}px`,
                    background: showNudge ? C.green : C.red,
                    transition: "all 0.5s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 9, color: C.muted }}>{d.l}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, fontSize: 10, color: C.muted }}>
        <span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: showNudge ? C.green : C.red, marginRight: 4, verticalAlign: "middle" }} />
          Current
        </span>
        <span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: C.border, marginRight: 4, verticalAlign: "middle" }} />
          Comparison
        </span>
      </div>
    </div>
  );
}
