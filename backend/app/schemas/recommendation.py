from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.schemas.job import JobOut

class RecommendationBase(BaseModel):
    candidate_id: int
    job_id: int
    similarity_score: float
    match_details: Optional[str] = None # JSON string

class RecommendationOut(RecommendationBase):
    id: int
    created_at: datetime
    job: Optional[JobOut] = None

    class Config:
        from_attributes = True
        # Pydantic v2 configuration
class DashboardStats(BaseModel):
    total_users: int
    total_jobs: int
    total_applications: int
    total_recommendations: int
