---
phase: 3
plan: 3
wave: 2
---

# Plan 3.3: Scoring Engine Integration + API Response Update

## Objective
Wire all ML scoring services (skill matcher, learning predictor, inflation detector) into the candidate analysis pipeline and update the API response to include full scoring with an overall composite score. Also update the frontend JavaScript to display the results when available.

## Context
- backend/api/routes/candidates.py — Current pipeline (Phase 2)
- backend/services/skill_matcher.py — Built in Plan 3.1
- backend/services/learning_predictor.py — Built in Plan 3.2
- backend/services/inflation_detector.py — Built in Plan 3.2

## Tasks

<task type="auto">
  <name>Create scoring engine orchestrator and update API</name>
  <files>
    backend/services/scoring_engine.py
    backend/api/routes/candidates.py
    backend/services/__init__.py
  </files>
  <action>
    **backend/services/scoring_engine.py:**
    Create a `ScoringEngine` class that orchestrates all scoring:

    **score(self, parsed_resume: dict, job_description: str, github_data: dict = None, leetcode_data: dict = None) -> dict:**
    1. Run SkillMatcher.match() → match_score + details
    2. Get missing_skills from match result
    3. Run LearningPredictor.predict() → learning_score + predictions
    4. Run InflationDetector.detect() → credibility_score + flags
    5. Compute overall_score as weighted average:
       - match_score: 40%
       - github_overall: 20%
       - leetcode_overall: 15%
       - learning_score: 10%
       - credibility_score: 15%
    6. Generate final recommendation: "Strong Hire" / "Hire" / "Maybe" / "Pass"

    Returns:
    ```python
    {
        "overall_score": float,  # 0-100
        "recommendation": str,   # "Strong Hire" etc.
        "scores": {
            "match_score": float,
            "github_score": float,
            "leetcode_score": float,
            "learning_score": float,
            "credibility_score": float,
        },
        "skill_match": {...},      # full SkillMatcher result
        "learning_analysis": {...}, # full LearningPredictor result
        "credibility_analysis": {...}, # full InflationDetector result
        "explanation": str,        # overall narrative
    }
    ```

    **Recommendation thresholds:**
    - overall >= 80 → "Strong Hire"
    - overall >= 60 → "Hire"
    - overall >= 40 → "Maybe"
    - overall < 40 → "Pass"

    **Update backend/api/routes/candidates.py:**
    After running GitHub/LeetCode analyzers, call `ScoringEngine().score()` and include all ML scoring in the response. Update the CandidateAnalysis DB record with computed scores (match_score, learning_ability_score, credibility_score, overall_score).

    **Update backend/services/__init__.py:**
    Export new services: SkillMatcher, LearningPredictor, InflationDetector, ScoringEngine.

    AVOID:
    - Do NOT change the existing pipeline flow — just add scoring after data fetching
    - Do NOT break backward compatibility — existing fields must still be present
  </action>
  <verify>
    # Upload test resume and verify full scored response
    curl -s -X POST http://localhost:8000/api/candidates/analyze \
      -F "resume=@/tmp/test_resume.pdf" \
      -F "job_description=Full Stack Python Developer with React, Docker, and AWS" \
      -F "github_username=torvalds" \
      -F "leetcode_username=neal_wu" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('scoring',{}), indent=2))"
  </verify>
  <done>
    - ScoringEngine orchestrates all ML scoring
    - API response includes match_score, learning_score, credibility_score, and overall_score
    - Recommendation label generated (Strong Hire/Hire/Maybe/Pass)
    - Database record updated with all computed scores
    - Full pipeline works end-to-end: upload → parse → fetch → score → respond
  </done>
</task>

<task type="auto">
  <name>Update frontend to display analysis results</name>
  <files>
    frontend/js/app.js
    frontend/css/style.css
  </files>
  <action>
    **Update frontend/js/app.js:**
    In the `handleCandidateAnalysis()` function, after receiving the API response:

    1. Hide the empty state and show results container
    2. Render score cards:
       - Overall score (large, centered, color-coded by recommendation)
       - Recommendation badge ("Strong Hire" / "Hire" / "Maybe" / "Pass")
       - Individual score cards: Match, GitHub, LeetCode, Learning, Credibility
    3. Render skill tags: matched (green), missing (amber), flagged (red)
    4. Render explanations as collapsible sections

    Create a `renderCandidateResults(data)` function that builds the HTML:
    ```javascript
    function renderCandidateResults(data) {
        const container = document.getElementById('candidate-results');
        // Build score overview
        // Build skill tags
        // Build explanations
        container.innerHTML = html;
        container.style.display = 'block';
        document.getElementById('candidate-empty-state').style.display = 'none';
    }
    ```

    Score card color rules:
    - Score >= 80 → green (--color-success)
    - Score >= 60 → accent blue (--accent-primary)
    - Score >= 40 → amber (--color-warning)
    - Score < 40 → red (--color-error)

    **Update frontend/css/style.css:**
    Add styles for:
    - `.score-card` — glass card with score number + label
    - `.recommendation-badge` — large badge with recommendation text
    - `.skill-tags-container` — flex wrap for skill tags
    - `.explanation-section` — collapsible with smooth transition

    AVOID:
    - Do NOT add a framework — keep vanilla JS
    - Do NOT add charting libraries — simple HTML/CSS score displays are fine for MVP
  </action>
  <verify>
    # Visual verification in browser - launch server and check results render after analysis
    # Start server: uvicorn backend.main:app --port 8000
    # 1. Open http://localhost:8000
    # 2. Upload test_resume.pdf
    # 3. Enter a job description
    # 4. Click Analyze Candidate
    # 5. Verify results panel shows scores, recommendation, skill tags
  </verify>
  <done>
    - Results panel renders after successful analysis
    - Overall score + recommendation badge visible
    - Individual score cards for each dimension
    - Skill tags color-coded (matched/missing/flagged)
    - Explanations shown for each score
    - Empty state hidden when results are displayed
  </done>
</task>

## Success Criteria
- [ ] Full pipeline: upload → parse → fetch → score → display results
- [ ] Overall score and recommendation computed and shown
- [ ] All 5 score dimensions displayed with color coding
- [ ] Skill tags and explanations rendered in the frontend
- [ ] Database record stores all computed scores
