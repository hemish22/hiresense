"""
Generate 5 sample team resumes (PDF) for Team Gap Analysis testing.
Designed to exercise: critical devops + security gaps, weighted-coverage
divergence, bus-factor single-points-of-failure, and an upskill path.
Run: ../.venv/bin/python _generate.py
"""

import os
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

OUT = os.path.dirname(os.path.abspath(__file__))

MEMBERS = [
    {
        "name": "Aisha Verma",
        "title": "Senior Frontend Engineer",
        "email": "aisha.verma@example.com",
        "phone": "+91 98200 11223",
        "links": "github.com/aishaverma  ·  linkedin.com/in/aishaverma",
        "skills": "React, TypeScript, JavaScript, Next.js, Redux, TailwindCSS, HTML, CSS, Git, REST API",
        "experience": [
            ("Frontend Lead — PayWave (2021–Present)",
             "Built the customer-facing payments dashboard in React + Next.js. "
             "Led a 4-person UI team and cut bundle size 38% with code-splitting."),
            ("Frontend Developer — Shopfront (2018–2021)",
             "Shipped a TypeScript component library used across 6 product squads."),
        ],
        "projects": [
            ("Realtime Trade Ticker",
             "WebSocket-driven React UI rendering 5k price updates/sec."),
        ],
        "education": "B.Tech, Computer Science — VIT, 2018",
    },
    {
        "name": "Rohan Iyer",
        "title": "Backend Engineer",
        "email": "rohan.iyer@example.com",
        "phone": "+91 99300 44556",
        "links": "github.com/rohaniyer  ·  leetcode.com/u/rohaniyer",
        "skills": "Python, FastAPI, Django, PostgreSQL, Redis, Microservices, REST API, Git, Celery, RabbitMQ",
        "experience": [
            ("Backend Engineer — FinCore (2020–Present)",
             "Designed payment-ledger microservices in FastAPI on PostgreSQL. "
             "Owns the Redis caching + idempotency layer for transaction APIs."),
            ("Software Engineer — Tezzy (2017–2020)",
             "Built Django billing services and async workers."),
        ],
        "projects": [
            ("Idempotent Payments API",
             "Exactly-once payment processing using Redis locks and Postgres outbox."),
        ],
        "education": "B.E., Information Technology — PICT Pune, 2017",
    },
    {
        "name": "Priya Nair",
        "title": "Full Stack Developer",
        "email": "priya.nair@example.com",
        "phone": "+91 90040 77889",
        "links": "github.com/priyanair",
        "skills": "React, Node.js, Express, JavaScript, TypeScript, MongoDB, GraphQL, Git, REST API",
        "experience": [
            ("Full Stack Developer — LedgerLoop (2019–Present)",
             "End-to-end features on a Node.js + MongoDB + React stack. "
             "Built the GraphQL gateway aggregating 4 internal services."),
        ],
        "projects": [
            ("Merchant Onboarding Portal",
             "MERN-stack KYC onboarding flow with document upload."),
        ],
        "education": "B.Sc., Computer Science — Christ University, 2019",
    },
    {
        "name": "Karthik Rao",
        "title": "Machine Learning Engineer",
        "email": "karthik.rao@example.com",
        "phone": "+91 91120 33445",
        "links": "github.com/karthikrao  ·  leetcode.com/u/krao",
        "skills": "Python, Machine Learning, TensorFlow, PyTorch, Pandas, NumPy, SQL, Scikit-learn, Git",
        "experience": [
            ("ML Engineer — RiskSense (2020–Present)",
             "Built real-time fraud-scoring models (TensorFlow) on transaction streams. "
             "Reduced false positives 22% with a gradient-boosted ensemble."),
        ],
        "projects": [
            ("Fraud Anomaly Detector",
             "Online learning model flagging anomalous payments in <50ms."),
        ],
        "education": "M.Tech, Data Science — IIIT Hyderabad, 2020",
    },
    {
        "name": "Sana Sheikh",
        "title": "QA & Backend Engineer",
        "email": "sana.sheikh@example.com",
        "phone": "+91 93410 66778",
        "links": "github.com/sanasheikh",
        "skills": "Java, Spring, MySQL, Selenium, Python, Linux, Git, JUnit, REST API",
        "experience": [
            ("QA Automation Lead — QualiPay (2018–Present)",
             "Owns the Selenium + JUnit regression suite for the payments platform. "
             "Wrote Spring Boot test harnesses and seeded MySQL fixtures."),
        ],
        "projects": [
            ("Payment Gateway Test Harness",
             "Automated end-to-end gateway tests across 12 bank integrations."),
        ],
        "education": "B.Tech, Electronics — NIT Surat, 2017",
    },
]


def build(member):
    styles = getSampleStyleSheet()
    name_style = ParagraphStyle("Name", parent=styles["Title"], fontSize=20,
                                spaceAfter=2, alignment=0)
    sub_style = ParagraphStyle("Sub", parent=styles["Normal"], fontSize=10,
                               textColor="#444444", spaceAfter=2)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12,
                        spaceBefore=12, spaceAfter=4, textColor="#1a1a1a")
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9.5,
                          leading=13, spaceAfter=3)

    fname = os.path.join(OUT, member["name"].replace(" ", "_") + "_Resume.pdf")
    doc = SimpleDocTemplate(fname, pagesize=LETTER,
                            topMargin=0.7 * inch, bottomMargin=0.7 * inch,
                            leftMargin=0.8 * inch, rightMargin=0.8 * inch)
    flow = []
    flow.append(Paragraph(member["name"], name_style))
    flow.append(Paragraph(member["title"], sub_style))
    flow.append(Paragraph(f'{member["email"]}  ·  {member["phone"]}', sub_style))
    flow.append(Paragraph(member["links"], sub_style))

    flow.append(Paragraph("Technical Skills", h2))
    flow.append(Paragraph(member["skills"], body))

    flow.append(Paragraph("Experience", h2))
    for title, desc in member["experience"]:
        flow.append(Paragraph(f"<b>{title}</b>", body))
        flow.append(Paragraph(f"• {desc}", body))

    flow.append(Paragraph("Projects", h2))
    for title, desc in member["projects"]:
        flow.append(Paragraph(f"<b>{title}</b> — {desc}", body))

    flow.append(Paragraph("Education", h2))
    flow.append(Paragraph(member["education"], body))

    doc.build(flow)
    return fname


if __name__ == "__main__":
    for m in MEMBERS:
        print("wrote", os.path.basename(build(m)))
