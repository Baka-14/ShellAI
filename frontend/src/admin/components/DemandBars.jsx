import { useState } from "react";
import { C, rgba } from "../theme.js";
import FilterBar from "./FilterBar.jsx";

export default function DemandBars() {
  const [hovered, setHovered] = useState(-1);
  const [dept, setDept] = useState("all");
  const allData = [
    { l: "828A", v: 92, cap: 35, wait: 23, dept: "cs" },
    { l: "723", v: 78, cap: 30, wait: 8, dept: "cs" },
    { l: "421", v: 88, cap: 40, wait: 15, dept: "cs" },
    { l: "606", v: 55, cap: 40, wait: 0, dept: "data" },
    { l: "726", v: 45, cap: 25, wait: 0, dept: "cs" },
    { l: "330", v: 70, cap: 50, wait: 5, dept: "cs" },
    { l: "601", v: 60, cap: 45, wait: 2, dept: "data" },
    { l: "737", v: 35, cap: 30, wait: 0, dept: "info" },
    { l: "767", v: 28, cap: 25, wait: 0, dept: "info" },
  ];
  const data = dept === "all" ? allData : allData.filter((d) => d.dept === dept);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Course demand vs capacity</div>
      </div>
      <FilterBar
        label="Dept:"
        value={dept}
        onChange={setDept}
        options={[
          { id: "all", label: "All" },
          { id: "cs", label: "CS" },
          { id: "data", label: "Data" },
          { id: "info", label: "INFO" },
        ]}
      />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 120, marginBottom: 4 }}>
        {data.map((d, i) => (
          <div
            key={d.l}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(-1)}
          >
            {hovered === i && (
              <div
                style={{
                  position: "absolute",
                  bottom: `${(d.v / 100) * 105 + 12}px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: C.ink,
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  animation: "fadeUp 0.12s ease both",
                  zIndex: 5,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.dept.toUpperCase()} {d.l}</div>
                <div>Demand: {d.v}% of intent</div>
                <div>Capacity: {d.cap} seats</div>
                {d.wait > 0 ? (
                  <div style={{ color: C.gold }}>Waitlist: {d.wait} students</div>
                ) : (
                  <div style={{ color: C.green }}>No waitlist</div>
                )}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: C.ink,
                    position: "absolute",
                    bottom: -4,
                    left: "50%",
                    transform: "translateX(-50%) rotate(45deg)",
                  }}
                />
              </div>
            )}
            <div
              style={{
                width: "100%",
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.2s",
                height: `${(d.v / 100) * 105}px`,
                background: hovered === i ? C.red : d.v > 80 ? rgba(C.red, 0.65) : d.v > 60 ? rgba(C.blue, 0.45) : rgba(C.muted, 0.25),
              }}
            />
            <span style={{ fontSize: 9, color: hovered === i ? C.ink : C.muted, fontWeight: hovered === i ? 600 : 400, transition: "all 0.2s" }}>{d.l}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.muted, marginTop: 6 }}>
        <span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: rgba(C.red, 0.65), marginRight: 4, verticalAlign: "middle" }} />
          High ({">"}80%)
        </span>
        <span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: rgba(C.blue, 0.45), marginRight: 4, verticalAlign: "middle" }} />
          Medium
        </span>
        <span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: rgba(C.muted, 0.25), marginRight: 4, verticalAlign: "middle" }} />
          Low
        </span>
      </div>
    </div>
  );
}
