---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Resume Parser Service

## Objective
Build the resume parser that extracts structured data from PDF resumes — candidate name, email, phone, skills, projects, experience sections, and external profile links (GitHub, LeetCode). This is the entry point of the entire analysis pipeline.

## Context
- .gsd/SPEC.md — REQ-01: Parse PDF resumes and extract structured fields
- .gsd/phases/2/RESEARCH.md — Resume parsing approach (pdfplumber + regex + keyword matching)
- backend/config.py — Settings for upload directory
- backend/models/candidate.py — CandidateAnalysis model

## Tasks

<task type="auto">
  <name>Create resume parser service</name>
  <files>
    backend/services/resume_parser.py
    backend/services/skill_dictionary.py
  </files>
  <action>
    **backend/services/skill_dictionary.py:**
    Create a comprehensive skill dictionary for matching. Structure as a Python dict:
    ```python
    SKILL_CATEGORIES = {
        "languages": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "html", "css"],
        "frontend": ["react", "angular", "vue", "svelte", "next.js", "nuxt", "tailwind", "bootstrap", "jquery", "redux", "webpack", "vite"],
        "backend": ["node.js", "express", "fastapi", "flask", "django", "spring boot", "rails", "laravel", "asp.net", "gin", "fiber"],
        "databases": ["postgresql", "mysql", "mongodb", "redis", "sqlite", "elasticsearch", "cassandra", "dynamodb", "firebase", "supabase"],
        "devops": ["docker", "kubernetes", "aws", "azure", "gcp", "terraform", "ansible", "jenkins", "github actions", "ci/cd", "nginx", "linux"],
        "ml_ai": ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "nlp", "computer vision", "llm", "transformers", "hugging face", "opencv"],
        "tools": ["git", "jira", "figma", "postman", "grafana", "prometheus", "kafka", "rabbitmq", "graphql", "rest api", "websocket"],
    }
    ```
    Also create a flattened set `ALL_SKILLS` for fast lookup, and a function `normalize_skill(skill) -> str` that lowercases and strips whitespace.

    **backend/services/resume_parser.py:**
    Create a `ResumeParser` class with these methods:

    `parse(pdf_path: str) -> dict`:
    Main entry point. Returns structured dict:
    ```python
    {
        "name": str or None,
        "email": str or None,
        "phone": str or None,
        "github_url": str or None,
        "github_username": str or None,
        "leetcode_url": str or None,
        "leetcode_username": str or None,
        "linkedin_url": str or None,
        "skills": [str],            # extracted skills
        "experience": [dict],       # list of experience entries
        "projects": [dict],         # list of project entries
        "education": [dict],        # list of education entries
        "raw_text": str,            # full extracted text
    }
    ```

    `_extract_text(pdf_path: str) -> str`:
    Use pdfplumber to extract all text from all pages. Handle multi-page PDFs.

    `_extract_contact(text: str) -> dict`:
    Use regex to extract:
    - Email: r'[\w.-]+@[\w.-]+\.\w+'
    - Phone: r'[\+]?[\d\s\-\(\)]{10,}'
    - GitHub URL: r'github\.com/([a-zA-Z0-9_-]+)'
    - LeetCode URL: r'leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)'
    - LinkedIn URL: r'linkedin\.com/in/([a-zA-Z0-9_-]+)'

    `_extract_name(text: str) -> str`:
    Take the first non-empty line of the resume (common convention).
    Validate it doesn't look like an email or URL.

    `_extract_skills(text: str) -> list[str]`:
    1. Lowercase the full text
    2. For each skill in ALL_SKILLS, check if it appears in the text
    3. Also check for multi-word skills (e.g., "machine learning")
    4. Return deduplicated, sorted list

    `_extract_sections(text: str) -> dict`:
    Use regex to detect section headers like:
    - "EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT"
    - "PROJECTS", "PERSONAL PROJECTS"
    - "EDUCATION", "ACADEMIC"
    Split text into sections. For each experience/project entry, extract:
    - title/role
    - organization (if present)
    - description text

    AVOID:
    - Do NOT use spaCy NER for name extraction — it's unreliable on resumes and adds startup time. Simple first-line heuristic is more reliable.
    - Do NOT try to extract dates/durations — too complex for MVP, not needed for scoring.
    - Do NOT import sentence_transformers here — that's Phase 3.
  </action>
  <verify>
    python3 -c "
from backend.services.resume_parser import ResumeParser
parser = ResumeParser()
print('ResumeParser imported OK')
print(f'Skill categories: {len(parser.skill_dict)}')
"
  </verify>
  <done>
    - ResumeParser class exists and imports without error
    - parse() method accepts a PDF path and returns structured dict
    - Regex patterns extract email, phone, GitHub/LeetCode URLs
    - Skill dictionary has 7+ categories with 80+ skills
    - Section detection splits resumes into experience/projects/education
  </done>
</task>

<task type="auto">
  <name>Wire resume upload to API endpoint</name>
  <files>
    backend/api/routes/candidates.py
  </files>
  <action>
    Update the POST /candidates/analyze endpoint:
    1. Accept `resume: UploadFile` and `job_description: str = Form(...)`
    2. Save uploaded PDF to `{UPLOAD_DIR}/{timestamp}_{filename}`
    3. Run `ResumeParser().parse(saved_path)` on it
    4. Extract GitHub/LeetCode usernames from parsed results
    5. Return the parsed profile as JSON (analysis scoring comes in Phase 3)
    6. Save initial record to database (CandidateAnalysis) with parsed fields

    Response structure (for now):
    ```json
    {
        "id": 1,
        "status": "parsed",
        "candidate": {
            "name": "...",
            "email": "...",
            "skills": [...],
            "github_username": "...",
            "leetcode_username": "..."
        },
        "message": "Resume parsed. GitHub/LeetCode analysis pending."
    }
    ```

    AVOID:
    - Do NOT run GitHub/LeetCode analysis in this task — that's wired in Plan 2.3
    - Do NOT compute scores — that's Phase 3
  </action>
  <verify>
    # Create a test PDF and upload it
    curl -X POST http://localhost:8000/api/candidates/analyze \
      -F "resume=@test_resume.pdf" \
      -F "job_description=Looking for a Python developer"
  </verify>
  <done>
    - POST /api/candidates/analyze accepts file upload + job description
    - Uploaded PDF is saved to uploads/ directory
    - Response contains parsed candidate data (name, email, skills, usernames)
    - Record saved to database with parsed fields
  </done>
</task>

## Success Criteria
- [ ] Resume parser extracts structured data from PDF files
- [ ] Skills matched against skill dictionary (80+ skills)
- [ ] GitHub/LeetCode profile links detected via regex
- [ ] API endpoint accepts file upload and returns parsed profile
