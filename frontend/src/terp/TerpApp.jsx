import { useState, useEffect, useCallback, useMemo } from "react";
import { C, rgba } from "../shared/theme.js";
import Flag from "../shared/components/Flag.jsx";
import { storage, STORAGE_KEY } from "../shared/storage.js";
import { GOALS } from "./data/goals.js";
import { MOCK_COURSES } from "./data/mockCourses.js";
import { MOCK_MATCHES } from "./data/mockMatches.js";
import { MATCH_LOADING_STEPS } from "./data/loadingSteps.js";
import {
  buildSessionPayload,
  parseStoredSession,
  resolveAdvisorOutputForSession,
  buildTranscriptRecord,
} from "./utils/sessionPayload.js";
import AdvisorProfilePanel from "./components/AdvisorProfilePanel.jsx";
import LoadingView from "./components/LoadingView.jsx";
import CourseCard from "./components/CourseCard.jsx";
import PersonCard from "./components/PersonCard.jsx";
import Hub from "./components/Hub.jsx";
import ConvaiSession from "./components/ConvaiSession.jsx";
import CourseWeekCalendar from "./components/CourseWeekCalendar.jsx";
import GpaSimulator from "./components/GpaSimulator.jsx";
import WorkloadStrip from "./components/WorkloadStrip.jsx";
import PersonaMatchBanner from "./components/PersonaMatchBanner.jsx";
import MajorPathwayDiagram from "./components/MajorPathwayDiagram.jsx";
import { inferPersonaFromAdvisor } from "./utils/inferPersona.js";
import PersonaLoadingGate from "./components/PersonaLoadingGate.jsx";
import PreferencesReview from "./components/PreferencesReview.jsx";
import JupiterpCoursesSection from "./components/JupiterpCoursesSection.jsx";
import { postGetCourses, postGetPeople } from "./api/convaiFollowUp.js";

const USE_EXAMPLE_ADVISOR = import.meta.env.VITE_USE_EXAMPLE_ADVISOR !== "false";
const USE_LLM_PERSONA = import.meta.env.VITE_USE_LLM_PERSONA === "true";

