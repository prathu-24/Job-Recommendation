import json
from typing import List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.job import Job
from app.database.session import PGVECTOR_SUPPORTED
import numpy as np

def calculate_cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Helper to compute cosine similarity between two vector lists."""
    if not v1 or not v2:
        return 0.0
    arr1 = np.array(v1, dtype=np.float32)
    arr2 = np.array(v2, dtype=np.float32)
    norm1 = np.linalg.norm(arr1)
    norm2 = np.linalg.norm(arr2)
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return float(np.dot(arr1, arr2) / (norm1 * norm2))

def search_similar_jobs(db: Session, query_embedding: List[float], top_k: int = 5) -> List[Tuple[Job, float]]:
    """
    Find top_k jobs semantically similar to the query embedding.
    Uses PostgreSQL pgvector if supported, otherwise falls back to Python-based similarity search.
    """
    if PGVECTOR_SUPPORTED:
        try:
            # PostgreSQL pgvector similarity search
            # cosine_distance = <=> operator in SQL
            distance_expr = Job.embedding.cosine_distance(query_embedding)
            results = (
                db.query(Job, (1.0 - distance_expr).label("similarity"))
                .filter(Job.embedding != None)
                .order_by(distance_expr)
                .limit(top_k)
                .all()
            )
            return [(job, float(score)) for job, score in results]
        except Exception as e:
            print(f"[Vector Search] pgvector search failed: {e}. Falling back to Python search.")
            # Fall back to python-based search if something goes wrong
            
    # Fallback search (either PostgreSQL array fallback, SQLite fallback, or failed pgvector query)
    try:
        all_jobs = db.query(Job).all()
        jobs_with_scores = []
        
        for job in all_jobs:
            if not job.embedding:
                continue
                
            # Decode embedding based on format stored
            emb_list = None
            if isinstance(job.embedding, str):
                try:
                    # SQLite stores it as a JSON/Text string
                    emb_list = json.loads(job.embedding)
                except Exception:
                    # Comma-separated fallback
                    try:
                        emb_list = [float(x) for x in job.embedding.split(",") if x.strip()]
                    except Exception:
                        pass
            elif isinstance(job.embedding, list):
                # Already a list (ARRAY(Float) mapping in SQLAlchemy/Postgres)
                emb_list = job.embedding
            else:
                # Other formats (e.g. pgvector vector object or array representation)
                try:
                    # If pgvector is installed, it may return a numpy array or vector object
                    emb_list = list(job.embedding)
                except Exception:
                    pass
                    
            if not emb_list or len(emb_list) != len(query_embedding):
                continue
                
            score = calculate_cosine_similarity(query_embedding, emb_list)
            # Normalize to [0, 1] range
            score = max(0.0, min(1.0, score))
            jobs_with_scores.append((job, score))
            
        # Sort by similarity score descending
        jobs_with_scores.sort(key=lambda x: x[1], reverse=True)
        return jobs_with_scores[:top_k]
    except Exception as e:
        print(f"[Vector Search] Fallback search failed: {e}")
        return []
