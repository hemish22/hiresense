---
phase: 7
plan: 3
wave: 2
---

# Plan 7.3: Team Gap Analysis Pipeline

## Objective
Rebuild the engineering workforce planning engine. Form input of a team profile yielding a sophisticated multi-component metric view of capability coverage and structural hire requirements.

## Context
- FastAPI `teams/analyze` endpoint.

## Tasks

<task type="auto">
  <name>Build Team Input Form</name>
  <files>frontend/src/components/dashboard/TeamView.tsx</files>
  <action>
    - Create `TeamView.tsx`.
    - Handle state arrays for adding comma-separated current team skills.
    - Input standard variables: local currency/market, size, and long-term project requirements string.
  </action>
  <verify>test -f "frontend/src/components/dashboard/TeamView.tsx"</verify>
  <done>Form cleanly validates schema limits before POSTing to proxy.</done>
</task>

<task type="auto">
  <name>Build Gap Results & JD Generator UI</name>
  <files>frontend/src/components/dashboard/TeamView.tsx</files>
  <action>
    - Render `coverage_score` as a master progress ring/bar.
    - Loop through `domain_gaps` mapping urgency (HIGH = destructive, MEDIUM = warning) onto Shadcn `<Card>` layouts.
    - Display generated `hire_plan` roles with expected `salary_benchmarks`.
    - Render the `<ScrollArea>` containing the generated precise Markdown JDs.
  </action>
  <verify>grep -q "coverage" "frontend/src/components/dashboard/TeamView.tsx"</verify>
  <done>The extensive team evaluation gracefully fits in standard grid layouts natively on React.</done>
</task>

## Success Criteria
- [ ] Team POST succeeds, generating a robust structural dashboard displaying coverage percentages.
- [ ] Urgency metrics mapped to semantic tailwind tokens (red/yellow/blue).
