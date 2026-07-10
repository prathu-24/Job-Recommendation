from typing import Optional, List
from pydantic import BaseModel, EmailStr

class CandidateProfileBase(BaseModel):
    resume_path: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    phone: Optional[str] = None
    email_extracted: Optional[EmailStr] = None
    name_extracted: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    languages: Optional[str] = None

class CandidateProfileCreate(BaseModel):
    user_id: int
    resume_path: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None

class CandidateProfileUpdate(BaseModel):
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    phone: Optional[str] = None
    email_extracted: Optional[EmailStr] = None
    name_extracted: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    languages: Optional[str] = None

class CandidateProfileOut(CandidateProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
