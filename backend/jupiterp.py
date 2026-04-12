"""
Jupiterp client — course list / sections (https://api.jupiterp.com/v0) plus helpers
to match UMD course codes from TerpAI preference JSON and return enriched payloads.
"""

import json
import os
import re
from difflib import get_close_matches
from typing import Any

import requests

BASE = "https://api.jupiterp.com/v0"
_DEFAULT_JP_TIMEOUT = float(os.getenv("JUPITERP_TIMEOUT", "25"))
# Hard cap on courses returned (courses + course_details lists).
_MAX_CODES = int(os.getenv("JUPITERP_MAX_COURSE_CODES", "10"))
_PREFIX_LIMIT = min(_MAX_CODES, int(os.getenv("JUPITERP_PREFIX_DISCOVERY_LIMIT", "10")))
_BATCH = min(20, max(5, _MAX_CODES))

# Dept + 3 digits + optional letter (CMSC422, MATH 140)
_COURSE_CODE_RE = re.compile(r"\b([A-Za-z]{2,6})\s*(\d{3}[A-Za-z]?)\b")
RECS_PATH = "recommendations.json"
RMP_PATH = "rmp_output.json"
OUTPUT_PATH = "jupiterp_output.json"


_MEETING_RE = re.compile(
    r"^(?P<days>(?:M|Tu|W|Th|F)+)-"
    r"(?P<start>\d{1,2}:\d{2}(?:am|pm))-"
    r"(?P<end>\d{1,2}:\d{2}(?:am|pm))"
    r"(?:-(?P<location>.+))?$",
    re.IGNORECASE,
)


def _timeout() -> float:
    return _DEFAULT_JP_TIMEOUT


def fetch_courses_with_sections(course_codes: list[str]) -> list:
    """GET /courses/withSections — full course rows including `sections`."""
    codes = [c.strip().upper() for c in course_codes if c and str(c).strip()]
    if not codes:
        return []
    params = {"courseCodes": ",".join(codes)}
    r = requests.get(f"{BASE}/courses/withSections", params=params, timeout=_timeout())
    r.raise_for_status()
    return r.json() or []


def fetch_courses_minified(**query: Any) -> list:
    """GET /courses/minified — lightweight discovery (e.g. prefix + limit)."""
    r = requests.get(f"{BASE}/courses/minified", params=query, timeout=_timeout())
    r.raise_for_status()
    return r.json() or []


def normalize_course_code(dept: str, num: str) -> str | None:
    d = (dept or "").strip().upper()
    n = (num or "").strip().upper()
    if len(d) >= 2 and len(d) <= 6 and re.match(r"^\d{3}[A-Z]?$", n):
        return f"{d[:4]}{n}" if len(d) >= 4 else f"{d}{n}"
    return None


def root_preferences(preferences: Any) -> dict:
    """LLM may return a flat object or nest under `preferences`."""
    if not isinstance(preferences, dict):
        return {}
    inner = preferences.get("preferences")
    if isinstance(inner, dict) and (
        "student" in inner or "interests" in inner or "explicit_courses" in inner or "constraints" in inner
    ):
        return inner
    return preferences


def collect_course_codes_from_preferences(preferences: Any) -> tuple[list[str], dict[str, list[str]]]:
    """
    Returns (ordered_unique_codes, reasons) where reasons[course_code] lists
    simple tags like 'explicit', 'interest_text', 'keyword_text'.
    """
    root = root_preferences(preferences)
    reasons: dict[str, list[str]] = {}
    order: list[str] = []
    seen: set[str] = set()

    def touch(code: str | None, reason: str) -> None:
        if not code:
            return
        c = str(code).strip().upper().replace(" ", "")
        if len(c) < 5:
            return
        if c not in seen:
            seen.add(c)
            order.append(c)
            reasons[c] = []
        if reason not in reasons[c]:
            reasons[c].append(reason)

    for raw in root.get("explicit_courses") or []:
        if isinstance(raw, str):
            for m in _COURSE_CODE_RE.finditer(raw):
                code = normalize_course_code(m.group(1), m.group(2))
                touch(code, "explicit")
        elif isinstance(raw, dict) and raw.get("code"):
            touch(str(raw["code"]), "explicit")

    for blob in root.get("interests") or []:
        if isinstance(blob, str):
            for m in _COURSE_CODE_RE.finditer(blob):
                touch(normalize_course_code(m.group(1), m.group(2)), "interest_text")

    for blob in root.get("interest_keywords") or []:
        if isinstance(blob, str):
            for m in _COURSE_CODE_RE.finditer(blob):
                touch(normalize_course_code(m.group(1), m.group(2)), "keyword_text")

    student = root.get("student") if isinstance(root.get("student"), dict) else {}
    prog = str(student.get("program") or "")
    for m in _COURSE_CODE_RE.finditer(prog):
        touch(normalize_course_code(m.group(1), m.group(2)), "program_text")

    return order[:_MAX_CODES], reasons


