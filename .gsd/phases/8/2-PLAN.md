---
phase: 8
plan: 2
wave: 2
---

# Plan 8.2: Candidate Radar Navigation

## Objective
Convert numerical capability mappings produced by Gemini into stunning responsive Radar charts tracking multiple technical attributes symmetrically, making caliber visual and intuitive for recruiters.

## Context
- `frontend/src/components/dashboard/CandidateView.tsx`
- The `category_scores` JSON map dictating (Frontend, Backend, Cloud, AI, etc.).

## Tasks

<task type="auto">
  <name>Install Recharts</name>
  <files>frontend/package.json</files>
  <action>
    - Add `recharts` to the frontend using `npm install recharts`.
  </action>
  <verify>grep -q "recharts" "frontend/package.json"</verify>
  <done>Charts library available for shadcn rendering.</done>
</task>

<task type="auto">
  <name>Build Radar Component Widget</name>
  <files>frontend/src/components/dashboard/CandidateView.tsx</files>
  <action>
    - Ensure `<CandidateView>` handles the returning payload's `category_scores`.
    - Drop in the `<RadarChart>` from recharts mapped dynamically across the keys provided by Gemini (e.g. `System Architecture`, `DevOps`, `Machine Learning`).
    - Place the Graph next to the Executive Summary Card seamlessly.
  </action>
  <verify>grep -q "RadarChart" "frontend/src/components/dashboard/CandidateView.tsx"</verify>
  <done>Interactive UI renders flawlessly drawing the candidate's holistic skill depth.</done>
</task>

## Success Criteria
- [ ] Radar Chart expands gracefully alongside the UI mapping the `0-100` metrics per sub-category perfectly utilizing Tailwind CSS coloring conventions mapping back to the Shadcn primary brand color.
