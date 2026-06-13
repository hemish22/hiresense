"""
HireSense AI — FastAPI Application
Main entry point for the backend server.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — runs on startup and shutdown."""
    # Startup
    from backend.models.database import init_db
    init_db()
    print(f"✅ Database initialized")

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"✅ Upload directory ready: {settings.UPLOAD_DIR}")

    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} is running")

    yield

    # Shutdown
    print(f"👋 {settings.APP_NAME} shutting down")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.APP_NAME,
        description="Multi-signal intelligence system for hiring & workforce planning",
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    # CORS — origins configurable via CORS_ORIGINS env (default "*" for demo).
    # No cookies/credentials are used, so credentials stay off (required when
    # origins is "*", and safer regardless).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routers
    from backend.api.routes.health import router as health_router
    from backend.api.routes.candidates import router as candidates_router
    from backend.api.routes.teams import router as teams_router
    from backend.api.routes.jobs import router as jobs_router
    from backend.api.routes.analytics import router as analytics_router

    app.include_router(health_router, prefix="/api", tags=["Health"])
    app.include_router(candidates_router, prefix="/api", tags=["Candidates"])
    app.include_router(teams_router, prefix="/api", tags=["Teams"])
    app.include_router(jobs_router, prefix="/api", tags=["Jobs"])
    app.include_router(analytics_router, prefix="/api", tags=["Analytics"])

    # Root — simple liveness/info response (frontend is served separately by Next).
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "ok",
            "docs": "/docs",
        }

    return app


# Create the app instance
app = create_app()
