from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class ApplicationStatus:
    APPLIED = "applied"
    REVIEWED = "reviewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    application_status = Column(String, default=ApplicationStatus.APPLIED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="applications")
    job = relationship("Job", back_populates="applications")
