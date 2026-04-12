import { C, rgba } from "../../shared/theme.js";
import { parseScheduleSlot, getDayLabels, minutesToPct } from "../utils/schedule.js";

const COLORS = [rgba(C.red, 0.88), rgba(C.accent2, 0.82), rgba(C.green, 0.78)];

export default function CourseWeekCalendar({ courses }) {
  const slots = (courses || []).map((c, i) => {
    const p = parseScheduleSlot(c.times);
    return {
      course: c.course,
      title: c.title,
      short: c.course.replace(/\s/g, ""),
      ...p,
      color: COLORS[i % COLORS.length],
    };
  });

  const hours = [];
  for (let h = 8; h <= 19; h++) hours.push(h);
  const labels = getDayLabels();

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 14px", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Weekly schedule</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Fall 2026 · blocks from section times (approximate)</div>
      <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
        <div style={{ width: 28, flexShrink: 0, paddingTop: 22, fontSize: 9, color: C.muted, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 240 }}>
          {hours.filter((_, i) => i % 2 === 0).map((h) => (
            <span key={h}>{h <= 12 ? h : h - 12}{h >= 12 ? "p" : "a"}</span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {labels.map((d) => (
              <div key={d} style={{ flex: 1, fontSize: 10, fontWeight: 600, color: C.muted, textAlign: "center" }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {labels.map((d, dayIdx) => (
              <div
                key={d}
                style={{
                  flex: 1,
                  position: "relative",
                  minHeight: 240,
                  borderTop: `1px solid ${C.border}`,
                  borderLeft: dayIdx === 0 ? `1px solid ${C.border}` : undefined,
                  borderRight: `1px solid ${C.border}`,
                  borderBottom: `1px solid ${C.border}`,
                  borderRadius: dayIdx === 4 ? "0 0 6px 0" : 0,
                  background: rgba(C.subtle, 0.35),
                }}
              >
                {hours.map((h) => (
                  <div
                    key={`${d}-${h}`}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${((h - 8) / 12) * 100}%`,
                      borderTop: `1px solid ${rgba(C.border, 0.45)}`,
                    }}
                  />
                ))}
                {slots.map((s, si) =>
                  s.days.includes(dayIdx)
                    ? (() => {
                        const { top, height } = minutesToPct(s.startMin, s.endMin);
                        return (
                          <div
                            key={`${s.course}-${si}-${dayIdx}`}
                            style={{
                              position: "absolute",
                              left: 3,
                              right: 3,
                              top: `${top}%`,
                              height: `${Math.max(height, 8)}%`,
                              background: s.color,
                              borderRadius: 6,
                              padding: "3px 4px",
                              fontSize: 8,
                              fontWeight: 600,
                              color: "#fff",
                              lineHeight: 1.15,
                              overflow: "hidden",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                              zIndex: 1,
                            }}
                            title={`${s.course} · ${s.label}`}
                          >
                            <div>{s.short}</div>
                            <div style={{ fontWeight: 500, opacity: 0.95 }}>{s.title.length > 14 ? `${s.title.slice(0, 12)}…` : s.title}</div>
                          </div>
                        );
                      })()
                    : null,
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
