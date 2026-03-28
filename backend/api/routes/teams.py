"""
HireSense AI — Team Analysis Endpoints
Full pipeline: team skills → gap analysis → salary → JD generation
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.team import TeamAnalysis
from backend.services.team_analyzer import TeamAnalyzer
from backend.services.salary_benchmarker import SalaryBenchmarker
from backend.services.jd_generator import JDGenerator

router = APIRouter()


class TeamAnalyzeRequest(BaseModel):
    """Request body for team analysis."""
    team_name: str
    team_skills: List[str]
    project_requirements: List[str]
    location: Optional[str] = "bangalore"
    experience: Optional[str] = "mid"


@router.post("/teams/analyze")
async def analyze_team(
    request: TeamAnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze team skill gaps and generate hire plan with salary + JDs.
    """
    # 1. Run team gap analysis
    analyzer = TeamAnalyzer()
    gap_result = analyzer.analyze(
        team_skills=request.team_skills,
        project_requirements=request.project_requirements,
        team_name=request.team_name,
    )

    # 2. Enrich hire plan with salary estimates
    benchmarker = SalaryBenchmarker()
    salary_result = benchmarker.enrich_hire_plan(
        hire_plan=gap_result["hire_plan"],
        location=request.location or "bangalore",
        experience=request.experience or "mid",
    )

    # 3. Generate JDs for all recommended hires
    generator = JDGenerator()
    jds = generator.generate_all(
        hire_plan=salary_result["hire_plan"],
        team_name=request.team_name,
    )

    # 4. Assemble full result
    analysis_data = {
        "team_name": request.team_name,
        "coverage_score": gap_result["coverage_score"],
        "gap_summary": gap_result["gap_summary"],
        "covered_skills": gap_result["covered_skills"],
        "gap_clusters": gap_result["gap_clusters"],
        "hire_plan": salary_result["hire_plan"],
        "budget_impact": salary_result["budget_impact"],
        "job_descriptions": jds,
        "explanation": gap_result["explanation"],
    }

    # 5. Save to database
    db_record = TeamAnalysis(
        team_name=request.team_name,
        team_skills=json.dumps(request.team_skills),
        project_requirements=json.dumps(request.project_requirements),
        coverage_score=gap_result["coverage_score"],
        skill_gaps=json.dumps(gap_result["gap_clusters"], default=str),
        hire_plan=json.dumps(salary_result["hire_plan"], default=str),
        analysis_result=json.dumps(analysis_data, default=str),
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # 6. Return response
    return {
        "id": db_record.id,
        "status": "analyzed",
        **analysis_data,
    }


@router.get("/teams/history")
async def get_team_history(db: Session = Depends(get_db)):
    """Get list of past team analyses."""
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
