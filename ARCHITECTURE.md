# HireSense AI — Detailed Architectural Deep Dive

This document traces the exact lifecycle of data inside the HireSense platform — from the moment a user drops a resume into the web browser, to the moment the AI returns a granular technical evaluation.

---

## 1. The Frontend Intake (Next.js)

The user interacts with either `CandidateView.tsx` or `TeamView.tsx`.
1. **User Action**: The user drops a PDF resume into the dropzone and pastes a Job Description (or Project Description).
2. **State Management**: The UI swaps to a dedicated `<LoadingState />` that automatically spins through various processing phrases ("Parsing PDFs", "Benchmarking...") to keep the user engaged.
3. **Data Transit**: The frontend uses standard Javascript `FormData` to bundle the PDF file binary and the text inputs (Location, Job Description).
4. **Bypassing the Proxy**: Instead of relying on Next.js `rewrites` (which often forcibly close HTTP connections after 10 seconds of idle time and trigger an `ECONNRESET`), the frontend sends the HTTP POST request **directly to the exposed FastAPI backend** at `http://127.0.0.1:8000/api`. This ensures the connection survives the lengthy 15-30 second Gemini processing window.

---

## 2. Backend Orchestration (FastAPI)

Once the data hits the `/api/candidates/analyze` or `/api/teams/analyze-bulk` FastAPI endpoints:

### Step 1: File Ingestion
- FastAPI captures the streaming `UploadFile`.
- It writes the binary PDF data into a native temporary physical file inside the system's storage so that downstream Python libraries can access it via absolute paths.

### Step 2: The Resume Parser (`resume_parser.py`)
This is the extraction layer where unstructured PDF blobs become structured JSON.
1. **Raw Text Extraction**: The parser physically opens the temporary PDF and uses a library (like PyMuPDF or pdfplumber) to strip all formatting and extract raw ASCII/UTF-8 text.
2. **Entity Recognition (Regex)**: 
   - Uses strict Regular Expressions (Regex) to scan the block of text for standard email formats (`[\w\.-]+@[\w\.-]+`), phone numbers, and URLs containing `github.com/` or `leetcode.com/`. 
   - If URLs are found, it extracts the exact `username` substring at the end of the URL.
3. **Skill Normalization Layer**: 
   - The parser scans the extracted text against a massive predefined Hash Map loaded from `skill_dictionary.py`.
   - The dictionary groups skills by aliases. For instance, if the text contains `React.js`, `React`, or `reactjs`, the parser aggregates and standardizes them into a single canonical skill: `"react"`. 
   - It outputs an array of structured strings: `["react", "python", "docker", ...]`.

### Step 3: The Data Engineering Layer (`github_scraper.py` & `leetcode_scraper.py`)
If the parser successfully extracted a GitHub or LeetCode username:
- **Async API Calls**: FastAPI triggers asynchronous `HTTP` requests to public API graphs for those sites.
- **GitHub**: Scrapes public repositories to track what programming languages the candidate mathematically actually writes code in.
- **LeetCode**: Scrapes contest rankings and the ratio of Easy/Medium/Hard algorithms solved to gauge raw problem-solving horsepower.

### Step 4: The Machine Learning Core
The data pipelines converge into `scoring_engine.py` or `team_analyzer.py`.

#### A. The AI "Skill Matcher" (Powered by Google Gemini 2.5)
- The engine takes the parsed candidate skills `["react", "tailwind"]` and the raw Job Description parameter provided by the user.
- It builds a strict, heavily-engineered prompt block and fires it at **Gemini 2.5 Flash** using the `google-generativeai` SDK.
- **Semantic Reasoning**: Instead of doing a dumb keyword check, Gemini evaluates semantics. E.g. if the JD asks for "Frontend Engineering" and the candidate has "Vue.js", Gemini understands this is an *Implicit Match* and awards points.
- **Resilient Fallback**: If the Google API throws a Quota Exception (Rate Limit) or the network drops, the backend automatically intercepts the crash using a `try/except` block and reroutes the data into a local, offline String-Distance formula that calculates the fallback score without the internet.

#### B. The "Learning Predictor"
- Calculates "Learning Velocity" by comparing the breadth of domains the candidate already knows against the domains they are missing. E.g. if a candidate knows `C++` and `Java`, the predictor algorithm calculates that learning `C#` will require drastically less time than someone who only knows `HTML`.

#### C. The "Inflation Detector"
- Combines the parsed PDF claims with the GitHub Scraper realities.
- If the candidate explicitly put "Expert Python" inside their Resume/PDF, but the GitHub scraper returns 0 bytes of Python code pushed to public repositories over 3 years, the system severely penalizes their "Credibility Score / Resume Inflation Rating".

---

## 5. Team Analysis specific pipelines

If the user uploaded 5 resumes for an engineering team via `TeamView.tsx`:
1. **Architectural Gap Computation**: The exact same parsing happens across all 5 PDFs simultaneously. The array of skills is aggregated into one giant Set (`["react", "postgres", ...]`). The algorithm compares this Set against the structural architecture of the requested project to mathematically isolate what specific technical capabilities the current team is physically missing.
2. **Cluster Urgency**: The missing skills are grouped by domain. Crucial infrastructure domains (like `DevOps`, `Terraform`, `Security`) are hardcoded to flag a "Critical Urgency" because building a project without those puts the business at risk.
3. **Salary Benchmarker (`salary_benchmarker.py`)**: A local, offline dataset of historical wages looks up the missing capability role (e.g. "Cloud Engineer") against the physical location provided by the user in the UI (e.g. "San Francisco") and injects a localized US/INR estimate.
4. **Automated JD Generation**: Utilizing an internal templating engine, standard job descriptions are enriched with the exact missing capabilities to generate a Markdown snippet that recruiters can literally copy and post to LinkedIn.

---

## 6. Persistence & Response

1. **Serialization**: The final scores, reasons, salary benchmarks, and AI strings are packaged into a massive JSON object.
2. **Database Storage (`database.py`)**: 
   - A connection is opened to a local `SQLite` database via `SQLAlchemy`.
   - The JSON object is stored permanently inside the `CandidateAnalysis` or `TeamAnalysis` tables so users can close the browser and view historical assessments days later without paying API costs again.
3. **Network Return**: The FastAPI router `return`s the JSON payload back up the HTTP stream to the Next.js React client.

---

## 7. Frontend UI Delivery

1. `TeamView.tsx` / `CandidateView.tsx` receive the JSON blob and the `<LoadingState>` is immediately destroyed.
2. **Data Mapping**: React maps the dynamic variables (`score`, `salary_benchmark`, `explanation`) onto beautiful Shadcn UI components.
3. **Data Scrubbing**: The frontend uses client-side JavaScript Regular Expressions (Regex) to scrub and clean the raw LLM `description` strings to guarantee no duplicate scores or strange formatting tokens accidentally render on screen.
4. **Render Charts**: `Recharts` mathematically maps the 10 domain axes into a vibrant SVG radar polygon.
5. **Execution Complete**: The user is presented with the final interactive dashboard.
