# HireSense AI — Intelligent Hiring & Workforce Planning System

> Decision intelligence platform for startups. Multi-signal candidate analysis, learning ability prediction, resume authenticity detection, and team skill gap analysis.

## Quick Start

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
# Edit .env with your GitHub token (optional)

# Start the server
uvicorn backend.main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- **Dashboard**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Plain HTML/CSS/JS
- **Database**: SQLite (via SQLAlchemy)
- **ML/NLP**: sentence-transformers, scikit-learn, spaCy

## Project Structure

```
backend/
├── main.py          # FastAPI app, CORS, routers
├── config.py        # Settings (env vars)
├── api/routes/      # API endpoints
├── models/          # SQLAlchemy models
├── services/        # Business logic
└── utils/           # Helpers

frontend/
├── index.html       # Single-page app
├── css/style.css    # Design system
└── js/              # App logic + API client
```
