"""
HireSense AI — Health Check Endpoint
"""

from fastapi import APIRouter
from backend.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Check if the service is running."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": settings.APP_NAME,
    }
