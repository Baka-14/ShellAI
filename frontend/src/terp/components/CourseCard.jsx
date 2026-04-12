import { useState } from "react";
import { C, rgba } from "../../shared/theme.js";
import LiveSeats from "./LiveSeats.jsx";
import SyllabusPanel from "./SyllabusPanel.jsx";
import AlternativesPanel from "./AlternativesPanel.jsx";

function PersonaCourseBody({ r, persona }) {
  const ins = r.personaInsights?.[persona];
  if (!ins) return null;

  if (persona === "researcher") {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1d4ed8", marginBottom: 8 }}>Research signals</div>
        {ins.labRaSpots != null && ins.labRaSpots > 0 && (
          <p style={{ fontSize: 13, color: C.ink, margin: "0 0 8px" }}>
            <strong>{ins.labRaSpots}</strong> RA spot{ins.labRaSpots === 1 ? "" : "s"} flagged this term (lab roster estimate).
          </p>
        )}
        {ins.coPublishes && (
          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px" }}>Faculty pattern: frequent student co-authors on venue papers.</p>
        )}
        {ins.recentPapers?.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#444", lineHeight: 1.65 }}>
            {ins.recentPapers.map((p, idx) => (
              <li key={idx}>
                <span style={{ fontWeight: 600 }}>{p.title}</span> · {p.venue} {p.year}
              </li>
            ))}
          </ul>
        )}
        {ins.scholarQuery && (
          <p style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
            <span style={{ color: C.muted }}>Scholar search: </span>
            <span style={{ fontWeight: 500 }}>{ins.scholarQuery}</span>
          </p>
        )}
      </div>
    );
  }

  if (persona === "closer") {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309", marginBottom: 8 }}>GPA-safe read</div>
        {ins.estWeeklyHours != null && (
          <p style={{ fontSize: 13, color: C.ink, margin: "0 0 6px" }}>
            Est. workload: <strong>{ins.estWeeklyHours} h/wk</strong>
          </p>
        )}
        {ins.curveFriendliness && <p style={{ fontSize: 12, color: C.muted, margin: "0 0 8px", lineHeight: 1.6 }}>{ins.curveFriendliness}</p>}
        {ins.comboNote && (
          <p style={{ fontSize: 12, padding: "10px 12px", background: C.subtle, borderRadius: 6, margin: 0, lineHeight: 1.55 }}>
            <strong>Combo tip:</strong> {ins.comboNote}
          </p>
        )}
      </div>
    );
  }

  if (persona === "explorer") {
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.accent2, marginBottom: 8 }}>Pathways this opens</div>
        {ins.branches?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {ins.branches.map((b) => (
              <span key={b} style={{ fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 999, background: rgba(C.accent2, 0.12), color: C.accent2 }}>
                {b}
              </span>
            ))}
          </div>
        )}
        {ins.peerPaths?.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>People who chose different paths</div>
            {ins.peerPaths.map((peer, idx) => (
              <div key={idx} style={{ padding: "10px 12px", background: C.subtle, borderRadius: 6, marginBottom: 8, borderLeft: `3px solid ${C.accent2}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{peer.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Chose: {peer.chose}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{peer.note}</div>
                {peer.terpMail && (
                  <div style={{ fontSize: 11, marginTop: 6, color: C.ink }}>
                    Terp mail: <span style={{ fontWeight: 600 }}>{peer.terpMail}</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  return null;
}

export default function CourseCard({ r, i, persona = "researcher", aiHighlight }) {
  const [open, setOpen] = useState(false);
  const filled = r.seatsFilled ?? (parseInt(String(r.seats).split("/")[0]?.trim(), 10) || 0);
  const total = r.seatsTotal ?? (parseInt(String(r.seats).split("/")[1]?.trim(), 10) || 1);

  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: "hidden",
        animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
        cursor: "pointer",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "#ccc";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: C.ink, letterSpacing: "-0.02em" }}>{r.course}</span>
              <span style={{ fontSize: 13, color: C.muted }}>{r.title}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, marginTop: 6 }}>{r.prof}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{r.rating}</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>rating</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
          <span>{r.building}</span>
          <span style={{ color: C.border }}>|</span>
          <span>{r.times}</span>
          <span style={{ color: C.border }}>|</span>
          <span>Sec {r.section}</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <LiveSeats filled={filled} total={total} courseCode={r.course} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, height: 4, background: C.subtle, borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                width: `${r.pctA}%`,
                height: "100%",
                background: persona === "closer" ? "linear-gradient(90deg, #2563eb, #0891b2)" : C.red,
                borderRadius: 2,
                transition: "width 0.8s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, minWidth: 40 }}>{r.pctA}% A</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
          {r.tags.map((t) => (
            <span key={t} style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 4, background: C.subtle, color: C.muted }}>
              {t}
            </span>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
            <PersonaCourseBody r={r} persona={persona} />
            {aiHighlight ? (
              <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 8, background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(14,165,233,0.06))", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: C.accent2, textTransform: "uppercase", marginBottom: 6 }}>From your conversation</div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: C.ink, margin: 0 }}>{aiHighlight}</p>
              </div>
            ) : null}
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.red, marginBottom: 8 }}>Analysis</div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: "#555", margin: "0 0 16px" }}>{r.reason}</p>
            <AlternativesPanel alternatives={r.alternatives} />
            <SyllabusPanel course={r} />
            {r.seniors?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 8, marginTop: 14 }}>Senior Reviews</div>
                {r.seniors.map((s, si) => (
                  <div key={si} style={{ padding: "10px 14px", background: C.subtle, borderRadius: 6, marginBottom: 6, borderLeft: `2px solid ${C.gold}` }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: "#666" }}> — {s.note}</span>
                  </div>
                ))}
              </>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {r.website && (
                <a href={r.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, color: C.red, fontWeight: 500, textDecoration: "none" }}>
                  Professor website →
                </a>
              )}
              {r.scholar && (
                <a
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(r.prof + " UMD")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 12, color: C.red, fontWeight: 500, textDecoration: "none" }}
                >
                  Google Scholar →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