export default function TerpApp() {
  const [profile, setProfile] = useState(null);
  const [advisorProfile, setAdvisorProfile] = useState(null);
  const [advisorSource, setAdvisorSource] = useState(null);
  /** Root `/` is always the voice session first; use "Saved plan" in the header to open stored results. */
  const [phase, setPhase] = useState("convai");
  const [ans, setAns] = useState({});
  const [circleReady, setCircleReady] = useState(false);
  const [convaiError, setConvaiError] = useState(null);
  const [llmPersonaResult, setLlmPersonaResult] = useState(null);
  const [personaPending, setPersonaPending] = useState(null);
  /** After ConvAI + preferences LLM: resume payload for Find courses / Find people. */
  const [preferencesGate, setPreferencesGate] = useState(null);
  const [jupiterpCoursesPayload, setJupiterpCoursesPayload] = useState(null);
  const [jupiterpCoursesError, setJupiterpCoursesError] = useState(null);
  const [jupiterpCoursesLoading, setJupiterpCoursesLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(STORAGE_KEY);
        if (r?.value) {
          const parsed = parseStoredSession(r.value);
          if (parsed) {
            setProfile(parsed.profile);
            setAdvisorProfile(parsed.advisorProfile);
            setAdvisorSource(parsed.advisorSource);
            setLlmPersonaResult(parsed.llmPersona ?? null);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const persistWithPayload = useCallback((nextAns, ap, src, extras = {}) => {
    storage
      .set(
        STORAGE_KEY,
        JSON.stringify(
          buildSessionPayload({
            ans: nextAns,
            advisorProfile: ap,
            advisorSource: src,
            transcript: extras.transcript ?? null,
            llmPersona: extras.llmPersona ?? null,
          }),
        ),
      )
      .catch(() => {});
  }, []);

  const startChat = () => {
    setPhase("convai");
    setCircleReady(false);
    setAdvisorProfile(null);
    setAdvisorSource(null);
    setAns({});
    setProfile(null);
    setConvaiError(null);
    setLlmPersonaResult(null);
    setPersonaPending(null);
    setPreferencesGate(null);
    setJupiterpCoursesPayload(null);
    setJupiterpCoursesError(null);
    setJupiterpCoursesLoading(false);
  };

  const handlePersonaLlmDone = useCallback(
    async (llmData, pending) => {
      setPersonaPending(null);
      if (!pending) return;
      setLlmPersonaResult(llmData);
      const transcript = buildTranscriptRecord(
        pending.conversationId,
        pending.messages,
        pending.apiConversation ?? null,
        pending.getConversationResponse ?? null,
      );
      persistWithPayload(pending.nextAns, pending.ap, pending.src, {
        transcript,
        llmPersona: llmData,
      });
      setConvaiError(null);
      const want = pending.afterPersonaPhase ?? "hub";
      if (want === "courses" && pending.getCoursesPayload) {
        setJupiterpCoursesLoading(true);
        try {
          const data = await postGetCourses(pending.getCoursesPayload);
          setJupiterpCoursesPayload(data);
          setJupiterpCoursesError(null);
        } catch (e) {
          setJupiterpCoursesPayload(null);
          setJupiterpCoursesError(e instanceof Error ? e.message : String(e));
        } finally {
          setJupiterpCoursesLoading(false);
        }
        setPhase("courses");
        return;
      }
      if (want === "courses") {
        setPhase("courses");
        return;
      }
      if (want === "circle") {
        setPhase(circleReady ? "circle" : "matchLoading");
        return;
      }
      setPreferencesGate(null);
      setPhase("hub");
    },
    [persistWithPayload, circleReady],
  );

  const finishLocalSession = useCallback(
    (nextAns, profileObj, advisor, src, transcriptMeta) => {
      setAns(nextAns);
      setProfile(profileObj);
      setAdvisorProfile(advisor);
      setAdvisorSource(src);
      const transcript = buildTranscriptRecord(
        transcriptMeta.conversationId,
        transcriptMeta.msgs,
        transcriptMeta.apiConversation ?? null,
        transcriptMeta.getConversationResponse ?? null,
      );
      persistWithPayload(nextAns, advisor, src, { transcript, llmPersona: null });
      setLlmPersonaResult(null);
      setConvaiError(null);
    },
    [persistWithPayload],
  );

  const navigateFromPreferences = useCallback(
    async (target) => {
      const gate = preferencesGate;
      if (!gate?.resume) return;
      const { resume } = gate;
      const transcriptMeta = resume.transcriptMeta;
      const followUpPayload = {
        conversation_id: transcriptMeta.conversationId ?? null,
        preferences: gate.preferences != null ? gate.preferences : null,
      };
      const getCoursesPayload = target === "courses" ? followUpPayload : null;

      if (target === "courses" && !USE_LLM_PERSONA) {
        setJupiterpCoursesLoading(true);
        try {
          const data = await postGetCourses(followUpPayload);
          setJupiterpCoursesPayload(data);
          setJupiterpCoursesError(null);
        } catch (e) {
          setJupiterpCoursesPayload(null);
          setJupiterpCoursesError(e instanceof Error ? e.message : String(e));
        } finally {
          setJupiterpCoursesLoading(false);
        }
      } else if (target === "courses" && USE_LLM_PERSONA) {
        setJupiterpCoursesPayload(null);
        setJupiterpCoursesError(null);
      } else {
        setJupiterpCoursesPayload(null);
        setJupiterpCoursesError(null);
        void postGetPeople(followUpPayload).catch((e) => console.warn("[getPeople]", e));
      }

      // Keep preferencesGate so Back from courses/circle returns to "What's next?" (Your courses / Your circle).

      const goPeoplePhase = () => {
        if (circleReady) setPhase("circle");
        else setPhase("matchLoading");
      };

      if (resume.variant === "advisor" && resume.ap) {
        if (USE_LLM_PERSONA) {
          const after = target === "courses" ? "courses" : "circle";
          setAns(resume.nextAns);
          setProfile(resume.profileObj);
          setAdvisorProfile(resume.ap);
          setAdvisorSource("elevenlabs");
          setPersonaPending({
            ap: resume.ap,
            nextAns: resume.nextAns,
            src: "elevenlabs",
            messages: transcriptMeta.msgs,
            conversationId: transcriptMeta.conversationId,
            apiConversation: transcriptMeta.apiConversation ?? null,
            getConversationResponse: transcriptMeta.getConversationResponse ?? null,
            afterPersonaPhase: after,
            getCoursesPayload,
          });
          setConvaiError(null);
          setPhase("personaLoading");
          return;
        }
        finishLocalSession(resume.nextAns, resume.profileObj, resume.ap, "elevenlabs", transcriptMeta);
        if (target === "courses") setPhase("courses");
        else goPeoplePhase();
        return;
      }

      if (resume.variant === "demo") {
        if (USE_LLM_PERSONA) {
          const after = target === "courses" ? "courses" : "circle";
          setAns(resume.nextAns);
          setProfile(resume.profileObj);
          setAdvisorProfile(resume.advisor);
          setAdvisorSource(resume.source);
          setPersonaPending({
            ap: resume.advisor,
            nextAns: resume.nextAns,
            src: resume.source,
            messages: transcriptMeta.msgs,
            conversationId: transcriptMeta.conversationId,
            apiConversation: transcriptMeta.apiConversation ?? null,
            getConversationResponse: transcriptMeta.getConversationResponse ?? null,
            afterPersonaPhase: after,
            getCoursesPayload,
          });
          setConvaiError(null);
          setPhase("personaLoading");
          return;
        }
        finishLocalSession(resume.nextAns, resume.profileObj, resume.advisor, resume.source, transcriptMeta);
        if (target === "courses") setPhase("courses");
        else goPeoplePhase();
        return;
      }

      if (USE_EXAMPLE_ADVISOR) {
        const { advisor, source } = resolveAdvisorOutputForSession({}, true);
        const nextAns = {
          program: advisor.profile.program,
          year: advisor.profile.year,
          gpa: String(advisor.profile.gpa ?? ""),
          goal: advisor.goal.mode,
        };
        const profileObj = { program: nextAns.program, year: nextAns.year, gpa: nextAns.gpa };
        if (USE_LLM_PERSONA) {
          const after = target === "courses" ? "courses" : "circle";
          setAns(nextAns);
          setProfile(profileObj);
          setAdvisorProfile(advisor);
          setAdvisorSource(source);
          setPersonaPending({
            ap: advisor,
            nextAns,
            src: source,
            messages: transcriptMeta.msgs,
            conversationId: transcriptMeta.conversationId,
            apiConversation: transcriptMeta.apiConversation ?? null,
            getConversationResponse: transcriptMeta.getConversationResponse ?? null,
            afterPersonaPhase: after,
            getCoursesPayload,
          });
          setConvaiError(null);
          setPhase("personaLoading");
          return;
        }
        finishLocalSession(nextAns, profileObj, advisor, source, transcriptMeta);
        if (target === "courses") setPhase("courses");
        else goPeoplePhase();
        return;
      }

      setConvaiError(
        "Could not parse structured JSON from the agent. Enable VITE_USE_EXAMPLE_ADVISOR or fix the agent wrap-up JSON.",
      );
      setPreferencesGate(null);
      setPhase("convai");
    },
    [preferencesGate, USE_LLM_PERSONA, USE_EXAMPLE_ADVISOR, circleReady, finishLocalSession],
  );

  const handleConvaiComplete = useCallback(
    ({
      advisorProfile: ap,
      rawAgentText: _raw,
      messages,
      conversationId,
      apiConversation,
      getConversationResponse,
      preferences,
      preferencesError,
    }) => {
      const msgs = Array.isArray(messages) ? messages : [];
      const transcriptMeta = {
        conversationId,
        msgs,
        apiConversation,
        getConversationResponse,
      };

      if (ap) {
        const nextAns = {
          program: ap.profile?.program,
          year: ap.profile?.year,
          gpa: String(ap.profile?.gpa ?? ""),
          goal: ap.goal?.mode,
        };
        const profileObj = { program: nextAns.program, year: nextAns.year, gpa: nextAns.gpa };
        setPreferencesGate({
          preferences: preferences ?? null,
          preferencesError: preferencesError ?? null,
          advisorParseError: null,
          resume: { variant: "advisor", ap, nextAns, profileObj, transcriptMeta },
        });
        setConvaiError(null);
        setPhase("preferencesReview");
        return;
      }
      if (USE_EXAMPLE_ADVISOR) {
        const { advisor, source } = resolveAdvisorOutputForSession({}, true);
        const nextAns = {
          program: advisor.profile.program,
          year: advisor.profile.year,
          gpa: String(advisor.profile.gpa ?? ""),
          goal: advisor.goal.mode,
        };
        const profileObj = { program: nextAns.program, year: nextAns.year, gpa: nextAns.gpa };
        setPreferencesGate({
          preferences: preferences ?? null,
          preferencesError: preferencesError ?? null,
          advisorParseError: null,
          resume: { variant: "demo", advisor, source, nextAns, profileObj, transcriptMeta },
        });
        setConvaiError(null);
        setPhase("preferencesReview");
        return;
      }
      setPreferencesGate({
        preferences: preferences ?? null,
        preferencesError: preferencesError ?? null,
        advisorParseError:
          "Could not parse structured JSON from the agent. Ensure the wrap-up includes the JSON block from your agent prompt.",
        resume: { variant: "none", transcriptMeta },
      });
      setPhase("preferencesReview");
    },
    [USE_EXAMPLE_ADVISOR],
  );

  const reset = () => {
    storage.delete(STORAGE_KEY).catch(() => {});
    setProfile(null);
    setAdvisorProfile(null);
    setAdvisorSource(null);
    setAns({});
    setLlmPersonaResult(null);
    setPersonaPending(null);
    setPreferencesGate(null);
    setJupiterpCoursesPayload(null);
    setJupiterpCoursesError(null);
    setJupiterpCoursesLoading(false);
    setCircleReady(false);
    setConvaiError(null);
    setPhase("convai");
  };

  const advisorLabel =
    advisorSource === "demo" ? "Demo JSON" : advisorSource === "elevenlabs" ? "ElevenLabs" : null;

  const persona = useMemo(() => {
    const p = llmPersonaResult?.persona;
    if (p === "researcher" || p === "closer" || p === "explorer") return p;
    return inferPersonaFromAdvisor(advisorProfile);
  }, [llmPersonaResult, advisorProfile]);

  const courseAiMap = useMemo(() => {
    const m = {};
    const arr = llmPersonaResult?.course_insights;
    if (!Array.isArray(arr)) return m;
    for (const row of arr) {
      if (row?.course && row?.highlight) m[String(row.course).trim()] = String(row.highlight);
    }
    return m;
  }, [llmPersonaResult]);

  const headerBack = (label, action) => (
    <button
      type="button"
      onClick={action}
      style={{
        background: "none",
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        color: C.muted,
      }}
    >
      {label}
    </button>
  );

  /** After "What's next?", return there if that flow is still active; otherwise Hub. */
  const goBackFromCoursesOrCircle = useCallback(() => {
    if (preferencesGate?.resume) setPhase("preferencesReview");
    else setPhase("hub");
  }, [preferencesGate]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Outfit',sans-serif", color: C.ink }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input:focus{outline:none}::selection{background:${rgba(C.red, 0.15)}}
      `}</style>

      {phase !== "personaLoading" && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: `1px solid ${C.border}`,
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flag size={26} />
            <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 18, fontWeight: 400, color: C.ink }}>Terp</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {phase === "convai" && (advisorProfile || profile?.program) && (
              <button
                type="button"
                onClick={() => setPhase("dashboard")}
                style={{
                  background: "none",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  color: C.muted,
                }}
              >
                Saved plan
              </button>
            )}
            {phase === "preferencesReview" &&
              headerBack("← New chat", () => {
                setPreferencesGate(null);
                setPhase("convai");
              })}
            {phase === "courses" && headerBack("← Back", goBackFromCoursesOrCircle)}
            {phase === "circle" && headerBack("← Back", goBackFromCoursesOrCircle)}
            {phase === "hub" && headerBack("Home", () => setPhase("dashboard"))}
          </div>
        </header>
      )}

      {phase === "convai" && (
        <div>
          {convaiError && (
            <p style={{ fontSize: 13, color: C.red, textAlign: "center", padding: "12px 20px 0", maxWidth: 520, margin: "0 auto" }}>{convaiError}</p>
          )}
          <ConvaiSession
            onComplete={handleConvaiComplete}
            onError={(msg) => setConvaiError(msg)}
          />
        </div>
      )}

      {phase === "preferencesReview" && preferencesGate && (
        <PreferencesReview
          coursesBusy={jupiterpCoursesLoading}
          onYourCourses={() => void navigateFromPreferences("courses")}
          onYourCircle={() => void navigateFromPreferences("people")}
        />
      )}

      {phase === "personaLoading" && personaPending && (
        <PersonaLoadingGate
          key={personaPending.conversationId ?? "demo"}
          messages={personaPending.messages}
          advisorProfile={personaPending.ap}
          onResult={(llmData) => {
            void handlePersonaLlmDone(llmData, personaPending);
          }}
        />
      )}

      {phase === "matchLoading" && (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 47px)" }}>
          <LoadingView
            steps={MATCH_LOADING_STEPS}
            blobState="matching"
            accent={C.accent2}
            onDone={() => {
              setCircleReady(true);
              setPhase("circle");
            }}
          />
        </div>
      )}

      {phase === "hub" && (
        <Hub
          ans={ans}
          circleReady={circleReady}
          advisorProfile={advisorProfile}
          advisorDemoLabel={advisorLabel}
          onCourses={() => {
            setPreferencesGate(null);
            setJupiterpCoursesPayload(null);
            setJupiterpCoursesError(null);
            setPhase("courses");
          }}
          onCircle={() => (circleReady ? setPhase("circle") : setPhase("matchLoading"))}
        />
      )}

      {phase === "courses" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 18px 50px" }}>
          <div style={{ marginBottom: 16, animation: "fadeUp 0.3s ease both" }}>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Recommended Courses</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
              {GOALS.find((g) => g.id === ans.goal)?.label ?? ans.goal} · {ans.program}
            </p>
          </div>
          {jupiterpCoursesLoading && (
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px" }}>Updating course recommendations…</p>
          )}
          {jupiterpCoursesError && (
            <p style={{ fontSize: 13, color: C.red, margin: "0 0 14px", lineHeight: 1.45 }}>{jupiterpCoursesError}</p>
          )}
          <JupiterpCoursesSection payload={jupiterpCoursesPayload} />
          <PersonaMatchBanner personaId={persona} llmRationale={llmPersonaResult?.rationale} />
          {persona === "explorer" && <MajorPathwayDiagram />}
          {persona === "closer" && (
            <GpaSimulator baselineGpaStr={String(advisorProfile?.profile?.gpa ?? ans.gpa ?? "")} courses={MOCK_COURSES} />
          )}
          {!jupiterpCoursesPayload?.course_details?.length && !jupiterpCoursesLoading && (
            <>
              <CourseWeekCalendar courses={MOCK_COURSES} />
              <WorkloadStrip courses={MOCK_COURSES} />
              {persona === "researcher" && (
                <p style={{ fontSize: 12, color: C.muted, margin: "0 0 14px", lineHeight: 1.55 }}>
                  For research-first planning we lead with lab fit, venues, and co-authorship — expand courses for Scholar links and RA estimates.
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {MOCK_COURSES.map((r, i) => (
                  <CourseCard key={r.course} r={r} i={i} persona={persona} aiHighlight={courseAiMap[r.course]} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {phase === "circle" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 18px 50px" }}>
          <div style={{ marginBottom: 16, animation: "fadeUp 0.3s ease both" }}>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Your Circle</h2>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Matched by interests, background, and academic goals</p>
          </div>
          {MOCK_COURSES.map((course, ci) => (
            <div key={course.course} style={{ marginBottom: 22, animation: `fadeUp 0.3s ease ${ci * 0.08}s both` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 12px", background: C.subtle, borderRadius: 6 }}>
                <div style={{ width: 3, height: 18, borderRadius: 1, background: C.red }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{course.course}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{course.title}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>{(MOCK_MATCHES[course.course] || []).length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(MOCK_MATCHES[course.course] || []).map((m) => (
                  <PersonCard key={m.name} m={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === "dashboard" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 18px 50px" }}>
          <div style={{ marginBottom: 20, animation: "fadeUp 0.3s ease both" }}>
            <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, color: C.ink, margin: "0 0 4px" }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
              {profile?.program} · Year {profile?.year} · GPA {profile?.gpa}
            </p>
          </div>
          <AdvisorProfilePanel data={advisorProfile} demoLabel={advisorLabel} />
          <PersonaMatchBanner personaId={persona} llmRationale={llmPersonaResult?.rationale} />
          {persona === "explorer" && <MajorPathwayDiagram />}
          {persona === "closer" && (
            <GpaSimulator baselineGpaStr={String(advisorProfile?.profile?.gpa ?? profile?.gpa ?? "")} courses={MOCK_COURSES} />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20, animation: "fadeUp 0.3s ease 0.1s both" }}>
            {[
              { title: "New search", desc: "Plan next semester", action: startChat },
              { title: "Update profile", desc: "Change your info", action: reset },
            ].map((b) => (
              <button
                key={b.title}
                type="button"
                onClick={b.action}
                style={{
                  padding: "16px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#bbb")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{b.title}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{b.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", marginBottom: 10 }}>Previous results</div>
          <CourseWeekCalendar courses={MOCK_COURSES} />
          <WorkloadStrip courses={MOCK_COURSES} />
          {persona === "researcher" && (
            <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px", lineHeight: 1.55 }}>
              Research view: course cards highlight venues, lab capacity, and Scholar trails.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK_COURSES.map((r, i) => (
              <CourseCard key={r.course} r={r} i={i} persona={persona} aiHighlight={courseAiMap[r.course]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
