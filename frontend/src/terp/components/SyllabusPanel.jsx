import { C } from "../../shared/theme.js";

export default function SyllabusPanel({ course }) {
  const items = course.syllabusHighlights || [];
  if (!items.length && !course.syllabusUrl) return null;
  return (
    <div style={{ marginTop: 12, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 8 }}>Syllabus highlights</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.65, color: "#555" }}>
        {items.map((line) => (
          <li key={line} style={{ marginBottom: 4 }}>
            {line}
          </li>
        ))}
      </ul>
      {course.syllabusUrl && (
        <a href={course.syllabusUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-block", marginTop: 10, fontSize: 12, color: C.red, fontWeight: 500, textDecoration: "none" }}>
          Open sample syllabus (mock link) →
        </a>
      )}
    </div>
  );
}
