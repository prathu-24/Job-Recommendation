import os
import shutil
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.candidate import CandidateProfile
from app.models.recommendation import Recommendation
from app.models.job import Job
from app.models.application import Application
from app.schemas.candidate import CandidateProfileOut, CandidateProfileUpdate
from app.schemas.recommendation import RecommendationOut
from app.api.deps import get_candidate
from app.core.config import settings
from app.services.parser import parse_resume
from app.services.matcher import generate_recommendations_for_candidate

router = APIRouter()

@router.post("/upload-resume", response_model=CandidateProfileOut)
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    # Validate extension
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Only {', '.join(settings.ALLOWED_EXTENSIONS)} are allowed."
        )
        
    # Get user profile or create one if somehow missing
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    # Store file securely on disk
    filename = f"user_{current_user.id}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save the file stream
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save resume file: {e}"
        )
        
    # Update path in profile
    profile.resume_path = file_path
    
    # Execute AI Resume Parsing
    try:
        parsed_data = parse_resume(file_path)
        
        # Save parsed data to profile columns
        profile.name_extracted = parsed_data.get("name")
        profile.email_extracted = parsed_data.get("email")
        profile.phone = parsed_data.get("phone")
        profile.skills = parsed_data.get("skills")
        profile.education = parsed_data.get("education")
        profile.experience = parsed_data.get("experience")
        profile.projects = parsed_data.get("projects")
        profile.certifications = parsed_data.get("certifications")
        profile.languages = parsed_data.get("languages")
        
        # Generate and save embedding
        try:
            from app.services.embedding_service import generate_embedding, get_candidate_text_for_embedding
            candidate_text = get_candidate_text_for_embedding(profile)
            profile.embedding = generate_embedding(candidate_text)
            print(f"[Candidate API] Generated resume embedding for candidate {current_user.id}")
        except Exception as emb_err:
            print(f"Failed to generate candidate embedding on upload: {emb_err}")
            
        # Synchronize/Update the main User account details if successfully parsed!
        if parsed_data.get("name") and parsed_data.get("name") != "Candidate Name":
            current_user.name = parsed_data.get("name")
        if parsed_data.get("email"):
            # Check if email is already taken to avoid key duplicate conflicts
            existing_user_email = db.query(User).filter(
                User.email == parsed_data.get("email"),
                User.id != current_user.id
            ).first()
            if not existing_user_email:
                current_user.email = parsed_data.get("email")
        
        db.commit()
        db.refresh(profile)
        db.refresh(current_user)
    except Exception as e:
        # Don't fail the whole request, but log/raise
        print(f"Parsing error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume uploaded, but parsing failed: {e}"
        )
        
    # Execute Job Matching engine automatically on upload
    try:
        generate_recommendations_for_candidate(db, profile.id)
    except Exception as e:
        print(f"Job recommendations generation failed: {e}")
        # Allow returning candidate profile even if matcher fails, but print error
    
    # Index resume in Qdrant for semantic vector search
    try:
        from app.services.qdrant_service import upsert_resume_embedding
        resume_text = f"Skills: {profile.skills or ''}. Experience: {profile.experience or ''}. Education: {profile.education or ''}. Projects: {profile.projects or ''}. Certifications: {profile.certifications or ''}"
        upsert_resume_embedding(profile.id, resume_text)
    except Exception as e:
        print(f"Qdrant resume indexing skipped: {e}")
        
    return profile

