from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class JobBase(BaseModel):
    company: str
    title: str
    description: str
    required_skills: str # Comma-separated list
    location: Optional[str] = None
    salary: Optional[str] = None
    experience_required: int = 0

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    experience_required: Optional[int] = None

class JobOut(JobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        # Pydantic v2 configuration
