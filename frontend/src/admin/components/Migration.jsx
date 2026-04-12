import { useState } from "react";
import { C } from "../theme.js";
import FilterBar from "./FilterBar.jsx";

export default function Migration() {
  const [program, setProgram] = useState("all");
  const allRows = [
    { from: "CS", to: "Data Science", n: 47, pct: "14%", trend: "up", prog: "undergrad" },
    { from: "INFO", to: "CS", n: 23, pct: "8%", trend: "up", prog: "undergrad" },
    { from: "Math", to: "Data Science", n: 18, pct: "6%", trend: "stable", prog: "undergrad" },
    { from: "CS", to: "Undeclared", n: 12, pct: "3%", trend: "down", prog: "undergrad" },
    { from: "MSDS", to: "MSCS", n: 8, pct: "5%", trend: "up", prog: "grad" },
    { from: "MSCS", to: "MSDS", n: 5, pct: "3%", trend: "stable", prog: "grad" },
  ];
  const rows = program === "all" ? allRows : allRows.filter((r) => r.prog === program);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Major migration signals</div>
      <FilterBar
        value={program}
        onChange={setProgram}
        options={[
          { id: "all", label: "All" },
          { id: "undergrad", label: "Undergrad" },
          { id: "grad", label: "Graduate" },
        ]}
      />
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 0",
            borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
            fontSize: 12,
          }}
        >
          <span style={{ fontWeight: 500, color: C.ink, width: 50 }}>{r.from}</span>
          <span style={{ color: C.muted }}>→</span>
          <span style={{ fontWeight: 500, color: C.ink, flex: 1 }}>{r.to}</span>
          <span style={{ color: C.muted }}>
            {r.n} ({r.pct})
          </span>
          <span style={{ fontSize: 10, color: r.trend === "up" ? C.green : r.trend === "down" ? C.red : C.muted }}>{r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "—"}</span>
        </div>
      ))}
    </div>
  );
}
