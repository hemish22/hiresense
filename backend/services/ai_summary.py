"""
HireSense AI — Candidate Executive Summary
Generates a short "why hire / why not" verdict from the full evaluation.
Uses Groq (openai/gpt-oss-120b) when available, with a deterministic template fallback.
"""

from backend.services.skill_matcher import _get_groq_client


def _collect_signals(blob: dict) -> dict:
    candidate = blob.get("candidate", {}) or {}
    scoring = blob.get("scoring", {}) or {}
    scores = scoring.get("scores", {}) or {}
    skill_match = scoring.get("skill_match", {}) or {}
    gh = blob.get("github_analysis") or {}
    lc = blob.get("leetcode_analysis") or {}

    return {
        "name": candidate.get("name") or "The candidate",
        "skills": candidate.get("skills", []) or [],
        "match_score": round(scores.get("match_score", scoring.get("overall_score", 0)) or 0),
        "overall": round(scoring.get("overall_score", 0) or 0),
        "learning": round(scores.get("learning_score", 0) or 0),
        "credibility": round(scores.get("credibility_score", 0) or 0),
        "recommendation": scoring.get("recommendation"),
        "missing": skill_match.get("missing_skills", []) or [],
        "matched": skill_match.get("matched_skills", []) or [],
        "github": None if (not gh or gh.get("error") or gh.get("user_not_found")) else gh,
        "leetcode": None if (not lc or lc.get("error") or lc.get("user_not_found")) else lc,
    }


def _template_summary(s: dict) -> str:
    """Deterministic verdict when the LLM is unavailable."""
    verdict = "Strong fit" if s["match_score"] >= 75 else (
        "Promising" if s["match_score"] >= 50 else "Weak fit"
    )
    pros, cons = [], []

    if s["match_score"] >= 70:
        pros.append(f"strong JD match ({s['match_score']}%)")
    elif s["match_score"] < 50:
        cons.append(f"limited JD match ({s['match_score']}%)")
    if s["matched"]:
        pros.append("covers " + ", ".join(s["matched"][:4]))
    if s["missing"]:
        cons.append("missing " + ", ".join(s["missing"][:4]))
    if s["github"]:
        gs = s["github"].get("scores", {})
        if gs.get("overall", 0) >= 65:
            pros.append("solid GitHub footprint")
        if gs.get("recency", 100) < 30:
            cons.append("stale GitHub activity")
    if s["leetcode"]:
        ls = s["leetcode"].get("scores", {})
        if ls.get("problem_solving", 0) >= 65:
            pros.append("strong DSA / problem solving")
    if s["learning"] >= 70:
        pros.append("high learning ability")

    parts = [f"{verdict}: {s['name']} scores {s['overall']}% overall."]
    if pros:
        parts.append("Strengths — " + "; ".join(pros) + ".")
    if cons:
        parts.append("Watch-outs — " + "; ".join(cons) + ".")
    return " ".join(parts)


def generate_ai_summary(blob: dict) -> dict:
    """Return {summary, engine} for a stored candidate analysis blob."""
    s = _collect_signals(blob)

    client = _get_groq_client()
    if client is not None:
        prompt = (
            "You are a senior technical recruiter. In 2-3 sentences, give a sharp "
            "hire verdict for this candidate. Lead with a clear stance (strong fit / "
            "promising / weak fit), then the top strength and the top risk. Be concrete, "
            "no fluff.\n\n"
            f"Name: {s['name']}\n"
            f"Overall score: {s['overall']}%, JD match: {s['match_score']}%, "
            f"learning: {s['learning']}%, credibility: {s['credibility']}%\n"
            f"Matched skills: {', '.join(s['matched'][:8]) or 'n/a'}\n"
            f"Missing skills: {', '.join(s['missing'][:8]) or 'none'}\n"
            f"GitHub: {'yes' if s['github'] else 'not provided'}, "
            f"LeetCode: {'yes' if s['leetcode'] else 'not provided'}\n"
        )
        try:
            resp = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=180,
            )
            text = (resp.choices[0].message.content or "").strip()
            if text:
                return {"summary": text, "engine": "groq"}
        except Exception as e:
            print(f"[ai_summary] Groq failed: {e}")

    return {"summary": _template_summary(s), "engine": "template"}
