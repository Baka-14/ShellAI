import { EXAMPLE_ADVISOR_OUTPUT } from "../data/advisorProfile.js";
import { messagesToPlainText } from "./transcriptFormat.js";

/**
 * @typedef {object} TranscriptRecord
 * @property {string | null} [conversation_id]
 * @property {unknown[]} [messages]
 * @property {string} [plainText]
 * @property {string} [savedAt]
 */

/**
 * @typedef {object} LlmPersonaRecord
 * @property {string} persona
 * @property {string} [rationale]
 * @property {{ course: string, highlight: string }[]} [course_insights]
 */

/** Persisted session shape in localStorage (STORAGE_KEY). v3 adds transcript + LLM persona. */
export function buildSessionPayload({ ans, advisorProfile, advisorSource, transcript = null, llmPersona = null }) {
  return {
    version: 3,
    profile: {
      program: advisorProfile?.profile?.program ?? ans.program,
      year: advisorProfile?.profile?.year ?? ans.year,
      gpa: advisorProfile?.profile?.gpa ?? ans.gpa,
    },
    advisorProfile: advisorProfile ?? null,
    advisorSource: advisorSource ?? null,
    transcript: transcript ?? null,
    llmPersona: llmPersona ?? null,
    savedAt: new Date().toISOString(),
  };
}

/** Build transcript record from ConvAI SDK messages + optional backend payloads. */
export function buildTranscriptRecord(
  conversationId,
  messages,
  apiConversation = null,
  getConversationResponse = null,
) {
  return {
    conversation_id: conversationId ?? null,
    messages: Array.isArray(messages) ? messages : [],
    plainText: messagesToPlainText(messages),
    /** Full ElevenLabs conversation when `GET /conversation/{id}` succeeds. */
    apiConversation: apiConversation && typeof apiConversation === "object" ? apiConversation : null,
    /** Response from `GET /get_conversation` (signed_url + agent_id) when that route is called after end. */
    get_conversation: getConversationResponse && typeof getConversationResponse === "object" ? getConversationResponse : null,
    savedAt: new Date().toISOString(),
  };
}

export function parseStoredSession(rawString) {
  try {
    const data = JSON.parse(rawString);
    if ((data.version === 3 || data.version === 2) && data.profile) {
      return {
        profile: data.profile,
        advisorProfile: data.advisorProfile ?? null,
        advisorSource: data.advisorSource ?? null,
        transcript: data.transcript ?? null,
        llmPersona: data.llmPersona ?? null,
      };
    }
    if (data.program) {
      return { profile: data, advisorProfile: null, advisorSource: null, transcript: null, llmPersona: null };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** When backend/ElevenLabs is not wired, optionally attach the canonical example object. */
export function resolveAdvisorOutputForSession(ans, useExample) {
  if (!useExample) return { advisor: null, source: null };
  return { advisor: EXAMPLE_ADVISOR_OUTPUT, source: "demo" };
}
