---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: Learning Ability Predictor & Inflation Detector

## Objective
Build two complementary scoring services: (1) Learning Ability Predictor — estimates how quickly a candidate can acquire missing skills based on their existing skill graph and activity patterns, and (2) Resume Inflation Detector — cross-references self-reported resume claims against verified GitHub/LeetCode data to flag exaggerations.

## Context
- .gsd/SPEC.md — REQ-06, REQ-07: Learning ability prediction; REQ-08, REQ-09: Inflation detection
- backend/services/skill_dictionary.py — SKILL_CATEGORIES for skill relationships
- backend/services/github_analyzer.py — GitHub data structure (scores, languages, repos)
- backend/services/leetcode_analyzer.py — LeetCode data structure (problems, scores)

## Tasks

<task type="auto">
  <name>Create learning ability predictor</name>
  <files>
    backend/services/learning_predictor.py
  </files>
  <action>
    Create a `LearningPredictor` class:

    **predict(self, candidate_skills: list[str], missing_skills: list[str], github_data: dict = None, leetcode_data: dict = None) -> dict:**
    Returns:
    ```python
    {
        "learning_score": float,           # 0-100 overall
        "predictions": [                    # per missing skill
            {
                "skill": str,
                "estimated_months": float,  # estimated time to learn
                "confidence": str,          # "high"/"medium"/"low"
                "reason": str,              # why this estimate
                "related_existing": [str],  # existing skills in same category
            }
        ],
        "factors": {
            "skill_breadth_bonus": float,   # 0-20 bonus for diverse skills
            "consistency_bonus": float,     # 0-15 bonus for consistent GH activity
            "problem_solving_bonus": float, # 0-15 bonus for LC score
            "base_score": float,            # 50 baseline
        },
        "explanation": str,
    }
    ```

    **_estimate_learning_time(self, skill: str, existing_skills: list[str]) -> dict:**
    Logic:
    1. Find the category of the target skill using `get_skill_category()`
    2. Count how many skills the candidate already has in that category
    3. More existing skills in the same category → faster learning
       - 0 related skills → 6+ months (low confidence)
       - 1-2 related → 3-4 months (medium)
       - 3+ related → 1-2 months (high)
    4. Cross-category transfer: a person with Python + React who needs Vue = fast

    **_calculate_learning_score(self, predictions: list, factors: dict) -> float:**
    - Base score = 50
    - Add skill_breadth_bonus: breadth_factor = min(20, len(unique_categories) * 4)
    - Add consistency_bonus: if github consistency score > 70 → +15
    - Add problem_solving_bonus: if leetcode_score > 70 → +15
    - Subtract penalty for each skill with > 4 months estimate
    - Clamp to 0-100

    AVOID:
    - Do NOT attempt to use any ML model here — heuristic scoring is appropriate for this signal
    - Do NOT try to predict exact timelines — give ranges and confidence levels
  </action>
  <verify>
    python3 -c "
from backend.services.learning_predictor import LearningPredictor
predictor = LearningPredictor()
result = predictor.predict(
    candidate_skills=['python', 'flask', 'postgresql', 'git'],
    missing_skills=['docker', 'kubernetes', 'react'],
    github_data={'scores': {'consistency': 75, 'tech_breadth': 60}},
    leetcode_data={'scores': {'overall': 80}},
)
print(f'Learning score: {result[\"learning_score\"]}')
for p in result['predictions']:
    print(f'  {p[\"skill\"]}: ~{p[\"estimated_months\"]}mo ({p[\"confidence\"]})')
"
  </verify>
  <done>
    - LearningPredictor class exists and imports without error
    - predict() returns learning score + per-skill estimates with confidence
    - Related skills reduce estimated learning time
    - GitHub consistency and LeetCode scores provide bonuses
  </done>
</task>

<task type="auto">
  <name>Create inflation detector</name>
  <files>
    backend/services/inflation_detector.py
  </files>
  <action>
    Create an `InflationDetector` class:

    **detect(self, resume_skills: list[str], github_data: dict = None, leetcode_data: dict = None) -> dict:**
    Returns:
    ```python
    {
        "credibility_score": float,        # 0-100 (higher = more credible)
        "flags": [                         # individual credibility flags
            {
                "skill": str,
                "status": str,            # "verified" / "unverified" / "inflated"
                "evidence": str,           # why this status
                "source": str,            # "github" / "leetcode" / "none"
            }
        ],
        "summary": {
            "verified_count": int,
            "unverified_count": int,
            "inflated_count": int,
            "total_claimed": int,
        },
        "explanation": str,
    }
    ```

    **_check_github_skills(self, claimed_skills: list[str], github_data: dict) -> list[dict]:**
    For each claimed skill:
    1. Check if a matching language appears in GitHub languages dict
    2. Check repo names/descriptions for framework mentions (optional — can do basic name matching)
    3. If found → "verified" with evidence "Found {bytes} bytes of {language} code across {N} repos"
    4. If language category matches but specific skill not found → "unverified"
    5. If completely absent → check if related to any detected language

    **_check_leetcode_skills(self, claimed_skills: list[str], leetcode_data: dict) -> list[dict]:**
    If claimed "data structures", "algorithms", etc.:
    - Check if total_solved > threshold (>50 → verified)
    - Check difficulty balance for algorithm claims
    
    For language-agnostic claims like "problem solving" → use LC score.

    **_calculate_credibility_score(self, flags: list) -> float:**
    - Start at 100
    - Each "verified" skill: +0 (no change, already at max)
    - Each "unverified" skill: -3 (slight doubt)
    - Each "inflated" skill: -10 (significant penalty)
    - Floor at 0, cap at 100

    **Inflation rules:**
    - Claims "expert in X" but no GitHub evidence → inflated flag
    - Claims more than 5 languages with GitHub only showing 1-2 → warning
    - Claims "Machine Learning" but no Python/ML repos → unverified

    AVOID:
    - Do NOT be overly aggressive — resume skills may be from work experience not on GitHub
    - Do NOT call anything "inflated" without strong evidence — default to "unverified"
    - Keep the detector fair: some skills are hard to verify via GitHub (e.g., "teamwork", "communication")
  </action>
  <verify>
    python3 -c "
from backend.services.inflation_detector import InflationDetector
detector = InflationDetector()
result = detector.detect(
    resume_skills=['python', 'react', 'machine learning', 'kubernetes', 'blockchain'],
    github_data={
        'details': {
            'languages': {'Python': 50000, 'JavaScript': 30000},
            'total_repos': 15,
        },
        'scores': {'tech_breadth': 40},
    },
    leetcode_data={
        'problems': {'total_solved': 100, 'easy': 40, 'medium': 45, 'hard': 15},
    },
)
print(f'Credibility: {result[\"credibility_score\"]}')
for f in result['flags']:
    print(f'  {f[\"skill\"]}: {f[\"status\"]} — {f[\"evidence\"]}')
"
  </verify>
  <done>
    - InflationDetector class exists and imports without error
    - detect() cross-references resume claims against GitHub/LeetCode evidence
    - Each skill gets verified/unverified/inflated status with evidence
    - Credibility score reflects overall claim reliability
    - Not overly aggressive — defaults to "unverified" when uncertain
  </done>
</task>

## Success Criteria
- [ ] Learning predictor estimates time-to-learn per missing skill
- [ ] Inflation detector flags unverified/inflated resume claims
- [ ] Both provide human-readable explanations
- [ ] GitHub languages and LeetCode stats used as evidence sources
