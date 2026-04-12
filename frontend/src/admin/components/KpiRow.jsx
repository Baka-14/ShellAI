import { useState, useEffect } from "react";
import { C } from "../theme.js";

/** Slower count-up than original v2 (~1.4s → ~2.6s). */
const ANIM_DURATION_MS = 2600;

export default function KpiRow() {
  const [vals, setVals] = useState({ a: 0, b: 0, c: 0, d: 0 });
  const targets = { a: 2847, b: 8241, c: 1456, d: 4.3 };
  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const t = Math.min((Date.now() - start) / ANIM_DURATION_MS, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setVals({
        a: Math.round(targets.a * e),
        b: Math.round(targets.b * e),
        c: Math.round(targets.c * e),
        d: +(targets.d * e).toFixed(1),
      });
      if (t < 1) requestAnimationFrame(frame);
    };
    frame();
  }, []);
  const items = [
    { label: "Active users", value: vals.a.toLocaleString(), change: "+12%", spark: [20, 22, 25, 28, 32, 35, 38, 42, 48] },
    { label: "Courses planned", value: vals.b.toLocaleString(), change: "+23%", spark: [30, 35, 40, 42, 50, 55, 60, 72, 82] },
    { label: "Circle matches", value: vals.c.toLocaleString(), change: null, spark: [10, 12, 18, 22, 28, 30, 35, 40, 45] },
    { label: "Avg satisfaction", value: vals.d, change: "+0.2", spark: [38, 39, 40, 40, 41, 41, 42, 42, 43] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
      {items.map((item, i) => {
        const max = Math.max(...item.spark);
        const min = Math.min(...item.spark);
        const pts = item.spark.map((v, j) => `${(j / (item.spark.length - 1)) * 70},${26 - ((v - min) / (max - min + 1)) * 20}`).join(" ");
        return (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, marginBottom: 6 }}>{item.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: "-0.03em" }}>{item.value}</span>
                  {item.change && <span style={{ fontSize: 11, fontWeight: 500, color: C.green }}>{item.change}</span>}
                </div>
              </div>
              <svg width="70" height="26" viewBox="0 0 70 26">
                <polyline points={pts} fill="none" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
