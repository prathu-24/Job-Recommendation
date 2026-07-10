from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import Counter
from app.database.session import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import CandidateProfile
from app.models.application import Application
from app.models.recommendation import Recommendation
from app.schemas.user import UserOut
from app.api.deps import get_admin

router = APIRouter()

@router.get("/users", response_model=List[UserOut])
def get_users(
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_stats(
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_candidates = db.query(User).filter(User.role == "candidate").count()
    total_recruiters = db.query(User).filter(User.role == "recruiter").count()
    total_jobs = db.query(Job).count()
    total_applications = db.query(Application).count()
    total_recommendations = db.query(Recommendation).count()
    
    # Calculate average recommendation score
    avg_score = 0.0
    scores = db.query(Recommendation.similarity_score).all()
    if scores:
        avg_score = sum(s[0] for s in scores) / len(scores)
        
    # Count uploaded resumes
    uploaded_resumes = db.query(CandidateProfile).filter(CandidateProfile.resume_path != None).count()
    
    return {
        "total_users": total_users,
        "total_candidates": total_candidates,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
        "total_recommendations": total_recommendations,
        "average_similarity_score": round(avg_score, 2),
        "uploaded_resumes": uploaded_resumes
    }

@router.get("/analytics", response_model=Dict[str, Any])
def get_analytics(
    current_user: User = Depends(get_admin),
    db: Session = Depends(get_db)
):
    # 1. Skill Distribution (Count occurrences of each skill)
    profiles = db.query(CandidateProfile.skills).all()
    skills_counter = Counter()
    for (skills_str,) in profiles:
        if skills_str:
            skills = [s.strip() for s in skills_str.split(",") if s.strip()]
            skills_counter.update(skills)
            
    skill_distribution = [{"skill": k, "count": v} for k, v in skills_counter.most_common(12)]
    
    # 2. User Growth (Users created over past 7 days)
    today = datetime.utcnow().date()
    user_growth = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start_dt = datetime.combine(day, datetime.min.time())
        end_dt = datetime.combine(day, datetime.max.time())
        count = db.query(User).filter(User.created_at >= start_dt, User.created_at <= end_dt).count()
        user_growth.append({"date": day.strftime("%b %d"), "users": count})
        
    # 3. Applications Stats (Total applications over past 7 days)
    applications_growth = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start_dt = datetime.combine(day, datetime.min.time())
        end_dt = datetime.combine(day, datetime.max.time())
        count = db.query(Application).filter(Application.created_at >= start_dt, Application.created_at <= end_dt).count()
        applications_growth.append({"date": day.strftime("%b %d"), "applications": count})
        
    # 4. Job Categories (Count by job title word groupings)
    jobs = db.query(Job.title).all()
    job_titles = [j[0].lower() for j in jobs if j[0]]
    categories = {
        "Software Engineering": ["developer", "engineer", "programmer", "software", "fullstack", "backend", "frontend"],
        "Data & AI": ["data", "ai", "machine learning", "analyst", "deep learning", "nlp", "scientist"],
        "Product Management": ["product manager", "product owner", "project manager", "scrum"],
        "Design": ["designer", "ui", "ux", "creative", "artist"],
        "Sales & Marketing": ["sales", "marketing", "growth", "business development", "seo"]
    }
    
    category_counts = Counter()
    for title in job_titles:
        matched = False
        for cat, keywords in categories.items():
            if any(kw in title for kw in keywords):
                category_counts[cat] += 1
                matched = True
                break
        if not matched:
            category_counts["Others"] += 1
            
    job_categories = [{"category": k, "count": v} for k, v in category_counts.items()]
    
    # 5. Recommendation Accuracy (Bucketed similarity scores)
    recs = db.query(Recommendation.similarity_score).all()
    buckets = {
        "80-100% (Excellent)": 0,
        "60-79% (Good)": 0,
        "40-59% (Average)": 0,
        "0-39% (Poor)": 0
    }
    for (score,) in recs:
        if score >= 80:
            buckets["80-100% (Excellent)"] += 1
        elif score >= 60:
            buckets["60-79% (Good)"] += 1
        elif score >= 40:
            buckets["40-59% (Average)"] += 1
        else:
            buckets["0-39% (Poor)"] += 1
            
    recommendation_accuracy = [{"bucket": k, "count": v} for k, v in buckets.items()]
    
    # 6. Resume Upload Statistics
    total_profiles = db.query(CandidateProfile).count()
    uploaded_pdf = db.query(CandidateProfile).filter(CandidateProfile.resume_path.like("%.pdf")).count()
    uploaded_docx = db.query(CandidateProfile).filter(CandidateProfile.resume_path.like("%.docx")).count()
    no_resume = total_profiles - uploaded_pdf - uploaded_docx
    
    resume_upload_stats = [
        {"format": "PDF", "count": uploaded_pdf},
        {"format": "DOCX", "count": uploaded_docx},
        {"format": "Not Uploaded", "count": no_resume}
    ]
    
    return {
        "skill_distribution": skill_distribution,
        "user_growth": user_growth,
        "applications_growth": applications_growth,
        "job_categories": job_categories,
        "recommendation_accuracy": recommendation_accuracy,
        "resume_upload_stats": resume_upload_stats
    }
