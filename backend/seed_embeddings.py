import sys
import os
# Add backend root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.job import Job
from app.services.embedding_service import generate_embedding, get_job_text_for_embedding

def backfill_job_embeddings():
    """Generate and store embeddings for all jobs currently in the database."""
    print("Starting backfill of job embeddings...")
    db = SessionLocal()
    try:
        jobs = db.query(Job).all()
        print(f"Found {len(jobs)} jobs in the database.")
        
        count = 0
        for job in jobs:
            print(f"Generating embedding for Job ID {job.id}: '{job.title}' at {job.company}...")
            job_text = get_job_text_for_embedding(job)
            embedding = generate_embedding(job_text)
            
            # Save embedding
            job.embedding = embedding
            count += 1
            
        db.commit()
        print(f"Successfully generated and saved embeddings for {count} jobs!")
    except Exception as e:
        db.rollback()
        print(f"An error occurred during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    backfill_job_embeddings()
