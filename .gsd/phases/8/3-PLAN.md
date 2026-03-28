---
phase: 8
plan: 3
wave: 2
---

# Plan 8.3: Mass PDF Team Uploader

## Objective
Transition the Team capabilities intake flow from manual comma-separated strings to an automated batch PDF processor identifying the aggregated capabilities of an entire engineering team from their raw resumes seamlessly.

## Context
- `backend/api/teams.py`
- `frontend/src/components/dashboard/TeamView.tsx`

## Tasks

<task type="auto">
  <name>Redesign Backend for Multipart/Form-Data Bulk</name>
  <files>backend/api/teams.py</files>
  <action>
    - Modify the `/api/teams/analyze` endpoint. Instead of `TeamAnalysisRequest` (JSON), make the post route accept `resumes: List[UploadFile]`, `market_location: str`, `project_description: str`.
    - Iterate and run `resume_parser.py` logic combining every `parsed_skills` array together into an aggregated master-list.
    - Feed the master-list downward matching the previous Team Analyzer schema exactly!
  </action>
  <verify>grep -q "UploadFile" "backend/api/teams.py"</verify>
  <done>FastAPI successfully ingests dozens of PDFs joining them analytically into an entity graph.</done>
</task>

<task type="auto">
  <name>React Multi-File Drag-and-Drop</name>
  <files>frontend/src/components/dashboard/TeamView.tsx, frontend/src/lib/api.ts</files>
  <action>
    - Alter `analyzeTeam` in `api.ts` to accept and send `FormData` containing the array of `<Input type="file" multiple />`.
    - Inside `TeamView.tsx`, remove `currentSkills` and `teamSize` text-inputs. Replace it with a robust Bulk Upload UI showing the number of queued attachments (resumes).
    - Post the Payload asynchronously matching the new backend schema requirements.
  </action>
  <verify>grep -q "multiple" "frontend/src/components/dashboard/TeamView.tsx"</verify>
  <done>The Team Dash accepts a folder of resumes seamlessly.</done>
</task>

## Success Criteria
- [ ] Batch upload correctly sums the capabilities and maps accurate gap calculations without user-entry of skills!
- [ ] Generates Hire Plans targeting the missing spaces left after analyzing ALL `N` resumes submitted.
