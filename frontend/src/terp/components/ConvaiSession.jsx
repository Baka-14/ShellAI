import { useState, useRef, useCallback } from "react";
import { C } from "../../shared/theme.js";
import Blob from "./Blob.jsx";
import { buildConvaiSessionOptions } from "../convaiSessionConfig.js";
import {
  parseAdvisorOutputFromText,
  isAdvisorShape,
  isAdvisorComplete,
} from "../utils/parseAdvisorJson.js";
import { postSessionTranscript } from "../api/transcriptBackend.js";
import { postGetPreferences } from "../api/preferencesBackend.js";
import {
  fetchConversationDetailAfterSession,
  fetchGetConversationRoute,
} from "../api/conversationBackend.js";

/**
 * ElevenLabs Conversational AI only (no browser Web Speech API).
 * Voice in/out is handled by @elevenlabs/client (WebRTC/WebSocket per SDK).
 */
export default function ConvaiSession({ onComplete, onError }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | live | ending | wrapping
  const [blobSt, setBlobSt] = useState("idle");
  const [hint, setHint] = useState("");
  const convRef = useRef(null);
  const messagesRef = useRef([]);
  const finalizedRef = useRef(false);

  const finalize = useCallback(
    async (conversationId) => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      const messages = messagesRef.current;
      const agentText = messages
        .filter((m) => m.source === "ai" && m.message)
        .map((m) => m.message)
        .join("\n");
      let parsed = parseAdvisorOutputFromText(agentText);
      if (!parsed) {
        const lastAgent = [...messages].reverse().find((m) => m.source === "ai" && m.message);
        if (lastAgent?.message) parsed = parseAdvisorOutputFromText(lastAgent.message);
      }
      let apiConversation = null;
      let getConversationResponse = null;

      const fetchOnEnd =
        import.meta.env.VITE_FETCH_CONVERSATION_ON_END !== "false" &&
        import.meta.env.VITE_FETCH_CONVERSATION_ON_END !== "0";
      const alsoGetConversationRoute =
        import.meta.env.VITE_FETCH_GET_CONVERSATION_ROUTE_AFTER_END !== "false" &&
        import.meta.env.VITE_FETCH_GET_CONVERSATION_ROUTE_AFTER_END !== "0";

      if (fetchOnEnd && conversationId) {
        try {
          apiConversation = await fetchConversationDetailAfterSession(conversationId);
        } catch (err) {
          console.warn("[conversation-detail]", err);
        }
      }
      if (alsoGetConversationRoute) {
        try {
          getConversationResponse = await fetchGetConversationRoute();
        } catch (err) {
          console.warn("[get_conversation]", err);
        }
      }

      // Dev: full turn-by-turn is in `messages`; optional server snapshot in `apiConversation`.
      console.log("[ConvAI] session ended — transcript payload", {
        conversationId,
        messages,
        apiConversation,
        getConversationResponse,
      });

      const sessionEndPayload = {
        conversation_id: conversationId,
        generated_at: new Date().toISOString(),
        messages,
        advisor_profile: parsed && isAdvisorShape(parsed) ? parsed : null,
        raw_agent_text: agentText || null,
        api_conversation: apiConversation,
        get_conversation: getConversationResponse,
      };

      setStatus("wrapping");
      let preferences = null;
      let preferencesError = null;
      try {
        preferences = await postGetPreferences(sessionEndPayload);
      } catch (err) {
        preferencesError = err instanceof Error ? err.message : String(err);
        console.warn("[get_preferences]", err);
      }

      if (parsed && isAdvisorShape(parsed)) {
        onComplete?.({
          conversationId,
          messages,
          advisorProfile: parsed,
          apiConversation,
          getConversationResponse,
          preferences,
          preferencesError,
        });
      } else {
        onComplete?.({
          conversationId,
          messages,
          advisorProfile: null,
          rawAgentText: agentText,
          apiConversation,
          getConversationResponse,
          preferences,
          preferencesError,
        });
      }
      void postSessionTranscript(sessionEndPayload).catch((err) => console.warn("[transcript]", err));
      convRef.current = null;
      messagesRef.current = [];
      setBlobSt("idle");
      setStatus("idle");
    },
    [onComplete],
  );

  /** After each agent message, if accumulated text parses to a complete advisor JSON, end the session. */
  const tryAutoEndAfterMessage = useCallback(() => {
    const auto =
      import.meta.env.VITE_CONVAI_AUTO_END !== "false" &&
      import.meta.env.VITE_CONVAI_AUTO_END !== "0";
    if (!auto || finalizedRef.current) return;

    const messages = messagesRef.current;
    const agentText = messages
      .filter((m) => m.source === "ai" && m.message)
      .map((m) => m.message)
      .join("\n");
    let parsed = parseAdvisorOutputFromText(agentText);
    if (!parsed) {
      const lastAgent = [...messages].reverse().find((m) => m.source === "ai" && m.message);
      if (lastAgent?.message) parsed = parseAdvisorOutputFromText(lastAgent.message);
    }
    if (!parsed || !isAdvisorComplete(parsed)) return;

    const c = convRef.current;
    if (!c) return;

    void (async () => {
      if (finalizedRef.current) return;
      const conversationId = c.getId?.() ?? null;
      setStatus("ending");
      try {
        await c.endSession();
      } catch (e) {
        onError?.(e instanceof Error ? e.message : String(e));
      }
      await finalize(conversationId);
    })();
  }, [finalize, onError]);

  const start = async () => {
    setHint("");
    finalizedRef.current = false;
    setStatus("connecting");
    setBlobSt("listening");
    messagesRef.current = [];
    try {
      const { Conversation } = await import("@elevenlabs/client");
      const sessionConfig = await buildConvaiSessionOptions();
      const conversation = await Conversation.startSession({
        ...sessionConfig,
        onMessage: (msg) => {
          messagesRef.current.push(msg);
          if (msg?.source === "ai" && msg?.message) tryAutoEndAfterMessage();
        },
        onModeChange: ({ mode }) => {
          setBlobSt(mode === "speaking" ? "thinking" : "listening");
        },
        onStatusChange: ({ status: s }) => {
          if (s === "connected") setStatus("live");
          if (s === "disconnected") setStatus("idle");
        },
        onError: (msg) => {
          const err = typeof msg === "string" ? msg : `${msg}`;
          onError?.(err);
          setHint(err);
        },
        onDisconnect: () => {
          const c = convRef.current;
          const id = c?.getId?.() ?? null;
          if (c) finalize(id);
        },
      });
      convRef.current = conversation;
      setStatus("live");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus("idle");
      setBlobSt("idle");
      setHint(msg);
      onError?.(msg);
    }
  };

  const end = async () => {
    const c = convRef.current;
    if (!c) return;
    const conversationId = c.getId?.() ?? null;
    setStatus("ending");
    try {
      await c.endSession();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : String(e));
    }
    await finalize(conversationId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 47px)", padding: "0 18px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "18px 0 12px" }}>
        <Blob state={blobSt} size={140} />
      </div>
      <p style={{ textAlign: "center", fontSize: 16, fontWeight: 500, color: C.ink, margin: "0 0 8px", lineHeight: 1.45 }}>
        Talk with Terp
      </p>
      <p style={{ textAlign: "center", fontSize: 12, color: C.muted, margin: "0 auto 20px", maxWidth: 420, lineHeight: 1.55 }}>
        Voice is handled by ElevenLabs (not the browser speech API). Allow the microphone when asked. When the agent sends the full intake JSON, the session ends automatically (or tap End anytime).
      </p>

      {status === "wrapping" && (
        <p style={{ textAlign: "center", fontSize: 13, color: C.ink, margin: "0 auto 16px", maxWidth: 400 }}>
          Summarizing your preferences…
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          onClick={start}
          disabled={status === "connecting" || status === "live" || status === "ending" || status === "wrapping"}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            background: status === "live" ? C.border : C.ink,
            color: status === "live" ? C.muted : "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: status === "live" || status === "connecting" ? "default" : "pointer",
          }}
        >
          {status === "connecting" ? "Connecting…" : status === "live" ? "Session live" : "Start conversation"}
        </button>
        <button
          type="button"
          onClick={end}
          disabled={(status !== "live" && status !== "ending") || status === "wrapping"}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: status === "live" ? "pointer" : "default",
            color: C.ink,
          }}
        >
          End conversation
        </button>
      </div>

      {hint && (
        <p style={{ fontSize: 12, color: C.red, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>{hint}</p>
      )}
    </div>
  );
}
