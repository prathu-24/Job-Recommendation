"""
Qdrant Vector Database Service
Provides semantic vector search for resumes and jobs using sentence-transformers embeddings.
Gracefully degrades if Qdrant is unavailable — the app still functions without it.
"""
import os
from typing import List, Dict, Any, Optional
from app.core.config import settings

# Lazy-load heavy imports
_qdrant_client = None
_model = None
_initialized = False
_available = False

VECTOR_DIM = 384  # Dimension for all-MiniLM-L6-v2

def _get_model():
    """Lazy-load the SentenceTransformer model (shared with matcher.py)."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            os.environ["TOKENIZERS_PARALLELISM"] = "false"
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            print(f"[Qdrant Service] Failed to load embedding model: {e}")
    return _model

def _get_client():
    """Lazy-initialize Qdrant client and create collection if needed."""
    global _qdrant_client, _initialized, _available
    
    if _initialized:
        return _qdrant_client if _available else None
    
    _initialized = True
    
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import VectorParams, Distance
        
        api_key = settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
        if settings.QDRANT_URL:
            _qdrant_client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=api_key,
                timeout=10
            )
            print(f"[Qdrant Service] Connected to Qdrant Cloud at {settings.QDRANT_URL}")
        else:
            _qdrant_client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=api_key,
                timeout=5
            )
            print(f"[Qdrant Service] Connected to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
        
        # Create collection if it doesn't exist
        collections = _qdrant_client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if settings.QDRANT_COLLECTION_NAME not in collection_names:
            _qdrant_client.create_collection(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=VECTOR_DIM,
                    distance=Distance.COSINE
                )
            )
            print(f"[Qdrant Service] Created collection '{settings.QDRANT_COLLECTION_NAME}'")
            
        _available = True
    except Exception as e:
        print(f"[Qdrant Service] Qdrant unavailable (app will work without it): {e}")
        _qdrant_client = None
        _available = False
    
    return _qdrant_client if _available else None

def _encode_text(text: str) -> Optional[List[float]]:
    """Encode text to a vector embedding."""
    model = _get_model()
    if model is None:
        return None
    try:
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"[Qdrant Service] Encoding error: {e}")
        return None

def upsert_resume_embedding(candidate_id: int, text: str) -> bool:
    """Store/update a resume embedding in Qdrant."""
    client = _get_client()
    if client is None:
        return False
    
    vector = _encode_text(text)
    if vector is None:
        return False
    
    try:
        from qdrant_client.models import PointStruct
        
        point = PointStruct(
            id=candidate_id + 1_000_000,  # Offset to avoid ID collision with jobs
            vector=vector,
            payload={
                "type": "resume",
                "candidate_id": candidate_id,
                "text_preview": text[:500]
            }
        )
        
        client.upsert(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points=[point]
        )
        print(f"[Qdrant Service] Indexed resume for candidate {candidate_id}")
        return True
    except Exception as e:
        print(f"[Qdrant Service] Failed to upsert resume: {e}")
        return False

def upsert_job_embedding(job_id: int, text: str) -> bool:
    """Store/update a job embedding in Qdrant."""
    client = _get_client()
    if client is None:
        return False
    
    vector = _encode_text(text)
    if vector is None:
        return False
    
    try:
        from qdrant_client.models import PointStruct
        
        point = PointStruct(
            id=job_id,
            vector=vector,
            payload={
                "type": "job",
                "job_id": job_id,
                "text_preview": text[:500]
            }
        )
        
        client.upsert(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points=[point]
        )
        print(f"[Qdrant Service] Indexed job {job_id}")
        return True
    except Exception as e:
        print(f"[Qdrant Service] Failed to upsert job: {e}")
        return False

def search_similar_jobs(query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Find jobs semantically similar to the query text."""
    client = _get_client()
    if client is None:
        return []
    
    vector = _encode_text(query_text)
    if vector is None:
        return []
    
    try:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        
        results = client.search(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            query_vector=vector,
            query_filter=Filter(
                must=[FieldCondition(key="type", match=MatchValue(value="job"))]
            ),
            limit=top_k
        )
        
        return [
            {
                "job_id": hit.payload.get("job_id"),
                "score": round(hit.score, 4),
                "text_preview": hit.payload.get("text_preview", "")
            }
            for hit in results
        ]
    except Exception as e:
        print(f"[Qdrant Service] Search error: {e}")
        return []

def search_similar_candidates(query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Find candidates semantically similar to the query text."""
    client = _get_client()
    if client is None:
        return []
    
    vector = _encode_text(query_text)
    if vector is None:
        return []
    
    try:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        
        results = client.search(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            query_vector=vector,
            query_filter=Filter(
                must=[FieldCondition(key="type", match=MatchValue(value="resume"))]
            ),
            limit=top_k
        )
        
        return [
            {
                "candidate_id": hit.payload.get("candidate_id"),
                "score": round(hit.score, 4),
                "text_preview": hit.payload.get("text_preview", "")
            }
            for hit in results
        ]
    except Exception as e:
        print(f"[Qdrant Service] Search error: {e}")
        return []

def is_available() -> bool:
    """Check if Qdrant service is available."""
    return _get_client() is not None
