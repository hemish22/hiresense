---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: SQLite Database Models & Initialization

## Objective
Define the SQLAlchemy models for persisting candidate analyses and team analyses. Set up database initialization that runs on app startup. This ensures all later phases can store and retrieve results.

## Context
- .gsd/SPEC.md — REQ-19: Store analysis results in SQLite
- .gsd/DECISIONS.md — ADR-003 (SQLite via SQLAlchemy)
- backend/config.py — DATABASE_URL setting
- backend/main.py — Lifespan handler for DB init

## Tasks

<task type="auto">
  <name>Create SQLAlchemy models and database setup</name>
  <files>
    backend/models/__init__.py
    backend/models/database.py
    backend/models/candidate.py
    backend/models/team.py
  </files>
  <action>
    **backend/models/database.py:**
    - Create SQLAlchemy engine from config DATABASE_URL
    - Create SessionLocal factory with sessionmaker
    - Create Base declarative base
    - Create `init_db()` function that calls Base.metadata.create_all()
    - Create `get_db()` dependency that yields a session and closes it after

    **backend/models/candidate.py:**
    - CandidateAnalysis model:
      - id: Integer, primary key, autoincrement
      - candidate_name: String, nullable
      - email: String, nullable
      - github_username: String, nullable
      - leetcode_username: String, nullable
      - resume_skills: Text (JSON string of extracted skills)
      - job_description: Text
      - match_score: Float, nullable
      - learning_ability_score: Float, nullable
      - credibility_score: Float, nullable
      - overall_score: Float, nullable
      - analysis_result: Text (full JSON result blob)
      - created_at: DateTime, default=utcnow
      - updated_at: DateTime, onupdate=utcnow

    **backend/models/team.py:**
    - TeamAnalysis model:
      - id: Integer, primary key, autoincrement
      - team_name: String
      - team_skills: Text (JSON string)
      - project_requirements: Text (JSON string)
      - coverage_score: Float, nullable
      - skill_gaps: Text (JSON string)
      - hire_plan: Text (JSON string)
      - analysis_result: Text (full JSON result blob)
      - created_at: DateTime, default=utcnow
      - updated_at: DateTime, onupdate=utcnow

    **Update backend/models/__init__.py:**
    - Export Base, init_db, get_db, CandidateAnalysis, TeamAnalysis

    **Update backend/main.py lifespan:**
    - Call init_db() inside the lifespan async context manager on startup
    - Log "Database initialized" on success

    AVOID:
    - Do NOT use Alembic migrations — overkill for hackathon, create_all() is sufficient
    - Do NOT add relationships between models yet — keep flat
    - Do NOT store binary blobs (PDFs) in DB — only analysis results
  </action>
  <verify>
    python3 -c "from backend.models import Base, CandidateAnalysis, TeamAnalysis; print('Models imported OK')"
    # Start server and check that hiresense.db is created
    ls -la hiresense.db
  </verify>
  <done>
    - All model files exist with correct column definitions
    - Models import without errors
    - Server startup creates hiresense.db automatically
    - Tables candidate_analyses and team_analyses exist in the database
  </done>
</task>

<task type="auto">
  <name>Add analysis history endpoints</name>
  <files>
    backend/api/routes/candidates.py
    backend/api/routes/teams.py
  </files>
  <action>
    **candidates.py — add:**
    - GET /candidates/history — return list of past analyses (id, name, match_score, created_at)
    - GET /candidates/{id} — return full analysis result by ID

    **teams.py — add:**
    - GET /teams/history — return list of past team analyses (id, team_name, coverage_score, created_at)
    - GET /teams/{id} — return full team analysis result by ID

    Both use the get_db dependency for database sessions.
    Return empty lists initially (no analyses exist yet).

    AVOID:
    - Do NOT add DELETE endpoints — not needed for hackathon
    - Do NOT add pagination — keep simple for now
  </action>
  <verify>
    curl -s http://localhost:8000/api/candidates/history | python3 -m json.tool
    curl -s http://localhost:8000/api/teams/history | python3 -m json.tool
  </verify>
  <done>
    - GET /api/candidates/history returns [] (empty list)
    - GET /api/teams/history returns [] (empty list)
    - GET /api/candidates/999 returns 404
    - GET /api/teams/999 returns 404
  </done>
</task>

## Success Criteria
- [ ] Database file (hiresense.db) is auto-created on server startup
- [ ] candidate_analyses and team_analyses tables exist with correct columns
- [ ] History endpoints return empty lists when no data exists
- [ ] 404 responses for non-existent analysis IDs
