import { useState, useEffect, useMemo } from "react";
import { C, rgba } from "../../shared/theme.js";

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Mock “live” registration pulse: small random walk within capacity.
 */
export default function LiveSeats({ filled: initialFilled, total, courseCode }) {
  const [filled, setFilled] = useState(initialFilled);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setFilled(initialFilled);
  }, [initialFilled, courseCode]);

  useEffect(() => {
    const id = setInterval(() => {
      setFilled((f) => {
        const delta = Math.random() < 0.5 ? -1 : 1;
        return clamp(f + delta, Math.max(0, initialFilled - 2), Math.min(total, initialFilled + 2));
      });
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    }, 4500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, [initialFilled, total]);

  const pct = total > 0 ? (filled / total) * 100 : 0;
  const stress = pct >= 85 ? C.red : pct >= 60 ? "#B8860B" : C.green;

  const label = useMemo(() => `${filled} / ${total} seats`, [filled, total]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>Live seats</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: stress,
          transition: "color 0.3s, transform 0.25s",
          transform: pulse ? "scale(1.03)" : "scale(1)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 80,
          height: 6,
          background: C.subtle,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, pct)}%`,
            height: 6,
            background: stress,
            borderRadius: 2,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: rgba(C.ink, 0.45) }}>mock refresh</span>
    </div>
  );
}
