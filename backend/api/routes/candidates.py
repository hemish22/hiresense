"""
HireSense AI — Candidate Analysis Endpoints
Full pipeline: upload resume → parse → fetch GitHub → fetch LeetCode → ML scoring
"""

import os
import re
import json
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.candidate import CandidateAnalysis
from backend.models.job import Job
from backend.services.resume_parser import ResumeParser
from backend.services.github_analyzer import GitHubAnalyzer
from backend.services.leetcode_analyzer import LeetCodeAnalyzer
from backend.services.scoring_engine import ScoringEngine
from backend.services.constellation import build_constellation
from backend.services.ai_summary import generate_ai_summary
from backend.services.matching import requirements_from_text, match_score
from backend.config import settings
from pydantic import BaseModel

router = APIRouter()

# Valid hiring pipeline stages
PIPELINE_STAGES = ["applied", "shortlisted", "interview", "offer", "hired", "rejected"]


class StatusUpdate(BaseModel):
    status: str

# Ensure upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_UPLOAD_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


async def _save_upload(resume: UploadFile, prefix: str = "") -> str:
    """
    Validate and persist an uploaded resume PDF.
    Guards against non-PDFs, oversized files, and path-traversal filenames.
    """
    raw_name = os.path.basename(resume.filename or "resume.pdf")
    if not raw_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are accepted.")

    content = await resume.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB} MB.",
        )

    # Strip anything that isn't a safe filename character
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", raw_name)
    path = os.path.join(UPLOAD_DIR, f"{prefix}{int(time.time())}_{safe_name}")
    try:
        with open(path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save file: {str(e)}")
    return path


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
    pdf_path = await _save_upload(resume)

    return _evaluate_and_store(
        pdf_path=pdf_path,
        job_description=job_description,
        github_username=github_username,
        leetcode_username=leetcode_username,
        applied_job=None,
        db=db,
    )


def _evaluate_and_store(
    pdf_path: str,
    job_description: str,
    github_username: Optional[str],
    leetcode_username: Optional[str],
    applied_job: Optional[dict],
    db: Session,
) -> dict:
    """
    Shared candidate evaluation pipeline: parse resume, fetch GitHub/LeetCode,
    run ML scoring, persist, and return the response payload. Used by both the
    recruiter analyze endpoint and the public applicant apply endpoint.
    """
    # Parse resume
    parser = ResumeParser()
    parsed = parser.parse(pdf_path)

    # Resolve usernames — explicit values override resume-parsed ones
    gh_username = github_username or parsed.get("github_username")
    lc_username = leetcode_username or parsed.get("leetcode_username")

    # Fetch GitHub data (if username available)
    github_result = None
    if gh_username:
        try:
            gh_analyzer = GitHubAnalyzer(token=settings.GITHUB_TOKEN)
            github_result = gh_analyzer.analyze(gh_username)
        except Exception as e:
            github_result = {"error": f"GitHub analysis failed: {str(e)}"}

    # Fetch LeetCode data (if username available)
    leetcode_result = None
    if lc_username:
        try:
            lc_analyzer = LeetCodeAnalyzer()
            leetcode_result = lc_analyzer.analyze(lc_username)
        except Exception as e:
            leetcode_result = {"error": f"LeetCode analysis failed: {str(e)}"}

    # Run ML scoring engine
    scoring_engine = ScoringEngine()
    scoring_result = scoring_engine.score(
        parsed_resume=parsed,
        job_description=job_description,
        github_data=github_result,
        leetcode_data=leetcode_result,
    )

    # Assemble the full analysis result
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
        "applied_job": applied_job,
    }

    # Save to database with computed scores
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

    return {
        "id": db_record.id,
        "status": "analyzed",
        "candidate": analysis_data["candidate"],
        "scoring": scoring_result,
        "github_analysis": github_result,
        "leetcode_analysis": leetcode_result,
        "job_description": job_description,
        "applied_job": applied_job,
        "message": "Full candidate analysis complete.",
    }


