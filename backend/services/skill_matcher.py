"""
HireSense AI — Gemini-Powered Skill Matcher
Uses Google Gemini to intelligently map candidate skills against job requirements,
understanding implicit relationships (e.g., NLP → BERT, React → JavaScript).
Falls back to the legacy embedding approach if Gemini is unavailable.
"""

import json
import re
from typing import Optional
from backend.services.skill_dictionary import find_skills_in_text, get_skill_category, SKILL_CATEGORIES
from backend.config import settings


# ──────────────────────────────────────────────
# Gemini client singleton
# ──────────────────────────────────────────────
_gemini_model = None


def _get_gemini_model():
    """Lazy-load the Gemini generative model."""
    global _gemini_model
    if _gemini_model is None:
        try:
            import google.generativeai as genai
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            genai.configure(api_key=api_key)
            _gemini_model = genai.GenerativeModel("gemini-2.5-flash")
        except Exception as e:
            print(f"[SkillMatcher] Gemini init failed: {e}")
            _gemini_model = None
    return _gemini_model


# ──────────────────────────────────────────────
# Legacy embedding fallback
# ──────────────────────────────────────────────
_embedding_model = None


def _get_embedding_model():
    """Lazy-load the sentence-transformers model as fallback."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


# JSON cleaning helper
def _extract_json_from_response(text: str) -> dict:
    """Extract JSON object from Gemini response, handling markdown fences."""
    # Strip markdown code fences
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence (```json or ```)
        text = re.sub(r'^```(?:json)?\s*\n?', '', text)
        # Remove closing fence
        text = re.sub(r'\n?```\s*$', '', text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None


class SkillMatcher:
    """Matches candidate skills against job description requirements using Gemini AI."""

    SIMILARITY_THRESHOLD = 0.45

    def match(
        self,
        candidate_skills: list[str],
        job_description: str,
        github_languages: dict = None,
        github_repo_context: list = None,
    ) -> dict:
        """
        Compute skill match between candidate and job description.
        Uses Gemini for intelligent semantic mapping, with embedding fallback.

        Returns dict with match_score, matched/missing/bonus skills,
        category_scores (for radar chart), and explanation.
        """
        # Merge resume skills with GitHub languages
        all_candidate_skills = self._merge_skills(candidate_skills, github_languages)

        # Extract skills from job description
        jd_skills = self._extract_jd_skills(job_description)

        if not jd_skills:
            return {
                "match_score": 0,
                "matched_skills": [],
                "missing_skills": [],
                "bonus_skills": list(all_candidate_skills),
                "category_scores": {},
                "explanation": "Could not extract skill requirements from the job description.",
                "details": {
                    "jd_requirements": [],
                    "semantic_matches": [],
                },
            }

        # Try Gemini first, fall back to embeddings
        gemini = _get_gemini_model()
        if gemini:
            result = self._gemini_match(
                gemini, all_candidate_skills, jd_skills,
                job_description, github_repo_context,
            )
            if result:
                return result

        # Fallback: legacy embedding-based matching
        return self._embedding_match(all_candidate_skills, jd_skills)

    # ──────────────────────────────────────────
    # Gemini-powered matching
    # ──────────────────────────────────────────

    def _gemini_match(
        self,
        model,
        candidate_skills: list[str],
        jd_skills: list[str],
        job_description: str,
        repo_context: list = None,
    ) -> Optional[dict]:
        """Use Gemini to perform intelligent skill matching."""
        # Build context from repo files
        repo_text = ""
        if repo_context:
            snippets = []
            for item in repo_context[:6]:  # Max 6 files
                snippets.append(f"--- {item['repo']}/{item['file']} ---\n{item['content'][:2000]}")
            repo_text = "\n\n".join(snippets)

        prompt = f"""You are an expert technical recruiter AI. Analyze how well a candidate's skills match a job description.

