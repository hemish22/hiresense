"""
HireSense AI — Skill Similarity Matcher
Semantic skill matching using sentence-transformers embeddings.
"""

from typing import Optional
from backend.services.skill_dictionary import find_skills_in_text, get_skill_category, SKILL_CATEGORIES


# Lazy-loaded model singleton
_model = None


def _get_model():
    """Lazy-load the sentence-transformers model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


class SkillMatcher:
    """Matches candidate skills against job description requirements using semantic similarity."""

    SIMILARITY_THRESHOLD = 0.45

    def match(
        self,
        candidate_skills: list[str],
        job_description: str,
        github_languages: dict = None,
    ) -> dict:
        """
        Compute skill match between candidate and job description.

        Returns dict with match_score, matched/missing/bonus skills, explanations.
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

        # Compute semantic similarity
        semantic_matches = self._compute_semantic_similarity(all_candidate_skills, jd_skills)

        # Classify skills
        matched = []
        matched_jd = set()
        for m in semantic_matches:
            if m["similarity"] >= self.SIMILARITY_THRESHOLD:
                matched.append(m["candidate_skill"])
                matched_jd.add(m["jd_requirement"])

        matched = sorted(set(matched))
        missing = sorted(set(jd_skills) - matched_jd)
        bonus = sorted(set(all_candidate_skills) - set(matched))

        # Calculate scores
        match_score = self._calculate_match_score(len(matched_jd), len(jd_skills))

        # Per-category scores
        category_scores = self._calculate_category_scores(all_candidate_skills, jd_skills)

        # Generate explanation
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
            },
        }

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

        model = _get_model()

        # Encode both lists
        candidate_embeddings = model.encode(candidate_skills, convert_to_tensor=True)
        jd_embeddings = model.encode(jd_skills, convert_to_tensor=True)

        # Compute cosine similarity matrix
        from sentence_transformers.util import cos_sim
        similarity_matrix = cos_sim(jd_embeddings, candidate_embeddings)

        results = []
        for i, jd_skill in enumerate(jd_skills):
            # Find best matching candidate skill for this JD requirement
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
            return 80 + (ratio - 0.8) * 100  # 80-100
        elif ratio >= 0.5:
            return 50 + (ratio - 0.5) * 100  # 50-80
        else:
            return ratio * 100  # 0-50

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
