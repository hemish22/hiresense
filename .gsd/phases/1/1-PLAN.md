---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Python Project Structure & FastAPI Skeleton

## Objective
Set up the complete Python project structure with FastAPI app, configuration management, dependency specification, and development tooling. This creates the foundation every other module builds on.

## Context
- .gsd/SPEC.md — Tech stack decisions (FastAPI, Python, SQLite)
- .gsd/DECISIONS.md — ADR-001 (FastAPI), ADR-003 (SQLite)
- .gsd/ROADMAP.md — Phase 1 scope

## Tasks

<task type="auto">
  <name>Create project directory structure</name>
  <files>
    backend/__init__.py
    backend/main.py
    backend/config.py
    backend/api/__init__.py
    backend/api/routes/__init__.py
    backend/api/routes/health.py
    backend/api/routes/candidates.py
    backend/api/routes/teams.py
    backend/services/__init__.py
    backend/models/__init__.py
    backend/utils/__init__.py
    requirements.txt
    .env.example
    .gitignore
    README.md
  </files>
  <action>
    Create the following project structure:

    ```
    backend/
    ├── __init__.py
    ├── main.py              # FastAPI app factory, CORS, static files, router mounting
    ├── config.py             # Pydantic Settings: DB path, GitHub PAT, API keys, model paths
    ├── api/
    │   ├── __init__.py
    │   └── routes/
    │       ├── __init__.py
    │       ├── health.py     # GET /api/health — returns status + version
    │       ├── candidates.py # Placeholder POST /api/candidates/analyze
    │       └── teams.py      # Placeholder POST /api/teams/analyze
    ├── services/
    │   └── __init__.py       # Empty — services added in Phase 2+
    ├── models/
    │   └── __init__.py       # Empty — SQLAlchemy models added in Plan 1.2
    └── utils/
        └── __init__.py       # Empty — utilities added later
    ```

    **main.py specifics:**
    - Create FastAPI app with title="HireSense AI", version="1.0.0"
    - Add CORS middleware allowing all origins (hackathon demo)
    - Mount static files from `frontend/` directory at `/`
    - Include routers from api/routes/ with `/api` prefix
    - Add lifespan handler that initializes the database on startup

    **config.py specifics:**
    - Use pydantic-settings BaseSettings class
    - Fields: DATABASE_URL (default: sqlite:///./hiresense.db), GITHUB_TOKEN (optional), APP_VERSION (default: 1.0.0)
    - Load from .env file

    **health.py specifics:**
    - Single GET endpoint at /health
    - Returns {"status": "healthy", "version": "1.0.0", "service": "HireSense AI"}

    **candidates.py specifics:**
    - Placeholder POST /candidates/analyze that returns {"message": "Not implemented yet"}
    - This will be wired up in Phase 2

    **teams.py specifics:**
    - Placeholder POST /teams/analyze that returns {"message": "Not implemented yet"}
    - This will be wired up in Phase 4

    **requirements.txt:**
    - fastapi>=0.104.0
    - uvicorn[standard]>=0.24.0
    - pydantic-settings>=2.1.0
    - sqlalchemy>=2.0.23
    - python-multipart>=0.0.6
    - pdfplumber>=0.10.3
    - spacy>=3.7.2
    - sentence-transformers>=2.2.2
    - scikit-learn>=1.3.2
    - requests>=2.31.0
    - python-dotenv>=1.0.0
    - aiofiles>=23.2.1

    **.env.example:**
    - DATABASE_URL=sqlite:///./hiresense.db
    - GITHUB_TOKEN=your_github_pat_here

    **.gitignore:**
    - Standard Python gitignore + .env, *.db, __pycache__, .venv

    **README.md:**
    - Project name, one-line description
    - Quick start: install deps, run server
    - API docs at /docs

    AVOID:
    - Do NOT add authentication — out of scope per SPEC non-goals
    - Do NOT create complex middleware — keep it minimal
    - Do NOT install dependencies yet — that's a separate step during execution
  </action>
  <verify>
    ls -la backend/ backend/api/ backend/api/routes/ backend/services/ backend/models/ backend/utils/
    cat requirements.txt
    cat backend/main.py
  </verify>
  <done>
    - All directories and files exist
    - main.py creates a FastAPI app with CORS, router includes, and static file mount
    - config.py has Pydantic Settings with DATABASE_URL and GITHUB_TOKEN
    - health.py has GET /health returning status JSON
    - requirements.txt has all Phase 1+ dependencies listed
    - .env.example, .gitignore, README.md exist
  </done>
</task>

<task type="auto">
  <name>Install dependencies and verify server starts</name>
  <files>requirements.txt</files>
  <action>
    1. Create Python virtual environment: python3 -m venv .venv
    2. Activate it: source .venv/bin/activate
    3. Install requirements: pip install -r requirements.txt
    4. Start the server: uvicorn backend.main:app --reload --port 8000
    5. Test health endpoint: curl http://localhost:8000/api/health
    6. Verify OpenAPI docs load at http://localhost:8000/docs

    AVOID:
    - Do NOT install spaCy model yet (needed in Phase 2, not Phase 1)
    - Do NOT try to connect to GitHub/LeetCode APIs yet
  </action>
  <verify>
    curl -s http://localhost:8000/api/health | python3 -m json.tool
  </verify>
  <done>
    - Virtual environment created and activated
    - All dependencies installed without errors
    - Server starts on port 8000
    - GET /api/health returns {"status": "healthy", "version": "1.0.0", "service": "HireSense AI"}
    - /docs page loads and shows all routes
  </done>
</task>

## Success Criteria
- [ ] FastAPI server starts and responds on http://localhost:8000
- [ ] Health endpoint returns valid JSON with status, version, service
- [ ] Project structure matches the specification above
- [ ] All placeholder routes exist and return appropriate responses