def course_catalog_number(code: str) -> int | None:
    """Three-digit catalog number from a UMD-style code (e.g. CMSC422 -> 422)."""
    c = (code or "").strip().upper().replace(" ", "")
    m = re.match(r"^[A-Z]{2,6}(\d{3})([A-Z]?)$", c)
    if m:
        return int(m.group(1))
    return None


def infer_student_level(root: dict, preferences: Any = None) -> str:
    """
    graduate — masters / PhD / professional grad programs
    undergraduate — bachelor's or typical UG year hints
    unknown — insufficient signal (neutral ranking)

    Scans the full preference payload (JSON) plus structured fields so transcript-derived
    phrases like "I'm in the MS program" are not missed when `student.program` is empty.
    """
    chunks: list[str] = []
    if isinstance(preferences, dict):
        chunks.append(json.dumps(preferences, default=str).lower())
    student = root.get("student") if isinstance(root.get("student"), dict) else {}
    for k in ("program", "degree", "level", "year"):
        chunks.append(str(student.get(k) or "").lower())
    for key in ("interests", "interest_keywords", "explicit_courses", "goals"):
        v = root.get(key)
        if isinstance(v, list):
            chunks.append(" ".join(str(x) for x in v).lower())
        elif isinstance(v, str):
            chunks.append(v.lower())
    combined = " ".join(chunks).strip()

    cons = root.get("constraints") if isinstance(root.get("constraints"), dict) else {}
    if cons.get("grad_level_only") is True:
        return "graduate"

    if not combined:
        return "unknown"

    # Graduate signals first (avoid MS / year-2 false "undergraduate")
    if re.search(
        r"\b(ph\.?d|ph\.?\s*d|doctorate|doctoral|doctor of philosophy|doctor of science)\b",
        combined,
    ):
        return "graduate"
    if re.search(
        r"\b(master|masters|m\.?\s*s\.?|mscs|ms cs|m\.?eng|mba|graduate certificate|post[\s-]?bac)\b",
        combined,
    ):
        return "graduate"
    if re.search(r"\bgraduate\s+(student|program|school|studies|degree)\b", combined):
        return "graduate"
    if re.search(r"\b(grad|graduate)\s+student\b", combined):
        return "graduate"

    # Undergraduate
    if re.search(r"\b(bachelor|b\.?\s*s\.?|b\.?\s*a\.?|undergrad|undergraduate)\b", combined):
        return "undergraduate"

    yr = student.get("year")
    if not re.search(
        r"\b(master|ph\.?d|m\.?\s*s\.?|graduate|doctoral|mba|mscs)\b",
        combined,
    ):
        if isinstance(yr, (int, float)) and 1 <= int(yr) <= 4:
            return "undergraduate"
        if isinstance(yr, str) and yr.strip().isdigit() and 1 <= int(yr.strip()) <= 4:
            return "undergraduate"

    return "unknown"


def _level_rank_tuple(level: str, code: str, original_index: int) -> tuple:
    """Sort key: lower = more preferred for this student level."""
    n = course_catalog_number(code)
    if n is None:
        return (9, 9999, original_index)
    if level == "graduate":
        if 600 <= n <= 799:
            return (0, n, original_index)
        if 800 <= n <= 899:
            return (1, n, original_index)
        if 500 <= n <= 599:
            return (2, n, original_index)
        return (3, n, original_index)
    if level == "undergraduate":
        if 100 <= n <= 400:
            return (0, n, original_index)
        if 401 <= n <= 499:
            return (1, n, original_index)
        if 500 <= n <= 599:
            return (2, n, original_index)
        return (3, n, original_index)
    # unknown: weak prior toward 600–899 so mixed lists are not dominated by 1xx/2xx
    if 600 <= n <= 899:
        return (1, n, original_index)
    if 100 <= n <= 499:
        return (2, n, original_index)
    return (3, n, original_index)


