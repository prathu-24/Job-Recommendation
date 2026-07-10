from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.schemas.job import JobOut

class ApplicationBase(BaseModel):
    candidate_id: int
    job_id: int
    application_status: str

class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationUpdate(BaseModel):
    application_status: str

class ApplicationOut(ApplicationBase):
    id: int
    created_at: datetime
    job: Optional[JobOut] = None

    class Config:
        from_attributes = True
        # Pydantic v2 configuration
