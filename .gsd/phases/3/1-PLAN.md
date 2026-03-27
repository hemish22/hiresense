---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Skill Similarity Matcher

## Objective
Build the semantic skill matcher that computes how well a candidate's skills (from resume + GitHub languages) match the requirements in a job description. Uses sentence-transformers embeddings for semantic similarity rather than naive keyword overlap, so "React" matches "frontend development" and "PostgreSQL" matches "relational databases".

## Context
- .gsd/SPEC.md — REQ-05: Skill similarity matching using sentence embeddings
- backend/services/skill_dictionary.py — Skill categories and matching
- backend/services/resume_parser.py — How skills are extracted
- backend/services/github_analyzer.py — GitHub languages output

## Tasks

<task type="auto">
  <name>Create skill matcher service</name>
  <files>
    backend/services/skill_matcher.py
  </files>
  <action>
    Create a `SkillMatcher` class:

    **__init__(self):**
    - Load a lightweight sentence-transformers model: `all-MiniLM-L6-v2` (fast, 22M params)
    - Cache the model as a class attribute to avoid reloading on every call
    - Lazy-load: only initialize model on first use

    **match(self, candidate_skills: list[str], job_description: str, github_languages: dict = None) -> dict:**
    Main entry point. Returns:
    ```python
    {
        "match_score": float,           # 0-100 overall match
        "matched_skills": [str],         # skills that match JD
        "missing_skills": [str],         # JD requirements not in candidate skills
        "bonus_skills": [str],           # candidate skills beyond JD requirements
        "category_scores": {             # score per category
            "languages": float,
            "frontend": float,
            "backend": float,
            ...
        },
        "explanation": str,              # human-readable summary
        "details": {
            "jd_requirements": [str],    # skills extracted from JD
            "semantic_matches": [        # detailed match pairs
                {"candidate_skill": str, "jd_requirement": str, "similarity": float}
            ],
        }
    }
    ```

    **_extract_jd_skills(self, job_description: str) -> list[str]:**
    1. Use `find_skills_in_text()` from skill_dictionary for explicit skill mentions
    2. Also extract key phrases that might be implicit skill requirements
       (e.g., "building scalable systems" → infrastructure/devops)

    **_compute_semantic_similarity(self, skills_a: list[str], skills_b: list[str]) -> list[dict]:**
    1. Encode both lists with sentence-transformers
    2. Compute cosine similarity matrix
    3. For each JD skill, find best matching candidate skill
    4. Threshold: similarity >= 0.5 counts as a match
    5. Return list of {candidate_skill, jd_requirement, similarity}

    **_merge_skills(self, resume_skills: list[str], github_languages: dict) -> list[str]:**
    Combine resume skills with GitHub language names (lowercased).
    Deduplicate using `normalize_skill()`.

    **_calculate_match_score(self, matched: list, total_required: int) -> float:**
    Score = (matched_count / total_required) * 100 with diminishing returns.
    Cap at 100.

    **_generate_explanation(self, score: float, matched: list, missing: list, bonus: list) -> str:**
    Human-readable summary, e.g.:
    "Strong match (82/100). Candidate covers 8/10 required skills.
     Missing: Kubernetes, Terraform. Bonus skills: Machine Learning, PyTorch."

    AVOID:
    - Do NOT use a large model — MiniLM-L6-v2 is sufficient and fast
    - Do NOT run the model on GPU — CPU is fine for small skill lists
    - Do NOT cache embeddings persistently — in-memory per request is fine for MVP
  </action>
  <verify>
    python3 -c "
from backend.services.skill_matcher import SkillMatcher
matcher = SkillMatcher()
result = matcher.match(
    candidate_skills=['python', 'react', 'docker', 'aws', 'postgresql'],
    job_description='Looking for a Full Stack Developer with Python, React, Node.js, PostgreSQL, and Kubernetes experience',
)
print(f'Match score: {result[\"match_score\"]}')
print(f'Matched: {result[\"matched_skills\"]}')
print(f'Missing: {result[\"missing_skills\"]}')
print(f'Explanation: {result[\"explanation\"]}')
"
  </verify>
  <done>
    - SkillMatcher class exists and imports without error
    - match() returns score, matched/missing/bonus skills, and explanation
    - Semantic matching works (React ≈ frontend, PostgreSQL ≈ databases)
    - Score is 0-100 and reflects actual skill overlap
  </done>
</task>

## Success Criteria
- [ ] Sentence-transformers model loads and encodes skills
- [ ] Semantic similarity detects related but not identical skills
- [ ] Match score reflects real skill overlap (not just keyword matching)
- [ ] Human-readable explanation generated for every match
