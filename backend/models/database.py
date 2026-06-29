"""
HireSense AI — Database Setup
SQLAlchemy engine, session factory, and initialization.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from backend.config import settings

# Create engine — check_same_thread is SQLite-only; skip it for Postgres/others.
# pool_pre_ping avoids stale-connection errors on managed Postgres (idle drops).
_url = settings.DATABASE_URL
_connect_args = {"check_same_thread": False} if _url.startswith("sqlite") else {}
engine = create_engine(
    _url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    echo=False,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def init_db():
    """Create all database tables. Called on app startup."""
    # Import all models so they register with Base.metadata
    from backend.models import candidate, team, job  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Lightweight migrations for columns added after a table already existed
    _ensure_columns()

    # Seed default job postings (open application + sample roles)
    db = SessionLocal()
    try:
        job.seed_jobs(db)
    finally:
        db.close()


def _ensure_columns():
    """Add columns introduced after initial table creation (SQLite-safe)."""
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    try:
        cols = [c["name"] for c in insp.get_columns("candidate_analyses")]
    except Exception:
        return
    if "status" not in cols:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE candidate_analyses ADD COLUMN status VARCHAR(32) DEFAULT 'applied'"
            ))


def get_db():
    """Dependency that provides a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
