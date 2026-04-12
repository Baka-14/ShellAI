import { useMemo } from "react";
import { C } from "../../shared/theme.js";

/**
 * Voice-agent orb: soft blue / cyan / white gradients (no red “blob”).
 * Motion speeds up when the agent is speaking (`thinking` in our state map).
 */
export default function Blob({ state, onClick, size = 240 }) {
  const isSpeaking = state === "thinking";
  const isListening = state === "listening";
  const isMatching = state === "matching";
  const dur = isSpeaking ? "5s" : isListening ? "12s" : isMatching ? "8s" : "20s";
  const pulse = isSpeaking ? "2.2s" : isListening ? "3.5s" : "4s";

  const styleTag = useMemo(
    () => `
      @keyframes terpOrbSpin { to { transform: rotate(360deg); } }
      @keyframes terpOrbPulse {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.04); opacity: 1; }
      }
      @keyframes terpOrbDrift {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(3%, -2%) scale(1.03); }
        66% { transform: translate(-2%, 2%) scale(0.98); }
      }
    `,
    [],
  );

  return (
    <>
      <style>{styleTag}</style>
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => onClick && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          position: "relative",
          overflow: "hidden",
          cursor: onClick ? "pointer" : "default",
          flexShrink: 0,
          boxShadow: `
            0 ${isSpeaking ? 28 : 18}px ${isSpeaking ? 56 : 40}px rgba(37, 99, 235, 0.18),
            0 0 0 1px rgba(255,255,255,0.5) inset,
            0 -8px 24px rgba(15, 23, 42, 0.06) inset
          `,
          background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(186, 230, 253, 0.75) 18%, rgba(125, 211, 252, 0.55) 42%, rgba(59, 130, 246, 0.65) 72%, rgba(30, 64, 175, 0.85) 100%)",
        }}
      >
        {/* Rotating conic wash — faster when AI speaks */}
        <div
          style={{
            position: "absolute",
            inset: "-45%",
            background: `conic-gradient(
              from 0deg,
              rgba(255,255,255,0.0) 0deg,
              rgba(147, 197, 253, 0.55) 55deg,
              rgba(56, 189, 248, 0.45) 120deg,
              rgba(255,255,255,0.35) 185deg,
              rgba(99, 102, 241, 0.4) 250deg,
              rgba(14, 165, 233, 0.35) 310deg,
              rgba(255,255,255,0.0) 360deg
            )`,
            animation: `terpOrbSpin ${dur} linear infinite`,
            filter: "blur(14px)",
            opacity: isSpeaking ? 0.95 : 0.75,
          }}
        />
        {/* Secondary slower layer for depth */}
        <div
          style={{
            position: "absolute",
            inset: "-25%",
            background: `conic-gradient(
              from 90deg,
              rgba(255,255,255,0.2) 0deg,
              rgba(59, 130, 246, 0.25) 140deg,
              rgba(165, 243, 252, 0.5) 260deg,
              rgba(255,255,255,0.15) 360deg
            )`,
            animation: `terpOrbSpin calc(${dur} * 1.35) linear infinite reverse`,
            filter: "blur(10px)",
            opacity: 0.7,
          }}
        />
        {/* Soft cloud highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "radial-gradient(ellipse 70% 55% at 40% 30%, rgba(255,255,255,0.55) 0%, transparent 55%)",
            animation: `terpOrbDrift ${pulse} ease-in-out infinite`,
            pointerEvents: "none",
          }}
        />
        {/* Specular rim */}
        <div
          style={{
            position: "absolute",
            inset: "6%",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 0 20px rgba(255,255,255,0.25) inset",
            pointerEvents: "none",
            animation: isSpeaking ? `terpOrbPulse ${pulse} ease-in-out infinite` : "none",
          }}
        />
        {/* Subtle Maryland accent only as micro-ring when matching */}
        {isMatching && (
          <div
            style={{
              position: "absolute",
              inset: "-2px",
              borderRadius: "50%",
              border: `2px solid ${C.gold}`,
              opacity: 0.35,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </>
  );
}