def rank_course_codes_by_level(codes: list[str], level: str) -> list[str]:
    indexed = list(enumerate(codes))
    indexed.sort(key=lambda ic: _level_rank_tuple(level, ic[1], ic[0]))
    return [c for _, c in indexed]


def infer_department_prefix(root: dict, preferences: Any = None) -> str | None:
    cons = root.get("constraints")
    if isinstance(cons, dict):
        d = cons.get("department")
        if isinstance(d, str) and len(d.strip()) == 4:
            return d.strip().upper()
    student = root.get("student")
    if isinstance(student, dict):
        prog = str(student.get("program") or "").upper()
        if "CMSC" in prog or "COMPSCI" in prog or "COMPUTER SCIENCE" in prog:
            return "CMSC"
        if "DATA" in prog and "SCI" in prog:
            return "DATA"
        if "MATH" in prog:
            return "MATH"
        m = re.search(r"\b([A-Z]{4})\b", prog)
        if m:
            return m.group(1)
    blob = ""
    if isinstance(preferences, dict):
        blob = json.dumps(preferences, default=str).lower()
    if re.search(r"\b(cmsc|computer science|compsci|informatics)\b", blob):
        return "CMSC"
    if re.search(r"\b(data science|data\s+sci)\b", blob):
        return "DATA"
    return None


def _append_minified_prefix_codes(
    ordered: list[str],
    have: set[str],
    match_reasons: dict[str, list[str]],
    prefix: str,
    limit: int,
    reason_tag: str,
) -> None:
    try:
        mini = fetch_courses_minified(prefix=prefix, limit=limit, sortBy="course_code.asc")
    except requests.RequestException:
        return
    for row in mini:
        if not isinstance(row, dict):
            continue
        cc = str(row.get("course_code") or "").strip().upper()
        if cc and cc not in have:
            have.add(cc)
            ordered.append(cc)
            match_reasons.setdefault(cc, []).append(reason_tag)


