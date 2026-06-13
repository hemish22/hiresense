"""
HireSense AI — Candidate Analysis Model
Stores results of individual candidate evaluations.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime

from backend.models.database import Base


class CandidateAnalysis(Base):
    """Stores a complete candidate analysis result."""

    __tablename__ = "candidate_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Candidate identity
    candidate_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    github_username = Column(String(255), nullable=True)
    leetcode_username = Column(String(255), nullable=True)

    # Extracted data (JSON strings)
    resume_skills = Column(Text, nullable=True)  # JSON array of skills
    job_description = Column(Text, nullable=True)

    # Hiring pipeline stage
    status = Column(String(32), nullable=True, default="applied")

    # Scores (0.0 - 1.0)
    match_score = Column(Float, nullable=True)
    learning_ability_score = Column(Float, nullable=True)
    credibility_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)

    # Full analysis result (JSON blob with all details)
    analysis_result = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CandidateAnalysis(id={self.id}, name='{self.candidate_name}', score={self.overall_score})>"
