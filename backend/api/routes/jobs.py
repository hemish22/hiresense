"""
HireSense AI — Job Posting Endpoints
Public listing of open roles for the applicant portal.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import json

from backend.models.database import get_db
from backend.models.job import Job
from backend.models.candidate import CandidateAnalysis
from backend.services.matching import requirements_from_text, match_score

router = APIRouter()


def _serialize(job: Job) -> dict:
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "location": job.location,
        "employment_type": job.employment_type,
        "jd_text": job.jd_text,
        "is_open_application": job.is_open_application,
    }


@router.get("/jobs")
async def list_jobs(db: Session = Depends(get_db)):
    """List active job postings (open application first)."""
    jobs = (
        db.query(Job)
        .filter(Job.is_active == True)  # noqa: E712
        .order_by(Job.is_open_application.desc(), Job.id.asc())
        .all()
    )
    return [_serialize(j) for j in jobs]


@router.get("/jobs/{job_id}")
async def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a single job posting."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize(job)


@router.get("/jobs/{job_id}/candidates")
async def rank_candidates_for_job(job_id: int, db: Session = Depends(get_db)):
    """
    Rank every analyzed candidate by fit to this job's required skills.
    Closes the loop: applicants apply → recruiter sees a ranked shortlist.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    required = requirements_from_text(job.jd_text)
    rows = db.query(CandidateAnalysis).order_by(CandidateAnalysis.created_at.desc()).all()

    ranked = []
    for a in rows:
        try:
            skills = json.loads(a.resume_skills) if a.resume_skills else []
        except Exception:
            skills = []
        m = match_score(skills, required)
        ranked.append({
            "id": a.id,
            "name": a.candidate_name or a.email or f"Candidate #{a.id}",
            "overall_score": round(a.overall_score or 0),
            "status": a.status or "applied",
            "fit": m["score"],
            "matched": m["matched"],
            "missing": m["missing"][:6],
        })

    ranked.sort(key=lambda r: (r["fit"], r["overall_score"]), reverse=True)
    return {
        "job": _serialize(job),
        "required_skills": required,
        "candidates": ranked,
    }
