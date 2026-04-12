"""
PlanetTerp client — https://planetterp.com/api/v1

Includes catalog search (`find_courses`) and helpers to enrich Jupiterp course
codes with course metadata, grade distributions (`/grades`), and reviews.
"""

import json
import os
import re
import sys
import time
from typing import Any

import requests

BASE = "https://planetterp.com/api/v1"
PAUSE = float(os.getenv("PLANETTERP_PAUSE", "0.35"))  # polite pacing between API calls

_GRADE_KEYS = (
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D+",
    "D",
    "D-",
    "F",
    "W",
    "Other",
)


def _get(endpoint, **params):
    r = requests.get(f"{BASE}{endpoint}", params=params, timeout=20)
    r.raise_for_status()
    time.sleep(PAUSE)
    return r.json()


def _course_number(name: str) -> int:
    digits = "".join(ch for ch in name if ch.isdigit())
    return int(digits) if digits else 0


def fetch_course(name: str, reviews: bool = True) -> dict | None:
    """GET /course — metadata, optional student reviews."""
    try:
        return _get("/course", name=name, reviews=str(reviews).lower())
    except requests.HTTPError:
        return None


def fetch_grades_for_course(course_name: str) -> list | None:
    """GET /grades — per-section grade counts; at least `course` is required."""
    try:
        data = _get("/grades", course=course_name)
        return data if isinstance(data, list) else None
    except requests.HTTPError:
        return None


def aggregate_grade_rows(rows: list) -> dict[str, Any]:
    """Sum letter buckets across all sections; include total headcount."""
    counts = {k: 0 for k in _GRADE_KEYS}
    for row in rows:
        if not isinstance(row, dict):
            continue
        for k in _GRADE_KEYS:
            v = row.get(k)
            if v is not None:
                counts[k] += int(v)
    counts["total"] = sum(counts[k] for k in _GRADE_KEYS)
    return counts


def _strip_html(s: str | None) -> str:
    if not s or not isinstance(s, str):
        return ""
    t = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", t).strip()


def _unique_strings(seq: list | None, cap: int) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in seq or []:
        if not isinstance(x, str):
            continue
        t = x.strip()
        if t and t not in seen:
            seen.add(t)
            out.append(t)
        if len(out) >= cap:
            break
    return out


def _normalize_reviews(reviews: list | None, limit: int) -> list[dict[str, Any]]:
    rows = [r for r in (reviews or []) if isinstance(r, dict)]
    rows.sort(key=lambda r: str(r.get("created") or ""), reverse=True)
    out: list[dict[str, Any]] = []
    for r in rows[:limit]:
        out.append(
            {
                "professor": r.get("professor"),
                "rating": r.get("rating"),
                "expected_grade": r.get("expected_grade"),
                "created": r.get("created"),
                "review": (str(r.get("review") or "")[:1200]),
            }
        )
    return out


def fetch_planetterp_course_bundle(course_code: str) -> dict[str, Any]:
    """
    Course metadata + aggregated grades + recent reviews for one Jupiterp-style code (e.g. CMSC422).
    """
    name = re.sub(r"\s+", "", (course_code or "").strip().upper())
    if not name:
        return {"ok": False, "error": "empty_course_code"}

    course = fetch_course(name, reviews=True)
    grades_raw = fetch_grades_for_course(name) or []
    reviews_limit = max(1, int(os.getenv("PLANETTERP_REVIEWS_LIMIT", "12")))
    raw_grades_cap = max(10, int(os.getenv("PLANETTERP_RAW_GRADES_MAX", "40")))

    if not course:
        return {
            "ok": False,
            "error": "course_not_found",
            "name": name,
            "grades": {
                "aggregated": aggregate_grade_rows(grades_raw),
                "sections_count": len(grades_raw),
                "sections_sample": grades_raw[:raw_grades_cap] if grades_raw else [],
            },
        }

    aggregated = aggregate_grade_rows(grades_raw)
    grades_sections_out = grades_raw[:raw_grades_cap] if grades_raw else []

    profs = _unique_strings(course.get("professors"), 40)

    bundle: dict[str, Any] = {
        "ok": True,
        "name": course.get("name") or name,
        "title": course.get("title"),
        "credits": course.get("credits"),
        "department": course.get("department"),
        "course_number": course.get("course_number"),
        "average_gpa": course.get("average_gpa"),
        "is_recent": course.get("is_recent"),
        "geneds": course.get("geneds"),
        "description_html": course.get("description"),
        "description_plain": _strip_html(course.get("description")),
        "professors": profs,
        "url": f"https://planetterp.com/course/{course.get('name') or name}",
        "grades": {
            "aggregated": aggregated,
            "sections_count": len(grades_raw),
            "sections_sample": grades_sections_out,
        },
        "reviews": _normalize_reviews(course.get("reviews"), reviews_limit),
    }
    return bundle


