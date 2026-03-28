---
phase: 4
plan: 2
wave: 1
---

# Plan 4.2: Salary Benchmarking + JD Generator

## Objective
Add salary estimation for hire plan roles using a built-in dataset (inspired by Levels.fyi/public data) and build a JD generator that produces ready-to-post job descriptions from the hire plan. Salary estimates turn recommendations into budgetable business cases ("hiring a DevOps engineer will cost ₹18–26 LPA in Bangalore").

## Context
- .gsd/ROADMAP.md — Phase 4: salary benchmarking requirement
- backend/services/team_analyzer.py — Built in Plan 4.1 (hire plan structure)
- backend/services/skill_dictionary.py — Skill categories

## Tasks

<task type="auto">
  <name>Create salary benchmarker</name>
  <files>
    backend/services/salary_benchmarker.py
  </files>
  <action>
    Create a `SalaryBenchmarker` class with a built-in salary dataset.

    **Built-in dataset (dict):**
    Store as a Python dict keyed by (role, experience_band, location):
    ```python
    SALARY_DATA = {
        # (role, experience, location) → (min_lpa, max_lpa, currency)
        # Indian cities (LPA = Lakhs Per Annum)
        ("DevOps Engineer", "junior", "bangalore"):   (8, 15, "INR"),
        ("DevOps Engineer", "mid", "bangalore"):      (15, 26, "INR"),
        ("DevOps Engineer", "senior", "bangalore"):   (26, 45, "INR"),
        ("Frontend Developer", "junior", "bangalore"):(6, 12, "INR"),
        ("Frontend Developer", "mid", "bangalore"):   (12, 22, "INR"),
        ("Frontend Developer", "senior", "bangalore"):(22, 38, "INR"),
        ("Backend Developer", "junior", "bangalore"):  (8, 14, "INR"),
        ("Backend Developer", "mid", "bangalore"):     (14, 25, "INR"),
        ("Backend Developer", "senior", "bangalore"):  (25, 42, "INR"),
        ("Full Stack Developer", "junior", "bangalore"):(8, 15, "INR"),
        ("Full Stack Developer", "mid", "bangalore"):  (15, 28, "INR"),
        ("Full Stack Developer", "senior", "bangalore"):(28, 45, "INR"),
        ("ML/AI Engineer", "junior", "bangalore"):     (10, 18, "INR"),
        ("ML/AI Engineer", "mid", "bangalore"):        (18, 35, "INR"),
        ("ML/AI Engineer", "senior", "bangalore"):     (35, 60, "INR"),
        ("Cloud Engineer", "mid", "bangalore"):        (15, 28, "INR"),
        ("Database Engineer", "mid", "bangalore"):     (12, 22, "INR"),
        ("Mobile Developer", "mid", "bangalore"):      (12, 24, "INR"),
        ("Platform Engineer", "mid", "bangalore"):     (14, 26, "INR"),
        ("Software Engineer", "mid", "bangalore"):     (12, 22, "INR"),
        # ... repeat for "remote_india", "delhi", "hyderabad", "mumbai"
        # US cities (K USD)
        ("DevOps Engineer", "mid", "us_remote"):       (120, 180, "USD"),
        ("Frontend Developer", "mid", "us_remote"):    (100, 160, "USD"),
        ("Backend Developer", "mid", "us_remote"):     (110, 170, "USD"),
        ("Full Stack Developer", "mid", "us_remote"):  (120, 180, "USD"),
        ("ML/AI Engineer", "mid", "us_remote"):        (140, 220, "USD"),
    }
    ```

    Add entries for multiple cities and experience bands. At least 100 entries covering India's major cities + US remote.

    **estimate(self, role: str, location: str = "bangalore", experience: str = "mid") -> dict:**
    Returns:
    ```python
    {
        "role": str,
        "location": str,
        "experience": str,
        "salary_range": {"min": float, "max": float},
        "currency": str,
        "formatted": str,  # "₹15–26 LPA" or "$120–180K"
    }
    ```

    **enrich_hire_plan(self, hire_plan: list[dict], location: str = "bangalore", experience: str = "mid") -> list[dict]:**
    For each role in the hire plan, add salary estimate.
    Also compute total_budget_impact: sum of max salaries across all hires.

    AVOID:
    - Do NOT call external APIs — use built-in dataset (the user wants local-first)
    - Do NOT over-engineer — a dict-based lookup with fuzzy matching is sufficient
  </action>
  <verify>
    python3 -c "
from backend.services.salary_benchmarker import SalaryBenchmarker
bench = SalaryBenchmarker()
est = bench.estimate('DevOps Engineer', location='bangalore', experience='mid')
print(f'{est[\"role\"]}: {est[\"formatted\"]}')
est2 = bench.estimate('ML/AI Engineer', location='us_remote', experience='mid')
print(f'{est2[\"role\"]}: {est2[\"formatted\"]}')
"
  </verify>
  <done>
    - SalaryBenchmarker class imports and returns salary ranges
    - Covers at least 5 Indian cities + US remote
    - formatted field shows human-readable salary (₹X–Y LPA or $X–YK)
    - enrich_hire_plan adds salary data to each hire recommendation
  </done>
</task>

<task type="auto">
  <name>Create JD generator</name>
  <files>
    backend/services/jd_generator.py
  </files>
  <action>
    Create a `JDGenerator` class that generates ready-to-post job descriptions from hire plan entries.

    **generate(self, role: str, skills: list[str], team_name: str = "", salary_range: dict = None) -> dict:**
    Returns:
    ```python
    {
        "title": str,            # role title
        "description": str,      # full JD text (markdown formatted)
        "sections": {
            "about": str,
            "responsibilities": [str],
            "requirements": [str],
            "nice_to_have": [str],
            "compensation": str,
        }
    }
    ```

    Use a template-based approach:
    1. Map role name to a title + about section template
    2. Generate responsibilities from skill list (e.g., "Design and maintain CI/CD pipelines" for docker/kubernetes skills)
    3. Generate requirements from skill list + standard role expectations
    4. Add nice-to-have from related skills in the same category
    5. Add compensation section if salary_range provided

    Have a `RESPONSIBILITY_TEMPLATES` dict mapping skills to responsibility bullet points.
    Have a `REQUIREMENT_TEMPLATES` dict mapping skills to requirement bullet points.

    **generate_all(self, hire_plan: list[dict], team_name: str = "") -> list[dict]:**
    Generate JDs for all roles in the hire plan.

    AVOID:
    - Do NOT use LLM for this — template-based is fine for V1
    - Do NOT generate generic JDs — make them specific to the skills needed
  </action>
  <verify>
    python3 -c "
from backend.services.jd_generator import JDGenerator
gen = JDGenerator()
jd = gen.generate(
    role='DevOps Engineer',
    skills=['docker', 'kubernetes', 'terraform', 'ci/cd'],
    team_name='Engineering Alpha',
    salary_range={'min': 15, 'max': 26, 'currency': 'INR'},
)
print(f'Title: {jd[\"title\"]}')
print(jd['description'][:500])
"
  </verify>
  <done>
    - JDGenerator class creates role-specific job descriptions
    - Responsibilities and requirements match the gap skills
    - Compensation section included when salary data available
    - Descriptions are formatted in markdown (ready to post)
  </done>
</task>

## Success Criteria
- [ ] Salary estimates available for all hire plan roles
- [ ] Budget impact computed for the full hire plan
- [ ] JDs generated with skill-specific responsibilities/requirements
- [ ] Human-readable formatting for salary and JDs
