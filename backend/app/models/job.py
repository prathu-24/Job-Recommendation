from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base, get_vector_type

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=False) # Comma-separated required skills
    location = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    experience_required = Column(Integer, default=0) # Years of experience required
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    embedding = Column(get_vector_type(384), nullable=True)

    # Relationships
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="job", cascade="all, delete-orphan")
