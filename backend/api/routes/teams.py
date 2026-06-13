"""
HireSense AI — Team Analysis Endpoints
Full pipeline: per-member skills → gap analysis → JD generation
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
from backend.services.jd_generator import JDGenerator
from backend.services.resume_parser import ResumeParser
from backend.services.skill_dictionary import find_skills_in_text

router = APIRouter()


class TeamMemberInput(BaseModel):
    """A single team member with their skills."""
    name: str
    skills: List[str]


class TeamAnalyzeRequest(BaseModel):
    """Request body for team analysis (manual / legacy)."""
    team_name: str
    # Either supply structured members, or a flat skill list (legacy).
    members: Optional[List[TeamMemberInput]] = None
    team_skills: Optional[List[str]] = None
    project_requirements: List[str]


class SimulateRequest(BaseModel):
    """What-if simulation — recompute coverage for an edited roster."""
    team_name: Optional[str] = "What-if Team"
    members: List[TeamMemberInput]
    project_requirements: List[str]


def _requirements_from_text(text: str) -> List[str]:
    """Extract required skills from a free-text project description."""
    reqs = find_skills_in_text(text)
    if not reqs:
        reqs = [s.strip() for s in text.replace(",", "\n").split("\n") if s.strip()]
    return reqs


@router.post("/teams/analyze")
async def analyze_team(
    request: TeamAnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze team skill gaps and generate a hire plan + JDs.
    Accepts either structured members or a flat skill list (legacy).
    """
    if request.members:
        members = [{"name": m.name, "skills": m.skills} for m in request.members]
    elif request.team_skills:
        members = [{"name": request.team_name or "Team", "skills": request.team_skills}]
    else:
        raise HTTPException(status_code=400, detail="Provide either members or team_skills.")

    return _run_team_analysis(
        team_name=request.team_name,
        members=members,
        project_requirements=request.project_requirements,
        db=db,
    )


@router.post("/teams/simulate")
async def simulate_team(request: SimulateRequest):
    """
    Lightweight what-if: recompute coverage for an edited roster without
    persisting or generating JDs. Powers the interactive team editor.
    """
    members = [{"name": m.name, "skills": m.skills} for m in request.members]
    analyzer = TeamAnalyzer()
    result = analyzer.analyze(
        members=members,
        project_requirements=request.project_requirements,
        team_name=request.team_name or "What-if Team",
    )
    # Trim to what the editor needs
    return {
        "coverage_score": result["coverage_score"],
        "weighted_coverage_score": result["weighted_coverage_score"],
        "gap_summary": result["gap_summary"],
        "gap_clusters": result["gap_clusters"],
        "domain_coverage": result["domain_coverage"],
        "bus_factor": result["bus_factor"],
    }


@router.post("/teams/analyze-bulk")
async def analyze_team_bulk(
    resumes: List[UploadFile] = File(...),
    project_description: str = Form(...),
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

    # Build per-member roster from parsed resumes
    members = [
        {"name": m["name"], "skills": m["skills"]}
        for m in member_details
        if m["skills"]
    ]
    if not members:
        raise HTTPException(
            status_code=400,
            detail="Could not extract any skills from the uploaded resumes. Please check the PDFs.",
        )

    project_requirements = _requirements_from_text(project_description)

    result = _run_team_analysis(
        team_name=team_name,
        members=members,
        project_requirements=project_requirements,
        db=db,
    )

    # Enrich response with parsed member data
    unique_skills = {s.lower().strip() for m in members for s in m["skills"]}
    result["team_members"] = member_details
    result["total_resumes_parsed"] = len(member_details)
    result["total_unique_skills"] = len(unique_skills)

    return result


def _run_team_analysis(
    team_name: str,
    members: list[dict],
    project_requirements: list[str],
    db: Session,
) -> dict:
    """Shared team analysis logic used by both manual and bulk endpoints."""
    # 1. Run team gap analysis (per-member model)
    analyzer = TeamAnalyzer()
    gap_result = analyzer.analyze(
        members=members,
        project_requirements=project_requirements,
        team_name=team_name,
    )

    # 2. Generate JDs for all recommended hires
    generator = JDGenerator()
    jds = generator.generate_all(
        hire_plan=gap_result["hire_plan"],
        team_name=team_name,
    )

    # 3. Assemble full result
    analysis_data = {
        "team_name": team_name,
        "coverage_score": gap_result["coverage_score"],
        "weighted_coverage_score": gap_result["weighted_coverage_score"],
        "gap_summary": gap_result["gap_summary"],
        "covered_skills": gap_result["covered_skills"],
        "gap_clusters": gap_result["gap_clusters"],
        "domain_coverage": gap_result["domain_coverage"],
        "bus_factor": gap_result["bus_factor"],
        "upskill_suggestions": gap_result["upskill_suggestions"],
        "hire_plan": gap_result["hire_plan"],
        "job_descriptions": jds,
        "explanation": gap_result["explanation"],
        "members": members,
    }

    # 4. Save to database
    flat_skills = sorted({s for m in members for s in m["skills"]})
    db_record = TeamAnalysis(
        team_name=team_name,
        team_skills=json.dumps(flat_skills),
        project_requirements=json.dumps(project_requirements),
        coverage_score=gap_result["coverage_score"],
        skill_gaps=json.dumps(gap_result["gap_clusters"], default=str),
        hire_plan=json.dumps(gap_result["hire_plan"], default=str),
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
