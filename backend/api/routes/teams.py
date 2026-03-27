"""
HireSense AI — Team Analysis Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db

router = APIRouter()


@router.post("/teams/analyze")
async def analyze_team():
    """Analyze team skill gaps (placeholder — implemented in Phase 4)."""
    return {
        "message": "Team analysis not implemented yet",
        "status": "pending",
        "hint": "This endpoint will accept team skills + project requirements in Phase 4",
    }


@router.get("/teams/history")
async def get_team_history(db: Session = Depends(get_db)):
    """Get list of past team analyses."""
    from backend.models.team import TeamAnalysis

    analyses = db.query(TeamAnalysis).order_by(
        TeamAnalysis.created_at.desc()
    ).all()

    return [
        {
            "id": a.id,
            "team_name": a.team_name,
            "coverage_score": a.coverage_score,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


@router.get("/teams/{analysis_id}")
async def get_team_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get a specific team analysis by ID."""
    from backend.models.team import TeamAnalysis
    import json

    analysis = db.query(TeamAnalysis).filter(
        TeamAnalysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "id": analysis.id,
        "team_name": analysis.team_name,
        "team_skills": json.loads(analysis.team_skills) if analysis.team_skills else [],
        "project_requirements": json.loads(analysis.project_requirements) if analysis.project_requirements else [],
        "coverage_score": analysis.coverage_score,
        "skill_gaps": json.loads(analysis.skill_gaps) if analysis.skill_gaps else [],
        "hire_plan": json.loads(analysis.hire_plan) if analysis.hire_plan else None,
        "analysis_result": json.loads(analysis.analysis_result) if analysis.analysis_result else None,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }
