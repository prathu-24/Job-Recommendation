import os
from typing import List
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Job Recommendation System"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    # Standard PostgreSQL fallback to SQLite for local development convenience
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./job_recommendation.db"
    )

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost"]

    # Qdrant Vector Database
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    QDRANT_COLLECTION_NAME: str = os.getenv("QDRANT_COLLECTION_NAME", "jobify_vectors")

    # Groq API Key
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # File Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads/resumes")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx"]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
