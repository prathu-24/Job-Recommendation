import re
import json
import numpy as np
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.job import Job
from app.models.candidate import CandidateProfile
from app.models.recommendation import Recommendation

# Fallback structures for SentenceTransformer
try:
    from sentence_transformers import SentenceTransformer, util
    # Disable PyTorch progress bars/warnings to keep output clean
    import os
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    try:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as model_err:
        print(f"Failed to load sentence-transformer model: {model_err}. Using TF-IDF fallback.")
        model = None
except ImportError:
    print("sentence-transformers not installed. Using TF-IDF fallback.")
    model = None

# TF-IDF fallback imports
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def calculate_skill_match(candidate_skills: str, job_skills: str) -> float:
    """Calculate skill match percentage (40% weight)."""
    if not job_skills:
        return 100.0
        
    cand_set = {s.strip().lower() for s in candidate_skills.split(",") if s.strip()}
    job_set = {s.strip().lower() for s in job_skills.split(",") if s.strip()}
    
    if not job_set:
        return 100.0
    if not cand_set:
        return 0.0
        
    # Standard intersection
    matched = cand_set.intersection(job_set)
    
    # Check for soft matches/substrings (e.g. "React.js" matches "React")
    soft_matches = 0
    remaining_job = job_set - matched
    remaining_cand = cand_set - matched
    
    for js in remaining_job:
        for cs in remaining_cand:
            if js in cs or cs in js:
                soft_matches += 0.8  # partial credit
                break
                
    score = (len(matched) + soft_matches) / len(job_set)
    return min(score * 100.0, 100.0)

def extract_years_from_text(text: str) -> int:
    """Helper to parse years of experience from profile text."""
    if not text:
        return 0
    # Search for e.g. "5 years", "3+ years", "10 yrs"
    match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', text.lower())
    if match:
        return int(match.group(1))
    return 0

def calculate_experience_match(candidate_exp_text: str, job_exp_required: int) -> float:
    """Calculate experience match percentage (20% weight)."""
    if job_exp_required <= 0:
        return 100.0
        
    cand_years = extract_years_from_text(candidate_exp_text)
    
    if cand_years >= job_exp_required:
        return 100.0
    if cand_years == 0:
        return 0.0
        
    return (cand_years / job_exp_required) * 100.0

def get_education_rank(edu_text: str) -> int:
    """Rank education text on a scale from 1 (High School) to 5 (PhD)."""
    if not edu_text:
        return 1
    edu_lower = edu_text.lower()
    if any(k in edu_lower for k in ["phd", "ph.d", "doctorate"]):
        return 5
    if any(k in edu_lower for k in ["master", "m.s.", "mtech", "mba", "m.c.a", "post graduate"]):
        return 4
    if any(k in edu_lower for k in ["bachelor", "b.s.", "btech", "degree", "graduate"]):
        return 3
    if any(k in edu_lower for k in ["associate", "diploma"]):
        return 2
    return 1

def calculate_education_match(candidate_edu_text: str, job_description: str) -> float:
    """Calculate education match percentage (20% weight)."""
    # Heuristically detect job's minimum required education
    job_desc_lower = job_description.lower()
    required_rank = 3 # Default is Bachelor's
    
    if any(k in job_desc_lower for k in ["phd", "ph.d", "doctorate"]):
        required_rank = 5
    elif any(k in job_desc_lower for k in ["master", "ms ", "m.s.", "mtech", "mba"]):
        required_rank = 4
    elif any(k in job_desc_lower for k in ["associate", "diploma"]):
        required_rank = 2
    elif any(k in job_desc_lower for k in ["high school", "secondary school"]):
        required_rank = 1
        
    cand_rank = get_education_rank(candidate_edu_text)
    
    if cand_rank >= required_rank:
        return 100.0
    return (cand_rank / required_rank) * 100.0

def calculate_keyword_similarity(candidate_text: str, job_text: str) -> float:
    """Calculate keyword semantic cosine similarity (20% weight)."""
    if not candidate_text.strip() or not job_text.strip():
        return 0.0
        
    # Try SentenceTransformers if available
    if model:
        try:
            emb1 = model.encode(candidate_text, convert_to_tensor=True)
            emb2 = model.encode(job_text, convert_to_tensor=True)
            cosine_score = util.cos_sim(emb1, emb2).item()
            # Normalize from [-1, 1] to [0, 1]
            score = max(0.0, cosine_score)
            return score * 100.0
        except Exception as e:
            print(f"Embedding error: {e}. Falling back to TF-IDF.")
            
    # TF-IDF Fallback
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf = vectorizer.fit_transform([candidate_text, job_text])
        score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(score) * 100.0
    except Exception as e:
        print(f"TF-IDF error: {e}")
        return 0.0

def evaluate_match(candidate: CandidateProfile, job: Job) -> Tuple[float, Dict[str, float]]:
    """Evaluate candidate match against a specific job posting."""
    # Construct combined text representations
    candidate_summary = f"""
    Skills: {candidate.skills or ''}
    Experience: {candidate.experience or ''}
    Education: {candidate.education or ''}
    Projects: {candidate.projects or ''}
    Certifications: {candidate.certifications or ''}
    Languages: {candidate.languages or ''}
    """
    
    job_summary = f"""
    Title: {job.title}
    Company: {job.company}
    Description: {job.description}
    Required Skills: {job.required_skills}
    """
    
    skill_score = calculate_skill_match(candidate.skills or "", job.required_skills)
    exp_score = calculate_experience_match(candidate.experience or "", job.experience_required)
    edu_score = calculate_education_match(candidate.education or "", job.description)
    kw_score = calculate_keyword_similarity(candidate_summary, job_summary)
    
    # Calculate Overall Weighted Score:
    # 40% Skill Match + 20% Experience Match + 20% Education Match + 20% Keyword Similarity
    overall_score = (0.40 * skill_score) + (0.20 * exp_score) + (0.20 * edu_score) + (0.20 * kw_score)
    
    details = {
        "skill_match": round(skill_score, 2),
        "experience_match": round(exp_score, 2),
        "education_match": round(edu_score, 2),
        "keyword_similarity": round(kw_score, 2)
    }
    
    return round(overall_score, 2), details

def generate_recommendations_for_candidate(db: Session, candidate_id: int) -> List[Recommendation]:
    """Calculate and store Top 10 recommendations for a given candidate, overwriting old ones."""
    candidate = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not candidate:
        return []
        
    # Get all active job listings
    jobs = db.query(Job).all()
    if not jobs:
        return []
        
    scores = []
    for job in jobs:
        score, details = evaluate_match(candidate, job)
        scores.append((job.id, score, json.dumps(details)))
        
    # Sort by overall similarity score descending
    scores.sort(key=lambda x: x[1], reverse=True)
    
    # Select Top 10 matches
    top_matches = scores[:10]
    
    # Remove existing recommendations for this candidate
    db.query(Recommendation).filter(Recommendation.candidate_id == candidate_id).delete()
    
    new_recs = []
    for job_id, score, details_str in top_matches:
        rec = Recommendation(
            candidate_id=candidate_id,
            job_id=job_id,
            similarity_score=score,
            match_details=details_str
        )
        db.add(rec)
        new_recs.append(rec)
        
    try:
        db.commit()
        for r in new_recs:
            db.refresh(r)
    except Exception as e:
        db.rollback()
        print(f"Error saving recommendations: {e}")
        
    return new_recs
