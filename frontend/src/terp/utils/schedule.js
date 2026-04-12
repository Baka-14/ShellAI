/** Map abbreviated day codes to column index (Mon=0 … Fri=4). */
const DAY_MAP = { M: [0], T: [1], W: [2], Th: [3], F: [4], Tu: [1] };

/**
 * Parse strings like "TuTh 2:00 – 3:15 PM" into { days, startMin, endMin, label }.
 * Times are approximate for layout (minutes from midnight).
 */
export function parseScheduleSlot(times) {
  if (!times || typeof times !== "string") return null;
  const t = times.trim();
  const dayPart = t.split(/\d/)[0]?.trim() || "";
  const m = t.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return { days: [1, 3], startMin: 14 * 60, endMin: 15 * 60 + 15, label: t };

  let sh = parseInt(m[1], 10),
    sm = parseInt(m[2], 10);
  let eh = parseInt(m[3], 10),
    em = parseInt(m[4], 10);
  const ap = m[5].toUpperCase();
  if (ap === "PM" && sh < 12) sh += 12;
  if (ap === "PM" && eh < 12) eh += 12;
  if (ap === "AM" && sh === 12) sh = 0;

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  const days = [];
  let i = 0;
  while (i < dayPart.length) {
    if (dayPart.slice(i, i + 2) === "Th") {
      days.push(3);
      i += 2;
      continue;
    }
    if (dayPart.slice(i, i + 2) === "Tu") {
      days.push(1);
      i += 2;
      continue;
    }
    const ch = dayPart[i];
    if (DAY_MAP[ch]) {
      DAY_MAP[ch].forEach((d) => {
        if (!days.includes(d)) days.push(d);
      });
    }
    i += 1;
  }
  const uniq = [...new Set(days)].sort((a, b) => a - b);
  return { days: uniq.length ? uniq : [1, 3], startMin, endMin, label: t };
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function getDayLabels() {
  return DAY_LABELS;
}

/** Vertical position 0–100 for a block in 8AM–8PM grid. */
export function minutesToPct(startMin, endMin) {
  const base = 8 * 60;
  const span = 12 * 60;
  const top = ((startMin - base) / span) * 100;
  const h = ((endMin - startMin) / span) * 100;
  return { top: Math.max(0, top), height: Math.max(4, h) };
}
