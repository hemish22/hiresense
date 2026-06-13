# HireSense AI

> Intelligence beyond the resume — a multi-signal hiring platform that evaluates true ability, maps your talent pool in 3D, and plans your team's next hires.

HireSense parses a candidate's resume, **verifies** their claimed skills against real GitHub and LeetCode signals, scores fit against a job description, and turns the whole applicant pool into an explorable **3D talent map** — plus team gap analysis, a hiring pipeline, and recruiter analytics.

---

## ✨ Features

| | |
|---|---|
| 🔍 **Candidate Evaluation** | Resume → skills, scored against a JD with GitHub & LeetCode verification, learning-ability and credibility signals, and a one-click **AI hire verdict** (Groq). |
| 👥 **Team Gap Analysis** | Upload your team's resumes → coverage %, risk-adjusted coverage, **key-person (bus-factor) risk**, upskill paths, composition radar, what-if editor, and a prioritized hire plan with auto-generated JDs. |
| 🌌 **3D Talent Map** | Every applicant projected into a semantic vector space (PCA + K-Means), colored by domain. Hover for detail, click to open the full evaluation, search in natural language. |
| 📋 **Hiring Pipeline** | Kanban board across stages (Applied → Hired/Rejected), per-role candidate ranking, and side-by-side candidate compare. |
| 📊 **Recruiting Insights** | Score distribution, pipeline funnel, talent supply vs open-role demand, and applications over time. |
| 💼 **Applicant Portal** | A separate public careers site (`/apply`) where candidates apply year-round or to specific roles — every application is auto-evaluated and stored instantly. |

## 🏗️ Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  Applicant Portal /apply │         │  Recruiter Dashboard      │
│  (Next.js — public)      │         │  /dashboard (Next.js)     │
└─────────────┬────────────┘         └─────────────┬────────────┘
              │  POST /candidates/apply            │  GET /candidates/* /jobs/* /analytics/*
              ▼                                     ▼
        ┌─────────────────────────────────────────────────┐
        │            FastAPI backend (Python)             │
        │  resume parse → GitHub + LeetCode → ML scoring  │
        │  Groq (primary) → Gemini → embeddings fallback  │
        └───────────────────────┬─────────────────────────┘
                                ▼
                         SQLite / Postgres
```

**Tech stack:** Next.js 16 · React 19 · Tailwind · Recharts · react-three-fiber (3D) · FastAPI · SQLAlchemy · scikit-learn · sentence-transformers · Groq / Gemini.

## 📁 Project structure

```
.
├── backend/                 # FastAPI app
│   ├── api/routes/          # candidates, teams, jobs, analytics, health
│   ├── models/              # SQLAlchemy models (candidate, team, job)
│   ├── services/            # parsing, scoring, github/leetcode, constellation, matching, ai_summary
│   ├── config.py            # env-driven settings
│   └── main.py              # app factory + CORS + router wiring
├── frontend/                # Next.js app (dashboard + applicant portal)
│   └── src/
│       ├── app/             # routes: /, /dashboard, /apply, /candidates/[id]
│       ├── components/      # dashboard views + UI
│       └── lib/             # api client + shared domain constants
├── requirements.txt         # backend deps
├── Dockerfile               # backend image (HF Spaces / Render / any)
├── docker-compose.yml       # full stack for local / VPS
└── .env.example             # backend env template
```

---

## 🚀 Local setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- A free [Groq API key](https://console.groq.com) (recommended) and/or [Gemini key](https://aistudio.google.com/apikey)

### 1. Backend

```bash
# from the repo root
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then fill in your keys
uvicorn backend.main:app --reload --port 8000
```

Backend is now at **http://127.0.0.1:8000** (interactive docs at `/docs`).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local         # defaults to the local backend
npm run dev
```

Open **http://localhost:3000**:
- Recruiter dashboard → `/dashboard`
- Applicant careers portal → `/apply`

### Environment variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | backend | Primary LLM for skill matching & AI verdicts |
| `GEMINI_API_KEY` | backend | Fallback LLM |
| `GITHUB_TOKEN` | backend | Optional — raises GitHub rate limit 60 → 5000/hr |
| `DATABASE_URL` | backend | `sqlite:///./hiresense.db` (default) or a Postgres URL |
| `CORS_ORIGINS` | backend | Allowed frontend origins (comma-separated) or `*` |
| `MAX_FILE_SIZE_MB` | backend | Upload size cap (default 10) |
| `NEXT_PUBLIC_API_URL` | frontend | Backend API base, e.g. `http://127.0.0.1:8000/api` |

> Works without any LLM key (deterministic fallbacks), but Groq/Gemini give the best matching and AI summaries.

---

## 🐳 Docker (local or VPS)

```bash
cp .env.example .env               # fill keys
docker compose up --build
# frontend → http://localhost:3000   backend → http://localhost:8000
```

---

## ☁️ Deploy (free tier)

The backend bundles ML libraries, so it runs best on a host with real memory. The simplest free combo is **Hugging Face Spaces** (backend) + **Vercel** (frontend).

### Backend → Hugging Face Spaces (Docker)
1. Create a new **Space** → SDK: **Docker** → blank.
2. Push this repo to the Space (or connect the GitHub repo). HF builds the `Dockerfile` automatically.
3. In **Settings → Variables and secrets**, add `GROQ_API_KEY`, `GEMINI_API_KEY`, `GITHUB_TOKEN`, and `CORS_ORIGINS=https://<your-vercel-app>.vercel.app`.
4. The API is live at `https://<user>-<space>.hf.space` (docs at `/docs`).

### Frontend → Vercel
1. **Import Project** → select this repo → set **Root Directory** to `frontend`.
2. Add env var `NEXT_PUBLIC_API_URL=https://<your-space>.hf.space/api`.
3. Deploy. Vercel auto-detects Next.js.

> Alternative backends: Render or Railway (use the included `Dockerfile`). On Render's free tier the ML deps may exceed the memory limit — prefer Hugging Face Spaces or a paid instance.

---

## 🔐 Security notes

This is a demo build: the recruiter dashboard and its data endpoints are **open (no auth)**. Before handling real applicant data, add an auth gate (recruiter API key or login) in front of the `/candidates`, `/teams`, and `/analytics` routes, and set `CORS_ORIGINS` to your exact frontend domain. Uploads are validated (PDF only, size-capped, sanitized filenames); API keys are loaded from env and never committed.

## 📄 License

MIT — see `LICENSE`.