def fetch_courses_for_preferences(preferences: Any) -> dict[str, Any]:
    """
    Match preference JSON to Jupiterp courses: explicit codes, text scan, optional
    department prefix discovery, then /courses/withSections.

    Returns JSON-serializable dict with `courses` (raw API) and `course_details` (normalized).
    """
    root = root_preferences(preferences)
    student_level = infer_student_level(root, preferences)
    codes, match_reasons = collect_course_codes_from_preferences(preferences)
    prefix_used: str | None = None

    ordered = list(dict.fromkeys(codes))
    have = set(ordered)

    prefix = infer_department_prefix(root, preferences)
    if prefix:
        if student_level == "graduate":
            prefix_used = prefix
            per_tier = max(8, (_PREFIX_LIMIT + 2) // 3)
            for digit, tag in (
                ("6", "graduate_prefix_6xx"),
                ("7", "graduate_prefix_7xx"),
                ("8", "graduate_prefix_8xx"),
            ):
                _append_minified_prefix_codes(
                    ordered, have, match_reasons, f"{prefix}{digit}", per_tier, tag
                )
        elif len(ordered) < 4:
            prefix_used = prefix
            _append_minified_prefix_codes(
                ordered, have, match_reasons, prefix, _PREFIX_LIMIT, "department_prefix"
            )

    ordered = rank_course_codes_by_level(ordered, student_level)
    final_codes = ordered[:_MAX_CODES]

    if not final_codes:
        return {
            "ok": True,
            "student_level_inferred": student_level,
            "course_level_policy": _level_policy_blurb(student_level),
            "matched_codes": [],
            "match_reasons": {},
            "department_prefix_used": prefix_used,
            "courses": [],
            "course_details": [],
            "message": "No course codes inferred from preferences; add explicit_courses or department.",
        }

    raw_courses: list[dict] = []
    seen_codes: set[str] = set()
    for i in range(0, len(final_codes), _BATCH):
        batch = final_codes[i : i + _BATCH]
        try:
            chunk = fetch_courses_with_sections(batch)
        except requests.RequestException:
            chunk = []
        for row in chunk:
            if not isinstance(row, dict):
                continue
            cc = str(row.get("course_code") or row.get("courseCode") or "").strip().upper()
            if cc and cc not in seen_codes:
                seen_codes.add(cc)
                raw_courses.append(row)
            if len(raw_courses) >= _MAX_CODES:
                break
        if len(raw_courses) >= _MAX_CODES:
            break

    raw_courses = raw_courses[:_MAX_CODES]

    by_cc = {str(r.get("course_code") or "").strip().upper(): r for r in raw_courses}
    raw_courses = [by_cc[c] for c in final_codes if c in by_cc][: _MAX_CODES]

    empty_rmp: dict[str, Any] = {"professors": []}
    rmp_index = build_rmp_index(empty_rmp)

    course_details: list[dict[str, Any]] = []
    for row in raw_courses:
        cc = str(row.get("course_code") or "").strip().upper()
        sections = row.get("sections") or []
        summarized = [summarize_section(s, rmp_index) for s in sections if isinstance(s, dict)]
        course_details.append(
            {
                "course_code": cc,
                "name": row.get("name"),
                "min_credits": row.get("min_credits"),
                "max_credits": row.get("max_credits"),
                "gen_eds": row.get("gen_eds"),
                "conditions": row.get("conditions"),
                "description": row.get("description"),
                "section_count": len(summarized),
                "sections": summarized,
                "match_reasons": match_reasons.get(cc, []),
            }
        )

    return {
        "ok": True,
        "student_level_inferred": student_level,
        "course_level_policy": _level_policy_blurb(student_level),
        "matched_codes": [str(row.get("course_code") or "") for row in raw_courses],
        "match_reasons": {
            k: v
            for k, v in match_reasons.items()
            if k in {str(r.get("course_code") or "").strip().upper() for r in raw_courses}
        },
        "department_prefix_used": prefix_used,
        "courses": raw_courses,
        "course_details": course_details,
    }


def _level_policy_blurb(level: str) -> str:
    if level == "graduate":
        return "Ranked for graduate study: 600–799 first, then 800–899, then other levels."
    if level == "undergraduate":
        return "Ranked for undergraduates: 100–400 first, then 401–499, then other levels."
    return (
        "Student level unclear from preferences; 600–899 ranked before 100–499 when levels mix."
    )


def format_meeting(meeting) -> dict:
    """Normalize a meeting. Jupiterp sends these as dash-joined strings like
    'TuTh-9:30am-10:45am-IRB-2107'. Also handles the dict form as a fallback."""
    if isinstance(meeting, str):
        # Some meetings may be "OnlineAsync" or "TBA" with no structured data
        m = _MEETING_RE.match(meeting.strip())
        if not m:
            return {"raw": meeting, "days": None, "start": None, "end": None, "location": None}
        return {
            "days": m.group("days"),
            "start": m.group("start"),
            "end": m.group("end"),
            "location": (m.group("location") or "").strip() or None,
        }

    if isinstance(meeting, dict):
        return {
            "days": meeting.get("days"),
            "start": meeting.get("start_time") or meeting.get("start"),
            "end": meeting.get("end_time") or meeting.get("end"),
            "location": meeting.get("classroom") or meeting.get("location"),
        }

    return {"raw": str(meeting), "days": None, "start": None, "end": None, "location": None}


def instructor_name(inst) -> str:
    """Jupiterp sometimes returns instructors as strings, sometimes as dicts."""
    if isinstance(inst, dict):
        return inst.get("name") or inst.get("fullName") or str(inst)
    return str(inst)


def build_rmp_index(rmp_data: dict) -> dict:
    """Build a lookup: lowercase instructor name -> RMP record."""
    index = {}
    for prof in rmp_data.get("professors", []):
        if prof.get("lookup_status") != "found":
            continue
        # Only keep UMD entries; guard against cross-school matches
        school_id = prof.get("school", {}).get("id")
        if school_id and str(school_id) != "1270":
            continue
        if prof.get("num_ratings", 0) == 0:
            continue
        index[prof["name"].lower()] = prof
    return index


def match_instructor_to_rmp(name: str, rmp_index: dict, cutoff: float = 0.75):
    """Fuzzy-match a Jupiterp instructor name against the RMP index."""
    if not name or not rmp_index:
        return None
    key = name.lower()
    if key in rmp_index:
        return rmp_index[key]
    matches = get_close_matches(key, list(rmp_index.keys()), n=1, cutoff=cutoff)
    if matches:
        return rmp_index[matches[0]]
    return None


def summarize_section(section: dict, rmp_index: dict) -> dict:
    meetings_raw = section.get("meetings") or section.get("class_meetings") or []
    instructors_raw = section.get("instructors") or []

    enriched_instructors = []
    for inst in instructors_raw:
        name = instructor_name(inst)
        rmp = match_instructor_to_rmp(name, rmp_index)
        entry = {"name": name, "rmp": None}
        if rmp:
            entry["rmp"] = {
                "rating": rmp["rating"],
                "difficulty": rmp["difficulty"],
                "would_take_again_percent": rmp["would_take_again_percent"],
                "num_ratings": rmp["num_ratings"],
                "top_tags": rmp["top_tags"][:3],
                "url": rmp["url"],
            }
        enriched_instructors.append(entry)

    return {
        "section_code": section.get("sec_code") or section.get("section_code"),
        "instructors": enriched_instructors,
        "open_seats": section.get("open_seats"),
        "total_seats": section.get("total_seats"),
        "waitlist": section.get("waitlist"),
        "meetings": [format_meeting(m) for m in meetings_raw],
    }


def enrich_with_jupiterp(recommendations: list, rmp_data: dict) -> list:
    """Merge PlanetTerp recommendations with Jupiterp sections and RMP ratings."""
    rmp_index = build_rmp_index(rmp_data)

    course_codes = [c["name"] for c in recommendations]
    if not course_codes:
        return recommendations

    jp_data = fetch_courses_with_sections(course_codes)
    by_code = {c.get("course_code"): c for c in jp_data}

    enriched = []
    for course in recommendations:
        code = course["name"]
        jp = by_code.get(code)

        if not jp:
            course["jupiterp"] = {"status": "not_offered", "sections": []}
            enriched.append(course)
            continue

        sections = jp.get("sections") or []
        summarized = [summarize_section(s, rmp_index) for s in sections]

        course["jupiterp"] = {
            "status": "offered" if sections else "no_sections_listed",
            "credits": jp.get("min_credits"),
            "section_count": len(sections),
            "sections": summarized,
        }
        enriched.append(course)

    return enriched


def main():
    with open(RECS_PATH) as f:
        recs = json.load(f)
    with open(RMP_PATH) as f:
        rmp_data = json.load(f)

    enriched = enrich_with_jupiterp(recs, rmp_data)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(enriched, f, indent=2)

    print(f"\nSaved → {OUTPUT_PATH}")

    # Human-readable summary combining all three data sources
    print("\n=== Combined summary ===")
    for c in enriched:
        jp = c["jupiterp"]
        print(f"\n{c['name']} — {c['title']}")
        print(f"  PlanetTerp GPA: {c.get('avg_gpa') or 'n/a'}  |  status: {jp['status']}")

        if jp["status"] != "offered":
            continue

        for s in jp["sections"]:
            meets = "; ".join(
                f"{m['days']} {m['start']}–{m['end']}".strip()
                for m in s["meetings"] if m.get("start")
            ) or "no meeting times"

            inst_strs = []
            for i in s["instructors"]:
                if i["rmp"]:
                    r = i["rmp"]
                    inst_strs.append(
                        f"{i['name']} (RMP {r['rating']}/5, "
                        f"difficulty {r['difficulty']}, n={r['num_ratings']})"
                    )
                else:
                    inst_strs.append(f"{i['name']} (no RMP data)")

            seats = (f"{s['open_seats']}/{s['total_seats']} seats"
                     if s.get('total_seats') else "")
            print(f"  {s['section_code']}: {', '.join(inst_strs) or 'TBA'}")
            print(f"    {meets}  {seats}")


if __name__ == "__main__":
    main()
    