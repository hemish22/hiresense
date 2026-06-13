"""
HireSense AI — Configuration Management
Loads settings from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "sqlite:///./hiresense.db"

    # External APIs
    GITHUB_TOKEN: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # App metadata
    APP_VERSION: str = "1.0.0"
    APP_NAME: str = "HireSense AI"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS — comma-separated allowed origins, or "*" for any (demo default).
    CORS_ORIGINS: str = "*"

    # File upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10

    @property
    def cors_origin_list(self) -> list:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton settings instance
settings = Settings()
