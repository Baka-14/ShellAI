/** Flatten ElevenLabs SDK messages to plain text for LLM persona calls. */
export function messagesToPlainText(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "";
  const lines = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const src = m.source ?? m.role ?? "unknown";
    const msg = m.message ?? m.text ?? "";
    if (typeof msg === "string" && msg.trim()) lines.push(`${src}: ${msg.trim()}`);
  }
  return lines.join("\n");
}
