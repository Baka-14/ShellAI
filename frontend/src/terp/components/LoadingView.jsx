import { useState, useEffect, useRef } from "react";
import { C } from "../../shared/theme.js";
import Blob from "./Blob.jsx";

export default function LoadingView({ steps, blobState, onDone, accent }) {
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setProg((p) => {
        const n = p + Math.random() * 10 + 5;
        if (n >= 100 && !done.current) {
          done.current = true;
          clearInterval(iv);
          setTimeout(onDone, 500);
          return 100;
        }
        return Math.min(n, 100);
      });
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }, 800);
    return () => clearInterval(iv);
  }, [onDone, steps.length]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 32, padding: 40 }}>
      <Blob state={blobState} size={160} />
      <div style={{ width: "100%", maxWidth: 300 }}>
        <div style={{ height: 2, background: C.border, borderRadius: 1, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ height: "100%", width: `${prog}%`, background: accent, borderRadius: 1, transition: "width 0.6s ease" }} />
        </div>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              fontSize: 13,
              color: i <= step ? C.ink : "#ccc",
              fontWeight: i === step ? 500 : 400,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.3s",
            }}
          >
            <span style={{ width: 16, textAlign: "center", fontSize: 10, color: i < step ? C.green : i === step ? accent : "#ddd" }}>
              {i < step ? "✓" : i === step ? "●" : "·"}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
