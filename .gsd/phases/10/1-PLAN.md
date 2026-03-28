---
phase: 10
plan: 1
wave: 1
---

# Plan 10.1: Team Gap Analysis UI Overhaul & Data Mapping Fix

## Objective
The Team Gap Analysis pipeline currently suffers from two distinct problems:
1. **Data Mapping Bug**: The frontend expects `role_title`, `salary_benchmark`, and `job_description` directly inside the `hire_plan` array. However, the FastApi backend returns `"role"`, `"salary": {...}`, and places the JDs into a completely separate `job_descriptions` array. This causes "undefined" or empty states on the UI for Salaries and JDs.
2. **Aesthetic Debt**: The team gap dashboard feels visually sparse and lacks the premium Shadcn/vibrant aesthetic recently successfully applied to the Candidate Evaluation dashboard. 

## Context
- .gsd/ROADMAP.md
- frontend/src/components/dashboard/TeamView.tsx
- backend/api/routes/teams.py

## Tasks

<task type="auto">
  <name>Fix Frontend Data Mapping in TeamView.tsx</name>
  <files>frontend/src/components/dashboard/TeamView.tsx</files>
  <action>
    - Update `{role.role_title}` to `{role.role}` mapping the API correctly.
    - Update `{role.salary_benchmark}` to `{role.salary?.formatted}` or fallback.
    - Fetch the job description from the companion array `{result.job_descriptions?.[i]?.description || "Generating JD..."}`.
  </action>
  <verify>Ensure the mock or test API payload successfully displays JD snippet and Salary on the UI.</verify>
  <done>Frontend data binding reflects the `teams.py` response structure.</done>
</task>

<task type="auto">
  <name>Redesign Hiring Plan and Coverge UI</name>
  <files>frontend/src/components/dashboard/TeamView.tsx</files>
  <action>
    - Enhance the "Generated Hiring Plan" cards. Use premium styling (soft colors, CardFooter with copy-clipboard buttons).
    - Enhance the "Architectural coverage" ring and Domain Deficits list with clear Shadcn aesthetic markers (distinct borders, better spacing, and dynamic badges for Urgency).
  </action>
  <verify>Visually verify the new UI components render cleanly on the localhost NextJS server.</verify>
  <done>Team Gap side visually aligns with the pristine quality of the Candidate Evaluator.</done>
</task>

## Success Criteria
- [ ] Role titles, Salary, and JD Snippets are no longer missing/undefined.
- [ ] Team Gap Analysis UI matches premium styling guidelines.
