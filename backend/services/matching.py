"""
HireSense AI — Candidate ↔ requirement matching
Lightweight, no-API overlap scoring used for per-job candidate ranking and
natural-language candidate search.
"""

from backend.services.skill_dictionary import (
    SKILL_CATEGORIES,
    normalize_skill,
    find_skills_in_text,
    get_skill_category,
)


def expand_skills(skills: list) -> set:
    """Expand a skill list with category-aware aliases (react → reactjs, etc.)."""
    expanded = set()
    for raw in skills:
        s = normalize_skill(raw)
        if not s:
            continue
        expanded.add(s)
        cat = get_skill_category(s)
        if cat != "other":
            for cat_skill in SKILL_CATEGORIES.get(cat, []):
                norm = normalize_skill(cat_skill)
                if norm.startswith(s) or s.startswith(norm):
                    expanded.add(norm)
    return expanded


def requirements_from_text(text: str) -> list:
    """Extract required skill tokens from free text (JD or search query)."""
    reqs = find_skills_in_text(text or "")
    return [normalize_skill(r) for r in reqs if r and r.strip()]


def match_score(candidate_skills: list, required: list) -> dict:
    """
    Overlap-based fit of a candidate against required skills.
    Returns {score, matched, missing}.
    """
    req = [normalize_skill(r) for r in required if r and r.strip()]
    # De-dup, keep order
    seen = set()
    req = [r for r in req if not (r in seen or seen.add(r))]
    if not req:
        return {"score": 0, "matched": [], "missing": []}

    team_set = expand_skills(candidate_skills)
    matched = [r for r in req if r in team_set]
    missing = [r for r in req if r not in team_set]
    score = round(len(matched) / len(req) * 100)
    return {"score": score, "matched": matched, "missing": missing}
