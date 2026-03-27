"""
HireSense AI — Team Analysis Model
Stores results of team skill gap analyses.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime

from backend.models.database import Base


class TeamAnalysis(Base):
    """Stores a complete team skill gap analysis result."""

    __tablename__ = "team_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Team identity
    team_name = Column(String(255), nullable=False)

    # Input data (JSON strings)
    team_skills = Column(Text, nullable=True)  # JSON array of skills
    project_requirements = Column(Text, nullable=True)  # JSON array of requirements

    # Scores
    coverage_score = Column(Float, nullable=True)  # 0.0 - 1.0

    # Analysis results (JSON strings)
    skill_gaps = Column(Text, nullable=True)  # JSON array of gaps
    hire_plan = Column(Text, nullable=True)  # JSON hire plan
    analysis_result = Column(Text, nullable=True)  # Full JSON blob

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<TeamAnalysis(id={self.id}, team='{self.team_name}', coverage={self.coverage_score})>"
