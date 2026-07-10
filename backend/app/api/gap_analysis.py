from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.candidate import CandidateProfile
from app.models.job import Job
from app.api.deps import get_candidate
from app.services.gap_analyzer import analyze_gap
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

class SuggestedCourseOut(BaseModel):
    title: str
    platform: str
    url: str

class GapAnalysisOut(BaseModel):
    matching_skills: List[str]
    missing_skills: List[str]
    implicit_skills: List[str]
    suggested_courses: List[SuggestedCourseOut]
    readiness_level: str
    readiness_score: float
    improvement_tips: List[str]

@router.get("/jobs/{job_id}/gap-analysis", response_model=GapAnalysisOut)
def get_job_gap_analysis(
    job_id: int,
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    # 1. Fetch Candidate Profile
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found. Please upload a resume first."
        )
        
    # 2. Fetch Job Details
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
        
    # 3. Perform analysis
    try:
        analysis = analyze_gap(
            candidate_skills=profile.skills or "",
            job_required_skills=job.required_skills or "",
            job_description=job.description or ""
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gap analysis calculation failed: {e}"
        )
        
    return analysis
