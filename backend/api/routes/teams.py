"""
HireSense AI — Team Analysis Endpoints
Full pipeline: team skills → gap analysis → salary → JD generation
Supports both manual skill input and bulk PDF resume upload.
"""

import json
import os
import tempfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.team import TeamAnalysis
from backend.services.team_analyzer import TeamAnalyzer
from backend.services.salary_benchmarker import SalaryBenchmarker
from backend.services.jd_generator import JDGenerator
from backend.services.resume_parser import ResumeParser

router = APIRouter()


class TeamAnalyzeRequest(BaseModel):
    """Request body for team analysis (manual / legacy)."""
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
    Accepts JSON payload with manually specified team skills.
    """
    return _run_team_analysis(
        team_name=request.team_name,
        team_skills=request.team_skills,
        project_requirements=request.project_requirements,
        location=request.location or "bangalore",
        experience=request.experience or "mid",
        db=db,
    )


@router.post("/teams/analyze-bulk")
async def analyze_team_bulk(
    resumes: List[UploadFile] = File(...),
    project_description: str = Form(...),
    market_location: str = Form("bangalore"),
    team_name: str = Form("Uploaded Team"),
    db: Session = Depends(get_db),
):
    """
    Bulk team analysis — upload multiple PDF resumes.
    The backend parses every resume, aggregates all skills,
    and runs the gap analysis against the project description.
    """
    if not resumes:
        raise HTTPException(status_code=400, detail="At least one resume PDF is required.")

    parser = ResumeParser()
    aggregated_skills: set[str] = set()
    member_details: list[dict] = []

    for upload_file in resumes:
        # Validate file type
        if not upload_file.filename or not upload_file.filename.lower().endswith(".pdf"):
            continue  # Skip non-PDF files silently

        # Save to temp file and parse
        try:
            contents = await upload_file.read()
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(contents)
                tmp_path = tmp.name

            parsed = parser.parse(tmp_path)
            skills = parsed.get("skills", [])
            aggregated_skills.update(s.lower().strip() for s in skills)

            member_details.append({
                "filename": upload_file.filename,
                "name": parsed.get("name") or upload_file.filename,
                "skills": skills,
                "skill_count": len(skills),
            })
        except Exception as e:
            member_details.append({
                "filename": upload_file.filename,
                "name": upload_file.filename,
                "skills": [],
                "skill_count": 0,
                "parse_error": str(e),
            })
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    if not aggregated_skills:
        raise HTTPException(
            status_code=400,
            detail="Could not extract any skills from the uploaded resumes. Please check the PDFs.",
        )

    # Use project_description as project requirements
    from backend.services.skill_dictionary import find_skills_in_text
    project_requirements = find_skills_in_text(project_description)
    if not project_requirements:
        # Fallback: split the description into rough phrases
        project_requirements = [
            s.strip() for s in project_description.replace(",", "\n").split("\n") if s.strip()
        ]

    result = _run_team_analysis(
        team_name=team_name,
        team_skills=sorted(aggregated_skills),
        project_requirements=project_requirements,
        location=market_location,
        experience="mid",
        db=db,
    )

    # Enrich response with parsed member data
    result["team_members"] = member_details
    result["total_resumes_parsed"] = len(member_details)
    result["total_unique_skills"] = len(aggregated_skills)

    return result


def _run_team_analysis(
    team_name: str,
    team_skills: list[str],
    project_requirements: list[str],
    location: str,
    experience: str,
    db: Session,
) -> dict:
    """Shared team analysis logic used by both manual and bulk endpoints."""
    # 1. Run team gap analysis
    analyzer = TeamAnalyzer()
    gap_result = analyzer.analyze(
        team_skills=team_skills,
        project_requirements=project_requirements,
        team_name=team_name,
    )

    # 2. Enrich hire plan with salary estimates
    benchmarker = SalaryBenchmarker()
    salary_result = benchmarker.enrich_hire_plan(
        hire_plan=gap_result["hire_plan"],
        location=location,
        experience=experience,
    )

    # 3. Generate JDs for all recommended hires
    generator = JDGenerator()
    jds = generator.generate_all(
        hire_plan=salary_result["hire_plan"],
        team_name=team_name,
    )

    # 4. Assemble full result
    analysis_data = {
        "team_name": team_name,
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
        team_name=team_name,
        team_skills=json.dumps(team_skills),
        project_requirements=json.dumps(project_requirements),
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
