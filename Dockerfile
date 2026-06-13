# ─── HireSense AI — Backend (FastAPI) ───
# Works on Hugging Face Spaces (Docker SDK), Render, Railway, or any host.
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/app/.cache

# Python deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY backend ./backend

# Writable dirs (uploads + model cache)
RUN mkdir -p uploads .cache

# HF Spaces expects 7860 by default; PORT overrides for other hosts.
EXPOSE 7860
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
