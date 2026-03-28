---
phase: 4
plan: 3
wave: 2
---

# Plan 4.3: API Wiring + Frontend Team Results

## Objective
Wire the team analyzer, salary benchmarker, and JD generator into the team analysis API endpoint. Update the frontend to display team analysis results — coverage score, gap clusters, hire plan with salary estimates, and generated JDs.

## Context
- backend/api/routes/teams.py — Current placeholder endpoint
- backend/services/team_analyzer.py — Built in Plan 4.1
- backend/services/salary_benchmarker.py — Built in Plan 4.2
- backend/services/jd_generator.py — Built in Plan 4.2
- frontend/js/app.js — handleTeamAnalysis is a placeholder
- frontend/css/style.css — Needs team-specific result styles

## Tasks

<task type="auto">
  <name>Wire team services into API endpoint</name>
  <files>
    backend/api/routes/teams.py
    backend/services/__init__.py
  </files>
  <action>
    **Update POST /api/teams/analyze:**
    Accept JSON body:
    ```python
    {
        "team_name": str,
        "team_skills": [str],           # comma-separated → list
        "project_requirements": [str],  # comma-separated → list
        "location": str = "bangalore",  # optional, for salary lookup
        "experience": str = "mid",      # optional
    }
    ```

    Pipeline:
    1. Run TeamAnalyzer.analyze(team_skills, project_requirements, team_name)
    2. Run SalaryBenchmarker.enrich_hire_plan(hire_plan, location, experience)
    3. Run JDGenerator.generate_all(enriched_hire_plan, team_name)
    4. Assemble full result with coverage, gaps, hire plan, salaries, JDs
    5. Save to TeamAnalysis DB record (coverage_score, skill_gaps, hire_plan, analysis_result)
    6. Return JSON response

    **Update services/__init__.py:**
    Export TeamAnalyzer, SalaryBenchmarker, JDGenerator.

    AVOID:
    - Do NOT change the existing history/detail endpoints — they already work
  </action>
  <verify>
    curl -s -X POST http://localhost:8000/api/teams/analyze \
      -H "Content-Type: application/json" \
      -d '{"team_name": "Engineering Alpha", "team_skills": ["python", "react", "postgresql"], "project_requirements": ["python", "react", "docker", "kubernetes", "terraform", "redis"]}' \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Coverage: {d[\"coverage_score\"]}'); print(f'Hire plan: {len(d[\"hire_plan\"])} roles')"
  </verify>
  <done>
    - Team analysis endpoint accepts skills + requirements
    - Returns coverage score, gap clusters, hire plan, salary estimates, JDs
    - Database record saved with all results
  </done>
</task>

<task type="auto">
  <name>Update frontend for team results</name>
  <files>
    frontend/js/app.js
    frontend/css/style.css
  </files>
  <action>
    **Update handleTeamAnalysis() in app.js:**
    After receiving API response, call `renderTeamResults(data)`.

    **Create renderTeamResults(data) function:**
    1. Coverage score hero (reuse score-ring pattern from candidate results)
    2. Gap clusters section — cards grouped by domain, color-coded by urgency
    3. Hire plan table — role, priority, skills covered, salary range
    4. Budget impact summary — total estimated cost for all hires
    5. JDs section — collapsible cards with full JD text for each role

    **Add CSS styles:**
    - `.gap-cluster-card` — urgency-colored border (critical=red, high=amber, medium=blue, low=gray)
    - `.hire-plan-table` — dark table with subtle borders
    - `.budget-summary` — prominent total budget display
    - `.jd-card` — expandable card for job descriptions
    - `.jd-toggle` — click-to-expand button

    AVOID:
    - Do NOT add frameworks — keep vanilla JS
    - Do NOT duplicate the candidate results pattern excessively — team results have a different data shape
  </action>
  <verify>
    # Start server and verify in browser:
    # 1. Open http://localhost:8000
    # 2. Switch to "Team Analysis" tab
    # 3. Enter team name, skills, and requirements
    # 4. Click "Analyze Team Gaps"
    # 5. Verify results show coverage, gaps, hire plan, salary, JDs
  </verify>
  <done>
    - Team results panel renders after analysis
    - Coverage score displayed with ring visualization
    - Gap clusters shown with urgency color coding
    - Hire plan displayed with salary estimates
    - JDs expandable for each role
    - Budget impact summary visible
  </done>
</task>

## Success Criteria
- [ ] Full pipeline: team skills → gaps → hire plan → salary → JDs → display
- [ ] API returns complete team analysis with all sections
- [ ] Frontend renders all team-specific result components
- [ ] Database stores team analysis for history recall
