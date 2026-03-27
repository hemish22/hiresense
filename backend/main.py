"""
HireSense AI — FastAPI Application
Main entry point for the backend server.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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

    # CORS — allow all origins for hackathon demo
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routers
    from backend.api.routes.health import router as health_router
    from backend.api.routes.candidates import router as candidates_router
    from backend.api.routes.teams import router as teams_router

    app.include_router(health_router, prefix="/api", tags=["Health"])
    app.include_router(candidates_router, prefix="/api", tags=["Candidates"])
    app.include_router(teams_router, prefix="/api", tags=["Teams"])

    # Serve frontend static files
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    if os.path.exists(frontend_dir):
        # Serve static assets (CSS, JS)
        css_dir = os.path.join(frontend_dir, "css")
        js_dir = os.path.join(frontend_dir, "js")
        if os.path.exists(css_dir):
            app.mount("/css", StaticFiles(directory=css_dir), name="css")
        if os.path.exists(js_dir):
            app.mount("/js", StaticFiles(directory=js_dir), name="js")

        # Serve index.html at root
        @app.get("/", include_in_schema=False)
        async def serve_frontend():
            return FileResponse(os.path.join(frontend_dir, "index.html"))

    return app


# Create the app instance
app = create_app()
