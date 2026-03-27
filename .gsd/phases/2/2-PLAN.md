---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: GitHub Analyzer Service

## Objective
Build the GitHub analyzer that fetches developer activity data via the REST API and computes four scores: consistency, project depth, tech breadth, and recency. These scores become key signals in the candidate analysis pipeline.

## Context
- .gsd/SPEC.md — REQ-02, REQ-03: Fetch GitHub data and compute scores
- .gsd/phases/2/RESEARCH.md — GitHub REST API endpoints and auth pattern
- backend/config.py — GITHUB_TOKEN setting

## Tasks

<task type="auto">
  <name>Create GitHub analyzer service</name>
  <files>
    backend/services/github_analyzer.py
  </files>
  <action>
    Create a `GitHubAnalyzer` class:

    **__init__(self, token: str = None):**
    - Store token for auth header
    - Set base_url = "https://api.github.com"
    - Set headers with Accept: application/vnd.github.v3+json

    **analyze(self, username: str) -> dict:**
    Main entry point. Returns:
    ```python
    {
        "username": str,
        "profile": {
            "name": str,
            "bio": str,
            "public_repos": int,
            "followers": int,
            "following": int,
            "created_at": str,
        },
        "scores": {
            "consistency": float,     # 0-100
            "project_depth": float,   # 0-100
            "tech_breadth": float,    # 0-100
            "recency": float,         # 0-100
            "overall": float,         # weighted average
        },
        "details": {
            "total_repos": int,
            "total_stars": int,
            "total_commits_sampled": int,
            "languages": {str: int},    # language -> bytes
            "top_repos": [dict],         # top 5 repos by stars
            "commit_frequency": dict,    # monthly commit counts
            "active_days": int,          # days with commits in last year
        },
        "explanations": {
            "consistency": str,
            "project_depth": str,
            "tech_breadth": str,
            "recency": str,
        }
    }
    ```

    **_fetch_profile(self, username: str) -> dict:**
    GET /users/{username} — extract key fields.
    Handle 404 (user not found) gracefully.

    **_fetch_repos(self, username: str) -> list:**
    GET /users/{username}/repos?per_page=100&sort=pushed
    For each repo, capture: name, stars, forks, language, updated_at, fork (bool).
    Filter out forks (only count original repos).

    **_fetch_languages(self, username: str, repos: list) -> dict:**
    For top 10 repos (by stars), GET /repos/{username}/{repo}/languages.
    Aggregate bytes per language across all repos.

    **_fetch_commit_activity(self, username: str, repos: list) -> dict:**
    For top 5 repos, GET /repos/{username}/{repo}/commits?per_page=100.
    Extract commit dates, bucket by month.
    Count unique days with commits.

    **_calculate_consistency_score(self, commit_data: dict) -> tuple[float, str]:**
    Measure how evenly distributed commits are across months.
    - Calculate coefficient of variation of monthly commit counts
    - Low CV = high consistency → score 80-100
    - High CV = irregular bursts → score 20-60
    - No commits → score 0
    Return (score, explanation_string).

    **_calculate_project_depth_score(self, repos: list) -> tuple[float, str]:**
    Based on total stars, watchers, and commit count of top repos.
    - Weight: stars * 3 + forks * 2 + (commits > 50 bonus)
    - Normalize to 0-100 scale
    Return (score, explanation_string).

    **_calculate_tech_breadth_score(self, languages: dict) -> tuple[float, str]:**
    Count distinct languages used.
    - 1-2 languages → 20-40
    - 3-5 languages → 50-70
    - 6+ languages → 80-100
    Bonus for diversity across paradigms (e.g., Python + JS + Go).
    Return (score, explanation_string).

    **_calculate_recency_score(self, repos: list, commit_data: dict) -> tuple[float, str]:**
    Based on most recent commit/push date.
    - Within last week → 100
    - Within last month → 85
    - Within last 3 months → 65
    - Within last year → 40
    - Older → 10
    Return (score, explanation_string).

    **Error handling:**
    - If username not found → return error dict with "user_not_found": True
    - If rate limited → return partial results with "rate_limited": True warning
    - If no token → still works but with lower rate limit, add warning

    AVOID:
    - Do NOT fetch ALL commits for ALL repos — too slow. Sample top 5 repos, 100 commits each.
    - Do NOT use GraphQL API — stick to REST for simplicity and our research findings.
    - Do NOT cache results — keep stateless for MVP.
  </action>
  <verify>
    python3 -c "
from backend.services.github_analyzer import GitHubAnalyzer
analyzer = GitHubAnalyzer()
print('GitHubAnalyzer imported OK')
# Quick test with a known public user
result = analyzer.analyze('torvalds')
print(f'Profile: {result[\"profile\"][\"name\"]}')
print(f'Scores: {result[\"scores\"]}')
"
  </verify>
  <done>
    - GitHubAnalyzer class exists and imports without error
    - analyze() returns profile, 4 scores (0-100), details, and explanations
    - Handles user not found gracefully
    - Works without token (with rate limit warning)
    - Top repos, languages, and commit data extracted correctly
  </done>
</task>

## Success Criteria
- [ ] GitHub analyzer fetches real data from GitHub API
- [ ] Four scores computed: consistency, project depth, tech breadth, recency
- [ ] Each score has a human-readable explanation
- [ ] Error handling for missing users and rate limits