CRITICAL: You must understand IMPLICIT skill relationships. For example:
- "NLP" expertise implies knowledge of BERT, transformers, tokenization
- "React" implies JavaScript, JSX, component-based architecture
- "Docker" implies containerization, basic DevOps
- "TensorFlow" implies machine learning, deep learning, Python
- "AWS Lambda" implies serverless, cloud computing

## Job Description
{job_description}

## Extracted JD Requirements
{json.dumps(jd_skills)}

## Candidate Skills (from resume)
{json.dumps(list(candidate_skills))}

{f'''## Candidate GitHub Repository Context (README & dependency files)
{repo_text}
''' if repo_text else ''}

## Instructions
1. For each JD requirement, determine if the candidate has a DIRECT match, an IMPLICIT match (related skill/technology), or NO match.
2. Score each of these categories 0-100: {json.dumps(list(SKILL_CATEGORIES.keys()))}
   - Score based on how well the candidate covers skills in that category relative to the JD needs.
   - If a category has no relevance to the JD, score it 50 (neutral).
3. Provide an overall match_score (0-100).
4. List matched skills, missing skills, and bonus skills the candidate has beyond the JD.

Return ONLY a valid JSON object with this exact structure:
{{
  "match_score": <number 0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3"],
  "bonus_skills": ["skill4", "skill5"],
  "category_scores": {{
    "frontend": <0-100>,
    "backend": <0-100>,
    "databases": <0-100>,
    "devops": <0-100>,
    "cloud": <0-100>,
    "ml_ai": <0-100>,
    "mobile": <0-100>,
    "security": <0-100>,
    "languages": <0-100>,
    "tools": <0-100>
  }},
  "semantic_matches": [
    {{"jd_requirement": "BERT", "candidate_skill": "NLP", "match_type": "implicit", "reasoning": "NLP encompasses BERT"}},
  ],
  "explanation": "<2-3 sentence assessment>"
}}"""

        try:
            response = model.generate_content(prompt)
            parsed = _extract_json_from_response(response.text)

            if not parsed or "match_score" not in parsed:
                print(f"[SkillMatcher] Gemini returned unparseable response")
                return None

            # Normalize and validate the response
            return {
                "match_score": round(float(parsed.get("match_score", 0)), 1),
                "matched_skills": parsed.get("matched_skills", []),
                "missing_skills": parsed.get("missing_skills", []),
                "bonus_skills": parsed.get("bonus_skills", []),
                "category_scores": parsed.get("category_scores", {}),
                "explanation": parsed.get("explanation", ""),
                "details": {
                    "jd_requirements": jd_skills,
                    "semantic_matches": parsed.get("semantic_matches", []),
                    "engine": "gemini",
                },
            }
        except Exception as e:
            print(f"[SkillMatcher] Gemini match failed: {e}")
            return None

    # ──────────────────────────────────────────
    # Legacy embedding-based matching (fallback)
    # ──────────────────────────────────────────

    def _embedding_match(
        self, candidate_skills: list[str], jd_skills: list[str]
    ) -> dict:
        """Fallback: compute skill match using sentence-transformer embeddings."""
        semantic_matches = self._compute_semantic_similarity(candidate_skills, jd_skills)

        matched = []
        matched_jd = set()
        for m in semantic_matches:
            if m["similarity"] >= self.SIMILARITY_THRESHOLD:
                matched.append(m["candidate_skill"])
                matched_jd.add(m["jd_requirement"])

        matched = sorted(set(matched))
        missing = sorted(set(jd_skills) - matched_jd)
        bonus = sorted(set(candidate_skills) - set(matched))

        match_score = self._calculate_match_score(len(matched_jd), len(jd_skills))
        category_scores = self._calculate_category_scores(candidate_skills, jd_skills)
        explanation = self._generate_explanation(match_score, matched, missing, bonus)

        return {
            "match_score": round(match_score, 1),
            "matched_skills": matched,
            "missing_skills": missing,
            "bonus_skills": bonus,
            "category_scores": category_scores,
            "explanation": explanation,
            "details": {
                "jd_requirements": jd_skills,
                "semantic_matches": [
                    m for m in semantic_matches if m["similarity"] >= self.SIMILARITY_THRESHOLD
                ],
                "engine": "embedding-fallback",
            },
        }

    # ──────────────────────────────────────────
    # Shared helpers
    # ──────────────────────────────────────────

    def _extract_jd_skills(self, job_description: str) -> list[str]:
        """Extract skill requirements from a job description."""
        return find_skills_in_text(job_description)

    def _merge_skills(self, resume_skills: list[str], github_languages: dict = None) -> list[str]:
        """Merge resume skills with GitHub language names."""
        merged = set(s.lower().strip() for s in resume_skills)

        if github_languages:
            for lang in github_languages.keys():
                merged.add(lang.lower().strip())

        return sorted(merged)

    def _compute_semantic_similarity(
        self, candidate_skills: list[str], jd_skills: list[str]
    ) -> list[dict]:
        """Compute semantic similarity between candidate skills and JD requirements."""
        if not candidate_skills or not jd_skills:
            return []

        model = _get_embedding_model()

        candidate_embeddings = model.encode(candidate_skills, convert_to_tensor=True)
        jd_embeddings = model.encode(jd_skills, convert_to_tensor=True)

        from sentence_transformers.util import cos_sim
        similarity_matrix = cos_sim(jd_embeddings, candidate_embeddings)

        results = []
        for i, jd_skill in enumerate(jd_skills):
            best_idx = similarity_matrix[i].argmax().item()
            best_score = similarity_matrix[i][best_idx].item()

            results.append({
                "jd_requirement": jd_skill,
                "candidate_skill": candidate_skills[best_idx],
                "similarity": round(best_score, 3),
            })

        return results

    def _calculate_match_score(self, matched_count: int, total_required: int) -> float:
        """Calculate match score with diminishing returns."""
        if total_required == 0:
            return 0

        ratio = matched_count / total_required

        if ratio >= 1.0:
            return 100.0
        elif ratio >= 0.8:
            return 80 + (ratio - 0.8) * 100
        elif ratio >= 0.5:
            return 50 + (ratio - 0.5) * 100
        else:
            return ratio * 100

    def _calculate_category_scores(
        self, candidate_skills: list[str], jd_skills: list[str]
    ) -> dict:
        """Score match per skill category."""
        category_scores = {}

        for category in SKILL_CATEGORIES:
            jd_in_cat = [s for s in jd_skills if get_skill_category(s) == category]
            cand_in_cat = [s for s in candidate_skills if get_skill_category(s) == category]

            if not jd_in_cat:
                continue

            matched_in_cat = set(jd_in_cat) & set(cand_in_cat)
            score = (len(matched_in_cat) / len(jd_in_cat)) * 100 if jd_in_cat else 0
            category_scores[category] = round(score, 1)

        return category_scores

    def _generate_explanation(
        self,
        score: float,
        matched: list,
        missing: list,
        bonus: list,
    ) -> str:
        """Generate a human-readable match explanation."""
        total_required = len(matched) + len(missing)

        if score >= 85:
            verdict = "Excellent match"
        elif score >= 65:
            verdict = "Strong match"
        elif score >= 45:
            verdict = "Partial match"
        else:
            verdict = "Weak match"

        parts = [f"{verdict} ({score:.0f}/100)."]

        if total_required > 0:
            parts.append(
                f"Candidate covers {len(matched)}/{total_required} required skills."
            )

        if missing:
            parts.append(f"Missing: {', '.join(missing[:5])}{'...' if len(missing) > 5 else ''}.")

        if bonus:
            parts.append(
                f"Bonus skills: {', '.join(bonus[:5])}{'...' if len(bonus) > 5 else ''}."
            )

        return " ".join(parts)
