import { C } from "../theme.js";

export default function FilterBar({ options, value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {label && <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>}
      <div style={{ display: "flex", gap: 3, background: C.subtle, borderRadius: 6, padding: 2 }}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              padding: "4px 12px",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: value === o.id ? 600 : 400,
              transition: "all 0.15s",
              background: value === o.id ? C.card : "transparent",
              color: value === o.id ? C.ink : C.muted,
              boxShadow: value === o.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