@router.get("/profile", response_model=CandidateProfileOut)
def get_profile(
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(
            user_id=current_user.id,
            skills="",
            experience="",
            education=""
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=CandidateProfileOut)
def update_profile(
    profile_in: CandidateProfileUpdate,
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
        
    update_data = profile_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(profile, field, update_data[field])
        
    # Regenerate and save embedding
    try:
        from app.services.embedding_service import generate_embedding, get_candidate_text_for_embedding
        candidate_text = get_candidate_text_for_embedding(profile)
        profile.embedding = generate_embedding(candidate_text)
        print(f"[Candidate API] Regenerated resume embedding for candidate {current_user.id} on update")
    except Exception as emb_err:
        print(f"Failed to regenerate candidate embedding on profile update: {emb_err}")
        
    try:
        db.commit()
        db.refresh(profile)
        # Re-run recommendation matching since profile fields changed
        generate_recommendations_for_candidate(db, profile.id)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {e}"
        )
        
    return profile

@router.get("/recommendations", response_model=List[RecommendationOut])
def get_recommendations(
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
        
    # Get stored recommendations join with jobs
    recs = db.query(Recommendation).filter(Recommendation.candidate_id == profile.id).order_by(Recommendation.similarity_score.desc()).all()
    
    # If recommendations are empty but there are jobs, trigger regeneration
    if not recs:
        jobs_count = db.query(Job).count()
        if jobs_count > 0:
            recs = generate_recommendations_for_candidate(db, profile.id)
            
    return recs

@router.post("/jobs/{job_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: int,
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    # Check if job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.candidate_id == profile.id,
        Application.job_id == job_id
    ).first()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job"
        )
    
    app = Application(candidate_id=profile.id, job_id=job_id)
    db.add(app)
    try:
        db.commit()
        db.refresh(app)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during application: {e}"
        )
    return {"message": "Application submitted successfully", "application_id": app.id}

@router.get("/applications")
def get_my_applications(
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    apps = db.query(Application).filter(Application.candidate_id == profile.id).all()
    
    result = []
    for app in apps:
        result.append({
            "id": app.id,
            "job_id": app.job_id,
            "application_status": app.application_status,
            "created_at": app.created_at.isoformat(),
            "job": {
                "id": app.job.id,
                "title": app.job.title,
                "company": app.job.company,
                "location": app.job.location,
                "salary": app.job.salary
            }
        })
    return result

@router.get("/recommendations/rag")
def get_rag_recommendations(
    current_user: User = Depends(get_candidate),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found. Please upload a resume first."
        )
        
    from app.services.embedding_service import generate_embedding, get_candidate_text_for_embedding
    
    # Check if profile has an embedding, otherwise generate it dynamically
    embedding_list = None
    if not profile.embedding:
        try:
            candidate_text = get_candidate_text_for_embedding(profile)
            embedding_list = generate_embedding(candidate_text)
            profile.embedding = embedding_list
            db.commit()
            db.refresh(profile)
            print(f"[RAG Endpoint] Dynamically generated embedding for candidate {current_user.id}")
        except Exception as e:
            print(f"[RAG Endpoint] Failed to generate embedding: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate candidate profile embedding: {e}"
            )
    else:
        # Decode/retrieve the embedding list safely
        import json
        if isinstance(profile.embedding, str):
            try:
                embedding_list = json.loads(profile.embedding)
            except Exception:
                try:
                    embedding_list = [float(x) for x in profile.embedding.split(",") if x.strip()]
                except Exception:
                    pass
        elif isinstance(profile.embedding, list):
            embedding_list = profile.embedding
        else:
            try:
                embedding_list = list(profile.embedding)
            except Exception:
                pass
                
    if not embedding_list or len(embedding_list) != 384:
        # Regenerate if corrupt or invalid dimension
        try:
            candidate_text = get_candidate_text_for_embedding(profile)
            embedding_list = generate_embedding(candidate_text)
            profile.embedding = embedding_list
            db.commit()
            db.refresh(profile)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Candidate profile embedding is missing or corrupt and could not be regenerated."
            )
            
    # Search top 5 semantically similar jobs
    from app.services.vector_search_service import search_similar_jobs
    similar_jobs_with_scores = search_similar_jobs(db, embedding_list, top_k=5)
    
    if not similar_jobs_with_scores:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching jobs found in the database. Please ensure jobs are posted."
        )
        
    # Extract jobs list and candidate text
    jobs = [job for job, score in similar_jobs_with_scores]
    candidate_text = get_candidate_text_for_embedding(profile)
    
    # Generate RAG recommendations
    from app.services.rag_service import generate_rag_recommendations
    rag_result = generate_rag_recommendations(candidate_text, jobs)
    
    # Attach retrieved job ids and scores for tracing/debugging or display
    rag_result["retrieved_jobs"] = [
        {
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "similarity_score": round(score * 100, 2)
        }
        for job, score in similar_jobs_with_scores
    ]
    
    return rag_result

