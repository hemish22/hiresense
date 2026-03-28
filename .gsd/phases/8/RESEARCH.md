# RESEARCH: Phase 8 Options

## 1. Gemini API Integration
**Goal**: Move from basic rigid embeddings to an LLM capable of mapping implicit dependencies (e.g., BERT -> NLP, React -> JavaScript).
**Context limit**: Gemini 1.5 Pro and Flash have 1-2M token limits which effortlessly ingest READMEs and `requirements.txt`/`package.json` strings.
**Changes**: We'll swap `sentence-transformers` out of `skill_matcher.py` or run a parallel `gemini_matcher.py` service that structures the gap identification dynamically via `google-generativeai`.

## 2. GitHub README/Dep Extraction
**Goal**: Pull only the documentation and dependency files, not the whole codebase.
**Action**: The GitHub API endpoint `/repos/{owner}/{repo}/contents/{path}` allows fetching `README.md` and `requirements.txt`. These fetched strings will be concatenated and sent inside the Gemini evaluation prompt.

## 3. Radar Charts
**Goal**: Display visual polygon charts of candidate capabilities.
**Action**: We'll utilize `recharts` (a highly popular React charting library frequently paired with shadcn/ui) to construct responsive, animated Radar charts mapping `category_scores` (e.g., Backend, Frontend, Cloud, DevOps, ML).

## 4. Mass PDF Uploader
**Goal**: Avoid manual typing of team skills by extracting them directly from bulk resume uploads.
**Action**: The `CandidateView` currently parses one PDF via `resume_parser.py`. We will upgrade `TeamView` and the backend `POST /teams/analyze` endpoint to accept `multipart/form-data` with an array of files (`List[UploadFile]`). It will map over each resume, extract the skills, join the unified set, and compute the gap analysis.
