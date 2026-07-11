from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application, ApplicationStatus
from app.models.candidate import CandidateProfile
from app.schemas.job import JobOut, JobCreate, JobUpdate
from app.schemas.application import ApplicationOut
from app.api.deps import get_recruiter
from pydantic import BaseModel

router = APIRouter()

class ApplicationStatusUpdate(BaseModel):
    status: str

@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_recruiter),
    db: Session = Depends(get_db)
):
    db_job = Job(
        company=job_in.company,
        title=job_in.title,
        description=job_in.description,
        required_skills=job_in.required_skills,
        location=job_in.location,
        salary=job_in.salary,
        experience_required=job_in.experience_required
    )
    
    # Generate and set embedding
    try:
        from app.services.embedding_service import generate_embedding, get_job_text_for_embedding
        db_job.embedding = generate_embedding(get_job_text_for_embedding(db_job))
    except Exception as emb_err:
        print(f"Failed to generate job embedding on creation: {emb_err}")
        
    db.add(db_job)
    try:
        db.commit()
        db.refresh(db_job)
        
        # Trigger matching engine to generate recommendations for all existing candidates
        profiles = db.query(CandidateProfile).all()
        from app.services.matcher import generate_recommendations_for_candidate
        for profile in profiles:
            generate_recommendations_for_candidate(db, profile.id)
        
        # Index job in Qdrant for semantic vector search
        try:
            from app.services.qdrant_service import upsert_job_embedding
            job_text = f"Title: {db_job.title}. Company: {db_job.company}. Description: {db_job.description}. Skills: {db_job.required_skills}. Location: {db_job.location or 'Remote'}"
            upsert_job_embedding(db_job.id, job_text)
        except Exception as e:
            print(f"Qdrant job indexing skipped: {e}")
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while creating job: {e}"
        )
    return db_job

@router.put("/jobs/{id}", response_model=JobOut)
def update_job(
    id: int,
    job_in: JobUpdate,
    current_user: User = Depends(get_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job posting not found"
        )
        
    update_data = job_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(job, field, update_data[field])
        
    # Regenerate and set embedding
    try:
        from app.services.embedding_service import generate_embedding, get_job_text_for_embedding
        job.embedding = generate_embedding(get_job_text_for_embedding(job))
    except Exception as emb_err:
        print(f"Failed to regenerate job embedding on update: {emb_err}")
        
    try:
        db.commit()
        db.refresh(job)
        
        # Re-trigger recommendation matching for all candidates
        profiles = db.query(CandidateProfile).all()
        from app.services.matcher import generate_recommendations_for_candidate
        for profile in profiles:
            generate_recommendations_for_candidate(db, profile.id)
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while updating job: {e}"
        )
    return job

@router.delete("/jobs/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    id: int,
    current_user: User = Depends(get_recruiter),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job posting not found"
        )
    try:
        db.delete(job)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while deleting job: {e}"
        )
    return

# Fetch jobs list for Recruiter management
@router.get("/jobs", response_model=List[JobOut])
def list_jobs(
    current_user: User = Depends(get_recruiter),
    db: Session = Depends(get_db)
):
    return db.query(Job).order_by(Job.created_at.desc()).all()

# Detailed application type with candidate user information
class CandidateUserOut(BaseModel):
    name: str
    email: str

class CandidateProfileDetails(BaseModel):
    id: int
    user_id: int
    skills: str
    experience: str
    education: str
    phone: str
    name_extracted: str
    email_extracted: str
    user: CandidateUserOut

    class Config:
        from_attributes = True

class RecruiterApplicationOut(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    application_status: str
    created_at: str
    job: JobOut
    candidate: CandidateProfileDetails

    class Config:
        from_attributes = True

@router.get("/applications", response_model=List[Any] if False else list)
def get_applications(
    current_user: User = Depends(get_recruiter),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).order_by(Application.created_at.desc()).all()
    result = []
    for app in apps:
        # Load profile and associated user
        profile = db.query(CandidateProfile).filter(CandidateProfile.id == app.candidate_id).first()
        if not profile:
            continue
        user = db.query(User).filter(User.id == profile.user_id).first()
        if not user:
            continue
        
        result.append({
            "id": app.id,
            "candidate_id": app.candidate_id,
            "job_id": app.job_id,
            "application_status": app.application_status,
            "created_at": app.created_at.isoformat(),
            "job": {
                "id": app.job.id,
                "title": app.job.title,
                "company": app.job.company,
                "description": app.job.description,
                "required_skills": app.job.required_skills,
                "location": app.job.location,
                "salary": app.job.salary,
                "experience_required": app.job.experience_required,
                "created_at": app.job.created_at
            },
            "candidate": {
                "id": profile.id,
                "user_id": profile.user_id,
                "skills": profile.skills or "",
                "experience": profile.experience or "",
                "education": profile.education or "",
                "phone": profile.phone or "",
                "name_extracted": profile.name_extracted or user.name,
                "email_extracted": profile.email_extracted or user.email,
                "user": {
                    "name": user.name,
                    "email": user.email
                }
            }
        })
    return result

@router.put("/applications/{id}", status_code=status.HTTP_200_OK)
def update_application_status(
    id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(get_recruiter),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )
    if status_update.status not in [ApplicationStatus.APPLIED, ApplicationStatus.REVIEWED, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )
        
    app.application_status = status_update.status
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while updating application: {e}"
        )
    return {"message": "Application status updated successfully"}
