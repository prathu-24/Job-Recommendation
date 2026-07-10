from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    resume_path = Column(String, nullable=True)
    skills = Column(Text, nullable=True)          # Comma-separated list or JSON list of skills
    experience = Column(Text, nullable=True)      # Stored text representation of experience or JSON
    education = Column(Text, nullable=True)       # Stored text representation of education or JSON
    phone = Column(String, nullable=True)
    email_extracted = Column(String, nullable=True)
    name_extracted = Column(String, nullable=True)
    projects = Column(Text, nullable=True)        # Stored text representation of projects
    certifications = Column(Text, nullable=True)  # Stored text representation of certs
    languages = Column(Text, nullable=True)       # Comma-separated list of languages

    # Relationships
    user = relationship("User", back_populates="profile")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="candidate", cascade="all, delete-orphan")