@router.post("/candidates/apply")
async def apply_candidate(
    resume: UploadFile = File(...),
    job_id: Optional[int] = Form(None),
    github_username: Optional[str] = Form(None),
    leetcode_username: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Public applicant endpoint. A candidate submits a resume (optionally for a
    specific job). The full evaluation runs immediately and is stored so it
    appears in the recruiter's talent map instantly.
    """
    # Resolve the job / JD
    job = None
    if job_id is not None:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job posting not found")
    else:
        # Default to the year-round open application posting
        job = (
            db.query(Job)
            .filter(Job.is_open_application == True)  # noqa: E712
            .first()
        )

    if not job:
        raise HTTPException(status_code=400, detail="No job posting available to apply to.")

    applied_job = {"id": job.id, "title": job.title, "department": job.department}

    pdf_path = await _save_upload(resume, prefix="apply_")

    result = _evaluate_and_store(
        pdf_path=pdf_path,
        job_description=job.jd_text,
        github_username=github_username,
        leetcode_username=leetcode_username,
        applied_job=applied_job,
        db=db,
    )

    # Applicant-facing response — don't leak internal scoring detail
    return {
        "status": "received",
        "candidate_name": result["candidate"].get("name"),
        "applied_job": applied_job,
        "message": "Application received. Our team will review your profile.",
    }


@router.get("/candidates/constellation")
async def candidates_constellation(db: Session = Depends(get_db)):
    """
    3D semantic map of every analyzed candidate for the recruiter talent graph.
    Positions by skill-embedding similarity (PCA), colored by dominant field.
    """
    rows = db.query(CandidateAnalysis).order_by(CandidateAnalysis.created_at.desc()).all()
    candidates = []
    for a in rows:
        try:
            skills = json.loads(a.resume_skills) if a.resume_skills else []
        except Exception:
            skills = []
        applied_title = None
        domain_text = ""
        try:
            blob = json.loads(a.analysis_result) if a.analysis_result else {}
            aj = blob.get("applied_job") or {}
            applied_title = aj.get("title")
            # Section text helps classify into industry/project domains
            sections = blob.get("resume_sections") or {}
            parts = []
            for key in ("experience", "projects", "education"):
                for entry in sections.get(key, []) or []:
                    if isinstance(entry, dict):
                        parts.append(str(entry.get("title", "")))
                        parts.append(str(entry.get("description", "")))
            parts.append(blob.get("job_description", "") or "")
            domain_text = " ".join(parts)
        except Exception:
            pass
        candidates.append({
            "id": a.id,
            "name": a.candidate_name or a.email or f"Candidate #{a.id}",
            "skills": skills,
            "text": domain_text,
            "score": round((a.overall_score or 0)),
            "match_score": round((a.match_score or 0)),
            "github_username": a.github_username,
            "leetcode_username": a.leetcode_username,
            "applied_job": applied_title,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    return build_constellation(candidates)


@router.get("/candidates/search")
async def search_candidates(q: str = "", db: Session = Depends(get_db)):
    """
    Natural-language candidate search, e.g. "react dev with strong dsa".
    Ranks the pool by skill overlap with skills extracted from the query.
    """
    required = requirements_from_text(q)
    rows = db.query(CandidateAnalysis).order_by(CandidateAnalysis.created_at.desc()).all()
    results = []
    q_lower = (q or "").lower()
    for a in rows:
        try:
            skills = json.loads(a.resume_skills) if a.resume_skills else []
        except Exception:
            skills = []
        m = match_score(skills, required) if required else {"score": 0, "matched": [], "missing": []}
        # Light name/skill text bonus so plain-text queries still rank
        name_hit = q_lower and q_lower in (a.candidate_name or "").lower()
        rank = m["score"] + (15 if name_hit else 0)
        if required or name_hit:
            results.append({
                "id": a.id,
                "name": a.candidate_name or a.email or f"Candidate #{a.id}",
                "overall_score": round(a.overall_score or 0),
                "status": a.status or "applied",
                "fit": m["score"],
                "matched": m["matched"],
                "_rank": rank,
            })
    results.sort(key=lambda r: r["_rank"], reverse=True)
    for r in results:
        r.pop("_rank", None)
    return {"query": q, "required_skills": required, "results": results}


@router.get("/candidates/status")
async def candidate_status_lookup(email: str = "", db: Session = Depends(get_db)):
    """Applicant-facing: look up application status by email."""
    if not email.strip():
        raise HTTPException(status_code=400, detail="Email required")
    rows = (
        db.query(CandidateAnalysis)
        .filter(CandidateAnalysis.email.ilike(email.strip()))
        .order_by(CandidateAnalysis.created_at.desc())
        .all()
    )
    applications = []
    for a in rows:
        applied_title = None
        try:
            blob = json.loads(a.analysis_result) if a.analysis_result else {}
            applied_title = (blob.get("applied_job") or {}).get("title")
        except Exception:
            pass
        applications.append({
            "id": a.id,
            "role": applied_title or "Open Application",
            "status": a.status or "applied",
            "submitted_at": a.created_at.isoformat() if a.created_at else None,
        })
    return {"email": email, "count": len(applications), "applications": applications}


@router.patch("/candidates/{analysis_id}/status")
async def update_candidate_status(
    analysis_id: int, body: StatusUpdate, db: Session = Depends(get_db)
):
    """Move a candidate to a different hiring-pipeline stage."""
    if body.status not in PIPELINE_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use one of {PIPELINE_STAGES}")
    a = db.query(CandidateAnalysis).filter(CandidateAnalysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Candidate not found")
    a.status = body.status
    db.commit()
    return {"id": a.id, "status": a.status}


@router.delete("/candidates/{analysis_id}")
async def delete_candidate(analysis_id: int, db: Session = Depends(get_db)):
    """Remove a candidate from the pipeline."""
    a = db.query(CandidateAnalysis).filter(CandidateAnalysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(a)
    db.commit()
    return {"deleted": analysis_id}


@router.get("/candidates/{analysis_id}/ai-summary")
async def candidate_ai_summary(analysis_id: int, db: Session = Depends(get_db)):
    """Generate a short hire verdict for a candidate (Groq, template fallback)."""
    a = db.query(CandidateAnalysis).filter(CandidateAnalysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Candidate not found")
    try:
        blob = json.loads(a.analysis_result) if a.analysis_result else {}
    except Exception:
        blob = {}
    return generate_ai_summary(blob)


@router.get("/candidates/history")
async def get_candidate_history(db: Session = Depends(get_db)):
    """Get list of past candidate analyses."""
    from backend.services.constellation import _classify

    analyses = db.query(CandidateAnalysis).order_by(
        CandidateAnalysis.created_at.desc()
    ).all()

    out = []
    for a in analyses:
        try:
            skills = json.loads(a.resume_skills) if a.resume_skills else []
        except Exception:
            skills = []
        field, label = _classify({"skills": skills})
        out.append({
            "id": a.id,
            "candidate_name": a.candidate_name,
            "email": a.email,
            "github_username": a.github_username,
            "leetcode_username": a.leetcode_username,
            "match_score": round(a.match_score or 0),
            "overall_score": round(a.overall_score or 0),
            "status": a.status or "applied",
            "field": field,
            "field_label": label,
            "top_skills": [s for s in skills[:5]],
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return out


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
