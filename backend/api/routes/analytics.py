"""
HireSense AI — Recruiter Analytics
Pipeline overview + talent supply vs open-role demand.
"""

import json
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.candidate import CandidateAnalysis
from backend.models.job import Job
from backend.services.constellation import _classify, _DOMAIN_LABEL

router = APIRouter()

_STAGES = ["applied", "shortlisted", "interview", "offer", "hired", "rejected"]


@router.get("/analytics/overview")
async def analytics_overview(db: Session = Depends(get_db)):
    candidates = db.query(CandidateAnalysis).all()
    jobs = db.query(Job).filter(Job.is_active == True).all()  # noqa: E712

    total = len(candidates)
    overall_scores = [c.overall_score or 0 for c in candidates]
    match_scores = [c.match_score or 0 for c in candidates]

    # Score distribution buckets
    buckets = [0, 0, 0, 0, 0]  # 0-20,20-40,40-60,60-80,80-100
    for s in overall_scores:
        idx = min(int(s // 20), 4)
        buckets[idx] += 1
    score_distribution = [
        {"range": "0-20", "count": buckets[0]},
        {"range": "20-40", "count": buckets[1]},
        {"range": "40-60", "count": buckets[2]},
        {"range": "60-80", "count": buckets[3]},
        {"range": "80-100", "count": buckets[4]},
    ]

    # Status breakdown
    status_counts = Counter((c.status or "applied") for c in candidates)
    by_status = [{"status": s, "count": status_counts.get(s, 0)} for s in _STAGES]

    # Applicant supply by domain
    supply = Counter()
    for c in candidates:
        try:
            skills = json.loads(c.resume_skills) if c.resume_skills else []
        except Exception:
            skills = []
        field, _ = _classify({"skills": skills})
        supply[field] += 1

    # Open-role demand by domain (non-open-application postings)
    demand = Counter()
    for j in jobs:
        if j.is_open_application:
            continue
        field, _ = _classify({"skills": [], "text": j.jd_text})
        demand[field] += 1

    domains = sorted(set(list(supply.keys()) + list(demand.keys())))
    supply_vs_demand = [
        {
            "domain": d,
            "label": _DOMAIN_LABEL.get(d, d),
            "supply": supply.get(d, 0),
            "demand": demand.get(d, 0),
        }
        for d in domains
    ]

    # Applications over time (by day)
    per_day = defaultdict(int)
    for c in candidates:
        if c.created_at:
            per_day[c.created_at.date().isoformat()] += 1
    over_time = [{"date": d, "count": per_day[d]} for d in sorted(per_day.keys())]

    return {
        "total_candidates": total,
        "total_jobs": len(jobs),
        "avg_overall_score": round(sum(overall_scores) / total) if total else 0,
        "avg_match_score": round(sum(match_scores) / total) if total else 0,
        "score_distribution": score_distribution,
        "by_status": by_status,
        "by_domain": [
            {"domain": d, "label": _DOMAIN_LABEL.get(d, d), "count": supply.get(d, 0)}
            for d in sorted(supply, key=lambda k: -supply[k])
        ],
        "supply_vs_demand": supply_vs_demand,
        "over_time": over_time,
    }
