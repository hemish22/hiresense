"""
HireSense AI — Job Posting Model
Open roles candidates can apply to. Includes a year-round "open application"
posting so candidates can submit a resume without a specific role in mind.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime

from backend.models.database import Base


# A broad default JD used to score open/general applications.
OPEN_APPLICATION_JD = (
    "General software engineering role. We evaluate candidates across frontend, "
    "backend, databases, cloud, devops, and problem-solving ability. Strong "
    "fundamentals in at least one modern stack (e.g. React, TypeScript, Python, "
    "Node.js, Java), familiarity with databases (PostgreSQL, MongoDB), version "
    "control with Git, and solid data-structures and algorithms. Cloud, Docker, "
    "and CI/CD exposure is a plus."
)


class Job(Base):
    """An open position candidates can apply to."""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    employment_type = Column(String(64), nullable=True)  # Full-time, Intern, etc.
    jd_text = Column(Text, nullable=False)
    # True for the year-round "open application" posting.
    is_open_application = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Job(id={self.id}, title='{self.title}')>"


# Seed postings created on first run if the jobs table is empty.
SEED_JOBS = [
    {
        "title": "Open Application (Year-Round)",
        "department": "All Teams",
        "location": "Remote / Hybrid",
        "employment_type": "Any",
        "jd_text": OPEN_APPLICATION_JD,
        "is_open_application": True,
    },
    {
        "title": "Senior Frontend Engineer",
        "department": "Product",
        "location": "Bangalore (Hybrid)",
        "employment_type": "Full-time",
        "jd_text": (
            "We are hiring a Senior Frontend Engineer to build performant, accessible "
            "user interfaces. Strong React and TypeScript required, with Next.js, "
            "state management (Redux), and modern CSS (TailwindCSS). Experience with "
            "testing, performance optimization, and component design systems. REST and "
            "GraphQL API integration."
        ),
    },
    {
        "title": "Backend / Platform Engineer",
        "department": "Infrastructure",
        "location": "Remote (India)",
        "employment_type": "Full-time",
        "jd_text": (
            "Backend engineer for scalable, low-latency services. Strong Python "
            "(FastAPI/Django) or Node.js, PostgreSQL and Redis, microservices, and "
            "event streaming with Kafka. Infrastructure on AWS with Docker, Kubernetes, "
            "Terraform and CI/CD. Security-minded (OAuth, JWT)."
        ),
    },
    {
        "title": "Machine Learning Engineer",
        "department": "Data & AI",
        "location": "Hyderabad (Hybrid)",
        "employment_type": "Full-time",
        "jd_text": (
            "ML Engineer to design, train, and deploy models in production. Strong "
            "Python, machine learning, TensorFlow or PyTorch, pandas/numpy, SQL, and "
            "solid software engineering. Experience deploying real-time inference and "
            "working with large datasets."
        ),
    },
]


def seed_jobs(db):
    """Insert seed postings if the jobs table is empty."""
    if db.query(Job).count() > 0:
        return
    for spec in SEED_JOBS:
        db.add(Job(**spec))
    db.commit()
