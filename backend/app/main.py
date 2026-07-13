from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import Base, engine
from app.api import auth, candidate, recruiter, admin, chatbot, gap_analysis
from app.models.job import Job
from app.schemas.job import JobOut
from app.database.session import get_db
from sqlalchemy.orm import Session
from typing import List

# Auto-create database tables on startup (dynamic fail-safe)
Base.metadata.create_all(bind=engine)

# Run custom migrations to add vector/embedding columns
try:
    from app.database.migration import run_migrations
    run_migrations()
except Exception as e:
    print(f"Failed to run database migrations on startup: {e}")

# Auto-seed the admin user to ensure admin@jobify.com exists with role ADMIN
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.core import security

db_session = SessionLocal()
try:
    # Check specifically for admin@jobify.com email
    admin_by_email = db_session.query(User).filter(User.email == "admin@jobify.com").first()
    if not admin_by_email:
        hashed_password = security.get_password_hash("admin@password")
        db_admin = User(
            name="Jobify Admin",
            email="admin@jobify.com",
            password=hashed_password,
            role=UserRole.ADMIN
        )
        db_session.add(db_admin)
        db_session.commit()
        print("Default admin user admin@jobify.com created successfully!")
except Exception as e:
    print(f"Error seeding default admin: {e}")
finally:
    db_session.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
# Set allow_origins=["*"] and allow_credentials=False to allow easy deployment on Vercel/Netlify.
# The app uses Authorization headers for JWTs and does not require credentials/cookies.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public jobs endpoint for Landing Page
@app.get(f"{settings.API_V1_STR}/jobs", response_model=List[JobOut], tags=["public"])
def get_public_jobs(db: Session = Depends(get_db)):
    """List all available jobs without authentication (for landing page)."""
    return db.query(Job).order_by(Job.created_at.desc()).all()

# Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(candidate.router, prefix=f"{settings.API_V1_STR}/candidate", tags=["candidate"])
app.include_router(gap_analysis.router, prefix=f"{settings.API_V1_STR}/candidate", tags=["candidate"])
app.include_router(recruiter.router, prefix=f"{settings.API_V1_STR}/recruiter", tags=["recruiter"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(chatbot.router, prefix=f"{settings.API_V1_STR}/chatbot", tags=["chatbot"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the AI-Powered Job Recommendation System API!",
        "documentation": "/docs"
    }
