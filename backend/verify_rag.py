import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.candidate import CandidateProfile
from app.services.embedding_service import generate_embedding, get_candidate_text_for_embedding
from app.services.vector_search_service import search_similar_jobs
from app.services.rag_service import generate_rag_recommendations

def test_rag_pipeline():
    print("==================================================")
    print("  Testing RAG-Powered Job Recommendation System")
    print("==================================================")
    
    db = SessionLocal()
    try:
        # Fetch the first candidate
        candidate = db.query(CandidateProfile).first()
        if not candidate:
            print("No candidates found in the database. Please register/upload a resume first.")
            return
            
        print(f"Testing for Candidate Profile ID: {candidate.id}")
        print(f"Name extracted: {candidate.name_extracted}")
        print(f"Skills: {candidate.skills}")
        
        # 1. Get/generate candidate embedding
        candidate_text = get_candidate_text_for_embedding(candidate)
        print(f"Candidate text preview: {candidate_text[:150]}...")
        
        embedding_list = None
        if candidate.embedding:
            if isinstance(candidate.embedding, str):
                embedding_list = json.loads(candidate.embedding)
            elif isinstance(candidate.embedding, list):
                embedding_list = candidate.embedding
            else:
                embedding_list = list(candidate.embedding)
        
        if not embedding_list or len(embedding_list) != 384:
            print("Generating embedding dynamically...")
            embedding_list = generate_embedding(candidate_text)
            candidate.embedding = embedding_list
            db.commit()
            db.refresh(candidate)
            
        print("Candidate embedding generated successfully.")
        
        # 2. Search Top 5 semantically similar jobs
        print("\n[Vector Search] Finding top 5 semantically similar jobs...")
        similar_jobs = search_similar_jobs(db, embedding_list, top_k=5)
        
        if not similar_jobs:
            print("No similar jobs found.")
            return
            
        for i, (job, score) in enumerate(similar_jobs):
            print(f"  {i+1}. Job: {job.title} at {job.company} (Score: {round(score * 100, 2)}%)")
            
        # 3. Call RAG service
        print("\n[RAG Service] Generating recommendations using LLM...")
        jobs = [job for job, score in similar_jobs]
        rag_response = generate_rag_recommendations(candidate_text, jobs)
        
        print("\n[RAG Service Response]:")
        print(json.dumps(rag_response, indent=2))
        
    except Exception as e:
        print(f"Pipeline test failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_rag_pipeline()
