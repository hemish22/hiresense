"""
HireSense AI — Candidate Analysis Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.database import get_db

router = APIRouter()


@router.post("/candidates/analyze")
async def analyze_candidate():
    """Analyze a candidate (placeholder — implemented in Phase 2)."""
    return {
        "message": "Candidate analysis not implemented yet",
        "status": "pending",
        "hint": "This endpoint will accept resume PDF + job description in Phase 2",
    }


@router.get("/candidates/history")
async def get_candidate_history(db: Session = Depends(get_db)):
    """Get list of past candidate analyses."""
    from backend.models.candidate import CandidateAnalysis

    analyses = db.query(CandidateAnalysis).order_by(
        CandidateAnalysis.created_at.desc()
    ).all()

    return [
        {
            "id": a.id,
            "candidate_name": a.candidate_name,
            "match_score": a.match_score,
            "overall_score": a.overall_score,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


@router.get("/candidates/{analysis_id}")
async def get_candidate_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get a specific candidate analysis by ID."""
    from backend.models.candidate import CandidateAnalysis
    import json

    analysis = db.query(CandidateAnalysis).filter(
        CandidateAnalysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "id": analysis.id,
        "candidate_name": analysis.candidate_name,
        "email": analysis.email,
        "github_username": analysis.github_username,
        "leetcode_username": analysis.leetcode_username,
        "resume_skills": json.loads(analysis.resume_skills) if analysis.resume_skills else [],
        "job_description": analysis.job_description,
        "match_score": analysis.match_score,
        "learning_ability_score": analysis.learning_ability_score,
        "credibility_score": analysis.credibility_score,
        "overall_score": analysis.overall_score,
        "analysis_result": json.loads(analysis.analysis_result) if analysis.analysis_result else None,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }
