# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Project**: HireSense AI — Intelligent Hiring & Workforce Planning System

## Vision

HireSense AI replaces resume-based hiring with a multi-signal intelligence system that evaluates real coding behavior, verified technical activity, learning ability, and team-level skill gaps. It transforms hiring from guesswork into data-driven decision making — purpose-built for early-stage startups that lack dedicated HR teams.

## Goals

1. **Multi-Signal Candidate Analysis** — Fuse resume data with GitHub activity, LeetCode performance, and skill similarity to produce a holistic candidate score with full explainability.
2. **Learning Ability Prediction** — Predict how fast a candidate can acquire missing skills using a transfer graph and behavioral modifiers (GitHub consistency, problem-solving depth, recency).
3. **Resume Authenticity Detection** — Cross-reference claimed skills against verified external signals to flag inflation and inconsistencies.
4. **Internal Skill Gap Analysis** — Analyze existing team skills against project requirements to identify gaps, generate hire plans with urgency levels, and auto-generate job descriptions.
5. **Actionable Hiring Intelligence** — Produce explainable reports with salary benchmarks, turning recommendations into business cases a CTO can act on.

## Non-Goals (Out of Scope for v1.0)

- Candidate Trajectory Score (growth trend analysis over time)
- Team Culture Fit Heuristic (behavioral inference from GitHub)
- AI Interviewer (custom question generation)
- User authentication / multi-tenant access control
- Cloud deployment / CI/CD pipeline
- Mobile application
- Integration with ATS (Applicant Tracking Systems)

## Users

- **Primary**: Technical founders, CTOs, and small hiring teams at early-stage startups
- **Workflow**: Upload a resume + paste a job description → get instant analysis with match score, learning ability, credibility, and explanations
- **Team mode**: Input team skills + project requirements → get coverage analysis, skill gaps, hire plan, and auto-generated JDs

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Backend | **FastAPI** (Python) | Fast async API, Python ML ecosystem |
| Frontend | **Plain HTML/CSS/JS** | Lightweight, hackathon-friendly, no build step |
| Database | **SQLite** | Zero-config, local-first, sufficient for demo |
| ML/NLP | **sentence-transformers**, scikit-learn, spaCy | Semantic similarity, feature engineering |
| Resume Parsing | **pdfplumber** + spaCy + regex | Structured extraction from PDFs |
| GitHub Data | **GitHub REST API** (with PAT) | Rich developer activity signals |
| LeetCode Data | **GraphQL endpoint** | Problem-solving metrics |
| Salary Data | **Public datasets** (Levels.fyi, GitHub Jobs archive) | Market salary estimation |
| Internal Team AI | **Local LLM** (LM Studio / Ollama) | Confidentiality for company data |

## Constraints

- **Local-only deployment** — must run entirely on localhost for hackathon demo
- **No paid API dependencies** — all data sources must be free/public
- **Hackathon timeline** — production-quality code but MVP scope
- **Confidentiality** — internal team data processed by local AI only, never sent to external APIs

## Success Criteria

- [ ] Upload a resume PDF → get structured candidate profile with scores in < 30 seconds
- [ ] Match score accurately reflects skill overlap with job description (semantic, not keyword)
- [ ] Learning ability prediction produces actionable time estimates per missing skill
- [ ] Resume inflation detector flags at least 3 categories of inconsistency
- [ ] Internal skill gap analyzer produces hire plan with budget estimates
- [ ] Every score includes human-readable explanation (no black boxes)
- [ ] Full end-to-end demo runs locally without external service dependencies (except GitHub/LeetCode APIs)
