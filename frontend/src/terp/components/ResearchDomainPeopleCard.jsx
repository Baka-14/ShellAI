import { C } from "../../shared/theme.js";

/**
 * @param {{ bucket: { label: string, people: Array<{ name: string, role: string, note?: string }> } }} props
 */
export default function ResearchDomainPeopleCard({ bucket }) {
  if (!bucket?.people?.length) return null;
  return (
    <div
      style={{
        marginBottom: 22,
        padding: "16px 16px 18px",
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        background: "#fff",
        animation: "fadeUp 0.35s ease both",
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, margin: "0 0 6px" }}>
        People in related research areas
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.ink, margin: "0 0 4px" }}>{bucket.label}</p>
      <p style={{ fontSize: 11, color: C.muted, margin: "0 0 14px", lineHeight: 1.45 }}>
        Illustrative names to explore — confirm affiliations on department sites.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {bucket.people.map((p) => (
          <li
            key={p.name}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: C.subtle,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{p.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.role}</div>
            {p.note && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontStyle: "italic" }}>
                {p.note}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