def enrich_jupiterp_with_planetterp(jupiterp: dict[str, Any]) -> dict[str, Any]:
    """
    Attach a `planetterp` object to each `course_details` row from a Jupiterp payload.
    Safe to call when `ok` is False or `course_details` is missing.
    """
    if not isinstance(jupiterp, dict):
        return jupiterp
    details = jupiterp.get("course_details")
    if not isinstance(details, list) or not details:
        return {**jupiterp, "planetterp_enriched": False}

    new_details: list[dict[str, Any]] = []
    for row in details:
        if not isinstance(row, dict):
            new_details.append(row)
            continue
        cc = str(row.get("course_code") or "").strip().upper()
        merged = dict(row)
        merged["planetterp"] = fetch_planetterp_course_bundle(cc) if cc else {"ok": False, "error": "no_code"}
        new_details.append(merged)

    return {**jupiterp, "course_details": new_details, "planetterp_enriched": True}


def fetch_department_catalog(department: str, grad_only: bool):
    out, offset, page = [], 0, 100
    while True:
        batch = _get("/courses", department=department, limit=page, offset=offset)
        if not batch:
            break
        out.extend(batch)
        if len(batch) < page:
            break
        offset += page
    if grad_only:
        out = [c for c in out if _course_number(c["name"]) >= 600]
    return out


def course_matches(course: dict, interest_kws: list, avoid_kws: list) -> bool:
    blob = f"{course.get('title','')} {course.get('description','')}".lower()
    if any(bad in blob for bad in avoid_kws):
        return False
    return any(kw in blob for kw in interest_kws)


def top_professors(course: dict, k: int = 3):
    """
    Fetch the professors listed on the course and return the top-k by
    PlanetTerp average rating. This gives the student data-driven picks
    aligned with the review-based reputation the transcript alludes to.
    """
    profs = course.get("professors", []) or []
    enriched = []
    for name in profs:
        try:
            p = _get("/professor", name=name)
            enriched.append({
                "name": p.get("name", name),
                "slug": p.get("slug"),
                "rating": p.get("average_rating"),
            })
        except requests.HTTPError:
            continue
    enriched = [p for p in enriched if p["rating"] is not None]
    enriched.sort(key=lambda p: p["rating"], reverse=True)
    return enriched[:k]


def summarize(course: dict, with_profs: bool = False) -> dict:
    row = {
        "name": course["name"],
        "title": course.get("title"),
        "credits": course.get("credits"),
        "avg_gpa": course.get("average_gpa"),
        "url": f"https://planetterp.com/course/{course['name']}",
    }
    if with_profs:
        row["top_professors"] = top_professors(course)
    return row


def find_courses(profile: dict) -> list:
    """Main entry point. Takes the Gemini-produced profile, returns ranked courses."""
    interests = [k.lower() for k in profile.get("interest_keywords", [])]
    avoid = [k.lower() for k in profile.get("avoid_keywords", [])]
    explicit = profile.get("explicit_courses", [])
    constraints = profile.get("constraints", {})
    department = constraints.get("department", "CMSC")
    grad_only = constraints.get("grad_level_only", True)
    max_credits = constraints.get("max_credits")

    results = {}

    # 1. Explicit picks from the transcript always included
    for name in explicit:
        c = fetch_course(name)
        if c:
            results[name] = summarize(c, with_profs=True)
            results[name]["reason"] = "explicitly requested"

    # 2. Interest-driven catalog scan
    catalog = fetch_department_catalog(department, grad_only)
    print(f"Scanned {len(catalog)} {department} courses "
          f"({'grad-only' if grad_only else 'all levels'})")

    for c in catalog:
        if c["name"] in results:
            continue
        if course_matches(c, interests, avoid):
            row = summarize(c, with_profs=True)
            row["reason"] = "matches interest keywords"
            results[c["name"]] = row

    # 3. Credit sanity (per-course, not total — total is a scheduling concern)
    if max_credits:
        for row in results.values():
            if row["credits"] and row["credits"] > max_credits:
                row["warning"] = f"exceeds max_credits={max_credits}"

    # 4. Rank: GPA as a soft proxy for workload-friendliness given the
    #    "manageable load" signal from the internship mention
    ranked = sorted(
        results.values(),
        key=lambda r: (r.get("avg_gpa") or 0),
        reverse=True,
    )
    return ranked


def main():

    with open("data.json") as f:
        profile = json.load(f)

    ranked = find_courses(profile)
    print(f"\n=== {len(ranked)} relevant courses ===")
    for r in ranked:
        gpa = f"{r['avg_gpa']:.2f}" if r.get("avg_gpa") else "n/a"
        print(f"\n{r['name']} — {r['title']}")
        print(f"  avg GPA: {gpa} | credits: {r.get('credits')} | {r['reason']}")
        if r.get("warning"):
            print(f"  ⚠ {r['warning']}")
        for p in r.get("top_professors", []):
            print(f"  • {p['name']} ({p['rating']:.2f}/5)")
        print(f"  {r['url']}")

    with open("recommendations.json", "w") as f:
        json.dump(ranked, f, indent=2)
    print("\nSaved → recommendations.json")


if __name__ == "__main__":
    main()