# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0 — Hackathon MVP

## Must-Haves (from SPEC)
- [ ] Resume parsing → structured candidate profile
- [ ] GitHub analysis → consistency, depth, breadth, recency scores
- [ ] LeetCode analysis → problem-solving metrics
- [ ] Skill similarity matching (semantic)
- [ ] Learning ability prediction with time estimates
- [ ] Resume inflation detection with credibility flags
- [ ] Internal skill gap analyzer → hire plan + JD generation
- [ ] Salary benchmarking integrated into hire plan
- [ ] Explainable scoring (every output has reasoning)
- [ ] Web dashboard (candidate view + team view)
- [ ] SQLite persistence
- [ ] Fully local deployment

## Phases

### Phase 1: Project Foundation & Backend Skeleton
**Status**: ⬜ Not Started
**Objective**: Set up the FastAPI project structure, SQLite database, configuration, and API scaffolding. Create the frontend shell with navigation between candidate analysis and team analysis views.
**Requirements**: REQ-19, REQ-20, REQ-22
**Deliverable**: Running FastAPI server with health check, SQLite models, and frontend shell with two-view layout.

---

### Phase 2: Resume Parser + GitHub & LeetCode Analyzers
**Status**: ⬜ Not Started
**Objective**: Build the three data ingestion modules — PDF resume parser (structured extraction), GitHub REST API analyzer (4 scores), and LeetCode GraphQL analyzer (difficulty-weighted metrics). Wire them into the API.
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04
**Deliverable**: Upload a resume → extracted profile with GitHub/LeetCode data fetched and scored.

---

### Phase 3: ML Engine — Skill Matching, Learning Prediction & Inflation Detection
**Status**: ⬜ Not Started
**Objective**: Build the core intelligence layer — semantic skill similarity (sentence embeddings), learning ability predictor (transfer graph + speed modifiers), and resume inflation detector (cross-reference claimed vs verified). Every score includes explainability.
**Requirements**: REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10, REQ-18
**Deliverable**: Given a candidate profile + job description → full analysis report with match score, learning estimates, credibility flags, and explanations.

---

### Phase 4: Internal Skill Gap Analyzer + Salary Benchmarking
**Status**: ⬜ Not Started
**Objective**: Build the team-side analysis — accept team skills + project requirements, compute coverage, identify gaps by domain, generate hire plan with urgency, auto-generate JDs, and integrate salary benchmarking from public datasets. Internal data processed via local LLM.
**Requirements**: REQ-11, REQ-12, REQ-13, REQ-14, REQ-15, REQ-16, REQ-17, REQ-21
**Deliverable**: Input team + project → skill coverage, gap clusters, hire plan with salary estimates, and ready-to-post JDs.

---

### Phase 5: Dashboard Polish & Demo Integration
**Status**: ⬜ Not Started
**Objective**: Build the complete frontend dashboard — candidate analysis flow (upload → instant report), team analysis flow (input → hire plan), result persistence, comparison views, and demo-ready polish (animations, responsive layout, error states).
**Requirements**: REQ-19, REQ-20
**Deliverable**: End-to-end working demo: upload resume → see full analysis; input team → see hire plan. Production-quality UI.
