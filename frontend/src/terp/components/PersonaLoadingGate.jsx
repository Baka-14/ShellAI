import { useEffect, useState } from "react";
import { C } from "../../shared/theme.js";
import Blob from "./Blob.jsx";
import { postPersonaFromTranscript } from "../api/personaBackend.js";
import { messagesToPlainText } from "../utils/transcriptFormat.js";

const STEPS = [
  "Saving your conversation locally…",
  "Sending transcript to Terp backend…",
  "Running persona model (Ollama)…",
  "Tailoring course copy to your story…",
];

/**
 * Full-screen gate after ConvAI: LLM infers persona + optional course highlights.
 * On failure, calls onResult(null) so the app falls back to heuristic persona.
 *
 * Not the same as /get_preferences (structured course-matching fields); runs only when
 * TerpApp enables USE_LLM_PERSONA and enters the personaLoading phase.
 */
export default function PersonaLoadingGate({ messages, advisorProfile, onResult }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 900);
    let alive = true;
    (async () => {
      const transcriptText = messagesToPlainText(messages);
      try {
        const data = await postPersonaFromTranscript({
          transcriptText,
          messages,
          advisorProfile,
        });
        if (alive) onResult(data);
      } catch (e) {
        console.warn("[persona-llm]", e);
        if (alive) onResult(null);
      } finally {
        clearInterval(tick);
      }
    })();
    return () => {
      alive = false;
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mount; parent passes fresh props via key
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 47px)", padding: 32, gap: 28 }}>
      <Blob state="thinking" size={150} />
      <div style={{ width: "100%", maxWidth: 380 }}>
        <p style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: C.ink, margin: "0 0 8px", textAlign: "center" }}>Understanding your goals</p>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px", textAlign: "center", lineHeight: 1.5 }}>
          We&apos;re reading your conversation to pick the right course-matching mode (research vs GPA vs exploration).
        </p>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              fontSize: 13,
              color: i <= step ? C.ink : "#ccc",
              fontWeight: i === step ? 600 : 400,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ width: 18, textAlign: "center", fontSize: 11, color: i < step ? C.green : i === step ? C.accent2 : "#ddd" }}>
              {i < step ? "✓" : i === step ? "●" : "·"}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
