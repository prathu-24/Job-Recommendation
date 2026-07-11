import os
from typing import List, Optional
from app.models.job import Job
from app.models.candidate import CandidateProfile

_model = None

def get_embedding_model():
    """Lazy-load the SentenceTransformer model to avoid slowing down startup."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Disable parallel tokenization to avoid warnings/deadlocks
            os.environ["TOKENIZERS_PARALLELISM"] = "false"
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            print("[Embedding Service] SentenceTransformer model 'all-MiniLM-L6-v2' loaded successfully.")
        except Exception as e:
            print(f"[Embedding Service] Failed to load model: {e}")
            raise e
    return _model

def generate_embedding(text: str) -> List[float]:
    """
    Generate a 384-dimensional embedding vector for the given text.
    """
    if not text or not text.strip():
        return [0.0] * 384
        
    model = get_embedding_model()
    try:
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"[Embedding Service] Failed to generate embedding: {e}")
        return [0.0] * 384

def get_job_text_for_embedding(job: Job) -> str:
    """
    Construct a descriptive text representation of a Job object
    suitable for vector embeddings.
    """
    location = job.location or "Remote"
    skills = job.required_skills or "None"
    return f"Job Title: {job.title}. Company: {job.company}. Location: {location}. Required Skills: {skills}. Description: {job.description}"

def get_candidate_text_for_embedding(profile: CandidateProfile) -> str:
    """
    Construct a descriptive text representation of a CandidateProfile object
    suitable for vector embeddings.
    """
    skills = profile.skills or ""
    experience = profile.experience or ""
    education = profile.education or ""
    projects = profile.projects or ""
    certifications = profile.certifications or ""
    
    parts = []
    if skills:
        parts.append(f"Skills: {skills}")
    if experience:
        parts.append(f"Experience: {experience}")
    if education:
        parts.append(f"Education: {education}")
    if projects:
        parts.append(f"Projects: {projects}")
    if certifications:
        parts.append(f"Certifications: {certifications}")
        
    return " ".join(parts) if parts else "No candidate profile data available"
