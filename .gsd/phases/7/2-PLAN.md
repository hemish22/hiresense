---
phase: 7
plan: 2
wave: 2
---

# Plan 7.2: Candidate Analysis Pipeline

## Objective
Rebuild the legacy plain JS candidate resume analysis workflow completely inside a reactive Next.js Client Component, utilizing the sophisticated shadcn form controls.

## Context
- `frontend/src/app/dashboard/page.tsx`
- FastAPI backend requires `multipart/form-data` containing `resume` (PDF) and `job_requirements` (string).

## Tasks

<task type="auto">
  <name>Build Candidate Form State</name>
  <files>frontend/src/components/dashboard/CandidateView.tsx</files>
  <action>
    - Establish `CandidateView.tsx`.
    - Create state using React `useState` for the uploaded `File` and the Job Description textarea string.
    - Implement the Fetch call directly hooking into `src/lib/api.ts`.
  </action>
  <verify>test -f "frontend/src/components/dashboard/CandidateView.tsx"</verify>
  <done>Form securely captures PDF objects and posts to backend proxy.</done>
</task>

<task type="auto">
  <name>Build Candidate Result Visualization</name>
  <files>frontend/src/components/dashboard/CandidateView.tsx</files>
  <action>
    - When `data` returns, render the nested JSON.
    - Build a circular/progressBar for `match_score`.
    - Display Cards for `learning_ability`, speed index, and markdown-rendered rationale.
    - List the `skill_gaps` using Shadcn `<Badge>` coloring (red/yellow).
  </action>
  <verify>grep -q "Card" "frontend/src/components/dashboard/CandidateView.tsx"</verify>
  <done>Complete parity with the legacy visualizer mapping the `CandidateResult` schema cleanly.</done>
</task>

## Success Criteria
- [ ] Uploading a resume PDF successfully pushes traffic to FastAPI.
- [ ] The dashboard accurately renders the comprehensive breakdown and prevents rendering crashes dynamically.
