"""
HireSense AI — Database Setup
SQLAlchemy engine, session factory, and initialization.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from backend.config import settings

# Create engine — check_same_thread=False needed for SQLite with FastAPI
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def init_db():
    """Create all database tables. Called on app startup."""
    # Import all models so they register with Base.metadata
    from backend.models import candidate, team  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency that provides a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
