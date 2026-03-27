---
phase: 2
plan: 3
wave: 2
---

# Plan 2.3: LeetCode Analyzer + Full Pipeline Wiring

## Objective
Build the LeetCode analyzer using the GraphQL endpoint, then wire all three services (resume parser, GitHub analyzer, LeetCode analyzer) into the candidate analysis API endpoint to produce a complete candidate profile with all external data fetched and scored.

## Context
- .gsd/SPEC.md — REQ-04: Fetch LeetCode data via GraphQL
- .gsd/phases/2/RESEARCH.md — LeetCode GraphQL queries
- backend/services/resume_parser.py — Built in Plan 2.1
- backend/services/github_analyzer.py — Built in Plan 2.2
- backend/api/routes/candidates.py — Endpoint to update

## Tasks

<task type="auto">
  <name>Create LeetCode analyzer service</name>
  <files>
    backend/services/leetcode_analyzer.py
  </files>
  <action>
    Create a `LeetCodeAnalyzer` class:

    **analyze(self, username: str) -> dict:**
    Main entry point. Returns:
    ```python
    {
        "username": str,
        "profile": {
            "ranking": int,
            "reputation": int,
        },
        "problems": {
            "total_solved": int,
            "easy": int,
            "medium": int,
            "hard": int,
        },
        "scores": {
            "problem_solving": float,   # 0-100
            "difficulty_balance": float, # 0-100
            "overall": float,           # weighted average
        },
        "details": {
            "easy_percentage": float,
            "medium_percentage": float,
            "hard_percentage": float,
            "streak": int,
            "total_active_days": int,
        },
        "explanations": {
            "problem_solving": str,
            "difficulty_balance": str,
        }
    }
    ```

    **_fetch_user_data(self, username: str) -> dict:**
    POST to https://leetcode.com/graphql with query:
    ```graphql
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            profile {
                ranking
                reputation
            }
            userCalendar {
                streak
                totalActiveDays
            }
        }
    }
    ```
    Headers: Content-Type: application/json, Referer: https://leetcode.com
    Handle user not found (matchedUser returns null).

    **_calculate_problem_solving_score(self, problems: dict) -> tuple[float, str]:**
    Weighted score:
    - easy: 1 point each
    - medium: 3 points each
    - hard: 5 points each
    Normalize: 0-50 weighted points → 0-40 score, 50-200 → 40-80, 200+ → 80-100.
    Return (score, explanation).

    **_calculate_difficulty_balance_score(self, problems: dict) -> tuple[float, str]:**
    Ideal ratio is roughly 40% easy, 40% medium, 20% hard.
    - Pure easy → 20
    - Good mix → 70-90
    - Heavy on hard → 90-100
    Return (score, explanation).

    **Error handling:**
    - User not found → return error dict with "user_not_found": True
    - GraphQL error → return partial results with warning

    AVOID:
    - Do NOT scrape HTML — use only the GraphQL endpoint
    - Do NOT try to get submission details — just counts by difficulty
  </action>
  <verify>
    python3 -c "
from backend.services.leetcode_analyzer import LeetCodeAnalyzer
analyzer = LeetCodeAnalyzer()
print('LeetCodeAnalyzer imported OK')
result = analyzer.analyze('neal_wu')
print(f'Problems solved: {result[\"problems\"][\"total_solved\"]}')
print(f'Scores: {result[\"scores\"]}')
"
  </verify>
  <done>
    - LeetCodeAnalyzer class exists and imports without error
    - analyze() hits the GraphQL endpoint and returns problem stats
    - Two scores computed: problem_solving, difficulty_balance
    - Each score has explanation
    - Handles user not found gracefully
  </done>
</task>

<task type="auto">
  <name>Wire full pipeline into candidate analysis endpoint</name>
  <files>
    backend/api/routes/candidates.py
    backend/services/__init__.py
  </files>
  <action>
    **Update backend/api/routes/candidates.py:**
    Modify POST /candidates/analyze to run the full pipeline:

    1. Accept `resume: UploadFile` and `job_description: str = Form(...)`
    2. Save PDF, run ResumeParser
    3. If GitHub username found → run GitHubAnalyzer
    4. If LeetCode username found → run LeetCodeAnalyzer
    5. If usernames NOT found in resume, accept optional form fields:
       - `github_username: Optional[str] = Form(None)`
       - `leetcode_username: Optional[str] = Form(None)`
    6. Assemble complete candidate profile
    7. Save to database (CandidateAnalysis record)
    8. Return full result

    Response structure:
    ```json
    {
        "id": 1,
        "status": "analyzed",
        "candidate": {
            "name": "John Doe",
            "email": "john@email.com",
            "skills": ["python", "react", "docker"],
            "github_username": "johndoe",
            "leetcode_username": "johndoe"
        },
        "github_analysis": {
            "scores": { ... },
            "details": { ... },
            "explanations": { ... }
        },
        "leetcode_analysis": {
            "problems": { ... },
            "scores": { ... },
            "explanations": { ... }
        },
        "job_description": "...",
        "message": "Candidate profile analyzed. ML scoring available in Phase 3."
    }
    ```

    **Update backend/services/__init__.py:**
    Export all three services for easy importing.

    AVOID:
    - Do NOT run GitHub/LeetCode analysis synchronously if it takes too long — but for MVP, synchronous is fine since it's only 2 API calls
    - Do NOT compute match score, learning ability, or credibility — that's Phase 3
  </action>
  <verify>
    # Test with a real resume PDF
    curl -X POST http://localhost:8000/api/candidates/analyze \
      -F "resume=@test_resume.pdf" \
      -F "job_description=Looking for a Python developer with React experience" \
      -F "github_username=torvalds" \
      -F "leetcode_username=neal_wu" | python3 -m json.tool
  </verify>
  <done>
    - POST /api/candidates/analyze runs full pipeline
    - Response includes parsed resume + GitHub scores + LeetCode scores
    - Record saved to database with all available data
    - Optional github/leetcode username override works
    - Missing usernames handled gracefully (partial results returned)
  </done>
</task>

## Success Criteria
- [ ] LeetCode analyzer fetches real data from GraphQL endpoint
- [ ] Problem-solving and difficulty scores computed with explanations
- [ ] Full pipeline: upload PDF → parse → fetch GitHub → fetch LeetCode → return combined result
- [ ] Database record created with all analysis data
- [ ] Works end-to-end with real GitHub/LeetCode usernames
