w---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Team Skill Gap Analyzer

## Objective
Build the core team analysis service that accepts team skills and project requirements, computes coverage score, identifies skill gaps clustered by domain, and generates a prioritized hire plan with urgency levels. This is the analytical backbone of Phase 4.

## Context
- .gsd/ROADMAP.md — Phase 4 description
- backend/models/team.py — TeamAnalysis model (coverage_score, skill_gaps, hire_plan columns)
- backend/services/skill_dictionary.py — SKILL_CATEGORIES, get_skill_category for domain clustering
- backend/services/skill_matcher.py — SkillMatcher for semantic matching (reusable pattern)

## Tasks

<task type="auto">
  <name>Create team gap analyzer service</name>
  <files>
    backend/services/team_analyzer.py
  </files>
  <action>
    Create a `TeamAnalyzer` class:

    **analyze(self, team_skills: list[str], project_requirements: list[str], team_name: str = "") -> dict:**
    Main entry point. Returns:
    ```python
    {
        "coverage_score": float,           # 0-100 how well team covers requirements
        "gap_summary": {
            "total_required": int,
            "covered": int,
            "gaps": int,
        },
        "covered_skills": [str],            # requirements the team already has
        "gap_clusters": [                   # gaps grouped by domain
            {
                "domain": str,              # e.g. "devops", "frontend"
                "skills": [str],            # missing skills in this domain
                "urgency": str,             # "critical" / "high" / "medium" / "low"
                "reason": str,              # why this urgency
            }
        ],
        "hire_plan": [                      # recommended hires
            {
                "role": str,                # e.g. "DevOps Engineer"
                "priority": int,            # 1 = most urgent
                "skills_covered": [str],    # which gaps this hire fills
                "justification": str,       # why this hire
            }
        ],
        "explanation": str,
    }
    ```

    **_compute_coverage(self, team: list[str], required: list[str]) -> tuple[list, list]:**
    1. Use `find_skills_in_text` to normalize both lists
    2. For each requirement, check if the team has it (exact or category match)
    3. Return (covered_list, gap_list)

    **_cluster_gaps(self, gaps: list[str]) -> list[dict]:**
    1. Group gaps by `get_skill_category(skill)` from skill_dictionary
    2. For each cluster, determine urgency:
       - 3+ gaps in one domain → "critical"
       - 2 gaps → "high"
       - 1 gap → "medium"
       - Bonus: if domain is "devops" or "security" → bump urgency one level

    **_generate_hire_plan(self, clusters: list[dict]) -> list[dict]:**
    1. Sort clusters by urgency (critical first)
    2. Map each cluster to a suggested role title:
       - "devops" gaps → "DevOps Engineer"
       - "frontend" gaps → "Frontend Developer"
       - "backend" gaps → "Backend Developer"
       - "databases" gaps → "Database Engineer"
       - "ml_ai" gaps → "ML/AI Engineer"
       - "mobile" gaps → "Mobile Developer"
       - "tools" gaps → "Platform Engineer"
       - "languages" gaps → "Software Engineer"
       - "cloud" gaps → "Cloud Engineer"
       - Multiple domains → "Full Stack Developer"
    3. Assign priority 1, 2, 3... by urgency order
    4. Generate justification for each hire

    AVOID:
    - Do NOT use LLM for this step — pure algorithmic gap analysis
    - Do NOT try to merge roles aggressively — keep it clear for the CTO
  </action>
  <verify>
    python3 -c "
from backend.services.team_analyzer import TeamAnalyzer
analyzer = TeamAnalyzer()
result = analyzer.analyze(
    team_skills=['python', 'react', 'postgresql', 'git'],
    project_requirements=['python', 'react', 'docker', 'kubernetes', 'terraform', 'redis', 'graphql', 'ci/cd'],
    team_name='Engineering Alpha',
)
print(f'Coverage: {result[\"coverage_score\"]}%')
print(f'Covered: {result[\"covered_skills\"]}')
print(f'Gaps: {result[\"gap_summary\"][\"gaps\"]}')
for c in result['gap_clusters']:
    print(f'  {c[\"domain\"]}: {c[\"skills\"]} ({c[\"urgency\"]})')
for h in result['hire_plan']:
    print(f'  #{h[\"priority\"]} {h[\"role\"]}: {h[\"skills_covered\"]}')
"
  </verify>
  <done>
    - TeamAnalyzer class imports and runs without error
    - Coverage score reflects actual skill overlap
    - Gaps clustered by domain with urgency levels
    - Hire plan generated with roles and priorities
  </done>
</task>

## Success Criteria
- [ ] Team gap analysis produces coverage score, gap clusters, and hire plan
- [ ] Urgency levels assigned logically (more gaps = higher urgency)
- [ ] Human-readable explanations for every recommendation
