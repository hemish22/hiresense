---
phase: 8
plan: 1
wave: 1
---

# Plan 8.1: Gemini Semantic Engine & Deep Repo Analysis

## Objective
Migrate the core skillset matching logic from legacy embeddings to Gemini API, including deep analysis of GitHub repository metadata (`README.md`, `requirements.txt`, `package.json`) to ascertain implicit skill associations like NLP architecture overlapping with BERT.

## Context
- `backend/services/skill_matcher.py`
- `backend/services/github_analyzer.py`

## Tasks

<task type="auto">
  <name>Install Gemini</name>
  <files>backend/requirements.txt</files>
  <action>
    - Add `google-generativeai` to `requirements.txt` and install it in the local Python environment.
  </action>
  <verify>grep -q "generativeai" "backend/requirements.txt"</verify>
  <done>Gemini SDK is available for importing.</done>
</task>

<task type="auto">
  <name>GitHub Deep Context Extractor</name>
  <files>backend/services/github_analyzer.py</files>
  <action>
    - Update `github_analyzer.py` to additionally fetch the base `README.md` and common dependency files (`requirements.txt`, `package.json`, `pom.xml`) content (base64 decoded).
    - Append this extracted raw text context to the candidate's GitHub profile returning payload.
  </action>
  <verify>grep -q "readme" "backend/services/github_analyzer.py"</verify>
  <done>Repo analysis pulls metadata instead of just languages.</done>
</task>

<task type="auto">
  <name>Gemini Semantic Matcher Proxy</name>
  <files>backend/services/skill_matcher.py, backend/config.py</files>
  <action>
    - Ensure `.env` reads `GEMINI_API_KEY`.
    - Refactor `SkillMatcher` to construct an LLM prompt containing: JD String, Candidate Extracted Resumes Skills, and GitHub extracted texts (READMEs & dependencies).
    - Prompt Gemini to return a structured JSON matching the original schema (`match_score`, `skill_gaps`, `category_scores` for Radar UI, `rationale`).
  </action>
  <verify>grep -q "gemini" "backend/services/skill_matcher.py"</verify>
  <done>The matcher evaluates candidates using AI reasoning instead of euclidean text vectors.</done>
</task>

## Success Criteria
- [ ] Backend successfully initializes `google.generativeai` client.
- [ ] Explicitly recognizes cross-domain sub-skills accurately (e.g., Tensorflow -> ML).
