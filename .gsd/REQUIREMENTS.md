# REQUIREMENTS.md

## Format

| ID | Requirement | Source | Status |
|----|-------------|--------|--------|
| REQ-01 | Parse PDF resumes and extract structured fields (name, skills, projects, experience, links) | SPEC Goal 1 | Pending |
| REQ-02 | Fetch GitHub profile data via REST API: repos, commits, languages, stars, activity timeline | SPEC Goal 1 | Pending |
| REQ-03 | Compute GitHub-derived scores: consistency, project depth, tech breadth, recency | SPEC Goal 1 | Pending |
| REQ-04 | Fetch LeetCode profile data via GraphQL: problems solved by difficulty, streaks | SPEC Goal 1 | Pending |
| REQ-05 | Compute skill similarity between candidate and job description using sentence embeddings | SPEC Goal 1 | Pending |
| REQ-06 | Generate overall match score with matched/missing skill breakdown | SPEC Goal 1 | Pending |
| REQ-07 | Predict learning ability for each missing skill using transfer graph + behavioral modifiers | SPEC Goal 2 | Pending |
| REQ-08 | Classify learning speed (Fast/Medium/Slow) with time estimates per skill | SPEC Goal 2 | Pending |
| REQ-09 | Compare claimed skills (resume) vs verified activity (GitHub/LeetCode) to compute credibility scores | SPEC Goal 3 | Pending |
| REQ-10 | Flag specific resume inflation patterns with human-readable explanations | SPEC Goal 3 | Pending |
| REQ-11 | Accept team skills + project requirements as input for internal analysis | SPEC Goal 4 | Pending |
| REQ-12 | Compute skill coverage score and identify missing capabilities | SPEC Goal 4 | Pending |
| REQ-13 | Cluster skill gaps by domain (DevOps, Frontend, ML, Backend) | SPEC Goal 4 | Pending |
| REQ-14 | Generate hire plan with urgency levels | SPEC Goal 4 | Pending |
| REQ-15 | Auto-generate job descriptions from skill gaps | SPEC Goal 4 | Pending |
| REQ-16 | Estimate salary ranges using public datasets (Levels.fyi, GitHub Jobs archive) | SPEC Goal 5 | Pending |
| REQ-17 | Include budget impact in hire plan recommendations | SPEC Goal 5 | Pending |
| REQ-18 | Every score provides contributing factors and reasoning explanation | SPEC Goal 5 | Pending |
| REQ-19 | Store analysis results in SQLite for retrieval and comparison | SPEC Goal 5 | Pending |
| REQ-20 | Web dashboard with candidate analysis view and team analysis view | SPEC Goal 5 | Pending |
| REQ-21 | Process internal team data using local LLM only (no external API calls) | SPEC Constraint | Pending |
| REQ-22 | Full system runs locally without cloud dependencies | SPEC Constraint | Pending |
