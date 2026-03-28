"""
HireSense AI — Candidate Analysis Endpoints
Full pipeline: upload resume → parse → fetch GitHub → fetch LeetCode → ML scoring
"""

import os
import json
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.candidate import CandidateAnalysis
from backend.services.resume_parser import ResumeParser
from backend.services.github_analyzer import GitHubAnalyzer
from backend.services.leetcode_analyzer import LeetCodeAnalyzer
from backend.services.scoring_engine import ScoringEngine
from backend.config import settings

router = APIRouter()

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/candidates/analyze")
async def analyze_candidate(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    github_username: Optional[str] = Form(None),
    leetcode_username: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Analyze a candidate: parse resume, fetch GitHub/LeetCode data, run ML scoring.
    """
    # 1. Save uploaded PDF
    timestamp = int(time.time())
    safe_filename = f"{timestamp}_{resume.filename}"
    pdf_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        content = await resume.read()
        with open(pdf_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save file: {str(e)}")

    # 2. Parse resume
    parser = ResumeParser()
    parsed = parser.parse(pdf_path)

    # 3. Resolve usernames — form values override resume-parsed ones
    gh_username = github_username or parsed.get("github_username")
    lc_username = leetcode_username or parsed.get("leetcode_username")

    # 4. Fetch GitHub data (if username available)
    github_result = None
    if gh_username:
        try:
            gh_analyzer = GitHubAnalyzer(token=settings.GITHUB_TOKEN)
            github_result = gh_analyzer.analyze(gh_username)
        except Exception as e:
            github_result = {"error": f"GitHub analysis failed: {str(e)}"}

    # 5. Fetch LeetCode data (if username available)
    leetcode_result = None
    if lc_username:
        try:
            lc_analyzer = LeetCodeAnalyzer()
            leetcode_result = lc_analyzer.analyze(lc_username)
        except Exception as e:
            leetcode_result = {"error": f"LeetCode analysis failed: {str(e)}"}

    # 6. Run ML scoring engine
    scoring_engine = ScoringEngine()
    scoring_result = scoring_engine.score(
        parsed_resume=parsed,
        job_description=job_description,
        github_data=github_result,
        leetcode_data=leetcode_result,
    )

    # 7. Assemble the full analysis result
    analysis_data = {
        "candidate": {
            "name": parsed.get("name"),
            "email": parsed.get("email"),
            "phone": parsed.get("phone"),
            "github_username": gh_username,
            "leetcode_username": lc_username,
            "linkedin_url": parsed.get("linkedin_url"),
            "skills": parsed.get("skills", []),
        },
        "resume_sections": {
            "experience": parsed.get("experience", []),
            "projects": parsed.get("projects", []),
            "education": parsed.get("education", []),
        },
        "github_analysis": github_result,
        "leetcode_analysis": leetcode_result,
        "scoring": scoring_result,
        "job_description": job_description,
    }

    # 8. Save to database with computed scores
    db_record = CandidateAnalysis(
        candidate_name=parsed.get("name"),
        email=parsed.get("email"),
        github_username=gh_username,
        leetcode_username=lc_username,
        resume_skills=json.dumps(parsed.get("skills", [])),
        job_description=job_description,
        match_score=scoring_result["scores"]["match_score"],
        learning_ability_score=scoring_result["scores"]["learning_score"],
        credibility_score=scoring_result["scores"]["credibility_score"],
        overall_score=scoring_result["overall_score"],
        analysis_result=json.dumps(analysis_data, default=str),
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # 9. Build response
    return {
        "id": db_record.id,
        "status": "analyzed",
        "candidate": analysis_data["candidate"],
        "scoring": scoring_result,
        "github_analysis": github_result,
        "leetcode_analysis": leetcode_result,
        "job_description": job_description,
        "message": "Full candidate analysis complete.",
    }


@router.get("/candidates/history")
async def get_candidate_history(db: Session = Depends(get_db)):
    """Get list of past candidate analyses."""
    analyses = db.query(CandidateAnalysis).order_by(
        CandidateAnalysis.created_at.desc()
    ).all()

    return [
        {
            "id": a.id,
            "candidate_name": a.candidate_name,
            "email": a.email,
            "github_username": a.github_username,
            "leetcode_username": a.leetcode_username,
            "match_score": a.match_score,
            "overall_score": a.overall_score,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in analyses
    ]


@router.get("/candidates/{analysis_id}")
async def get_candidate_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get a specific candidate analysis by ID."""
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
