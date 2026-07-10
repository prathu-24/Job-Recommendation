from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    match_details = Column(Text, nullable=True) # JSON details (skills_score, exp_score, edu_score, kw_score)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="recommendations")
    job = relationship("Job", back_populates="recommendations")
