"""
HireSense AI — Learning Ability Predictor
Estimates how quickly a candidate can learn missing skills.
"""

from backend.services.skill_dictionary import get_skill_category, SKILL_CATEGORIES


class LearningPredictor:
    """Predicts learning ability based on skill graph and activity patterns."""

    def predict(
        self,
        candidate_skills: list[str],
        missing_skills: list[str],
        github_data: dict = None,
        leetcode_data: dict = None,
    ) -> dict:
        """
        Predict learning ability and time-to-learn for missing skills.
        """
        if not missing_skills:
            return {
                "learning_score": 95.0,
                "predictions": [],
                "factors": {
                    "base_score": 50,
                    "skill_breadth_bonus": 20,
                    "consistency_bonus": 15,
                    "problem_solving_bonus": 10,
                },
                "explanation": "Candidate already has all required skills. Excellent readiness.",
            }

        # Per-skill predictions
        predictions = []
        for skill in missing_skills:
            pred = self._estimate_learning_time(skill, candidate_skills)
            predictions.append(pred)

        # Calculate factor bonuses
        factors = self._calculate_factors(candidate_skills, github_data, leetcode_data)

        # Overall learning score
        learning_score = self._calculate_learning_score(predictions, factors)

        explanation = self._generate_explanation(learning_score, predictions, factors)

        return {
            "learning_score": round(learning_score, 1),
            "predictions": predictions,
            "factors": factors,
            "explanation": explanation,
        }

    def _estimate_learning_time(self, skill: str, existing_skills: list[str]) -> dict:
        """Estimate learning time for a specific skill."""
        target_category = get_skill_category(skill)

        # Count existing skills in the same category
        related = [s for s in existing_skills if get_skill_category(s) == target_category]

        if len(related) >= 3:
            months = 1.5
            confidence = "high"
            reason = (
                f"Already proficient in {len(related)} skills in '{target_category}' "
                f"({', '.join(related[:3])}). Transfer learning will be fast."
            )
        elif len(related) >= 1:
            months = 3.0
            confidence = "medium"
            reason = (
                f"Has {len(related)} related skill(s) in '{target_category}' "
                f"({', '.join(related)}). Foundation exists to build upon."
            )
        else:
            # Check cross-category transfers
            unique_categories = set(get_skill_category(s) for s in existing_skills)
            if len(unique_categories) >= 4:
                months = 4.0
                confidence = "medium"
                reason = (
                    f"No direct '{target_category}' experience, but has skills across "
                    f"{len(unique_categories)} categories — demonstrated versatility suggests adaptability."
                )
            else:
                months = 6.0
                confidence = "low"
                reason = (
                    f"No experience in '{target_category}' and limited breadth. "
                    f"Will require structured learning and mentorship."
                )

        return {
            "skill": skill,
            "estimated_months": months,
            "confidence": confidence,
            "reason": reason,
            "related_existing": related[:5],
        }

    def _calculate_factors(
        self,
        candidate_skills: list[str],
        github_data: dict = None,
        leetcode_data: dict = None,
    ) -> dict:
        """Calculate bonus factors for learning score."""
        # Skill breadth bonus
        unique_categories = set(get_skill_category(s) for s in candidate_skills)
        skill_breadth_bonus = min(20, len(unique_categories) * 4)

        # GitHub consistency bonus
        consistency_bonus = 0
        if github_data:
            gh_scores = github_data.get("scores", {})
            consistency = gh_scores.get("consistency", 0)
            if consistency >= 70:
                consistency_bonus = 15
            elif consistency >= 40:
                consistency_bonus = 8

        # LeetCode problem-solving bonus
        problem_solving_bonus = 0
        if leetcode_data:
            lc_scores = leetcode_data.get("scores", {})
            lc_overall = lc_scores.get("overall", 0)
            if lc_overall >= 70:
                problem_solving_bonus = 15
            elif lc_overall >= 40:
                problem_solving_bonus = 8

        return {
            "base_score": 50,
            "skill_breadth_bonus": skill_breadth_bonus,
            "consistency_bonus": consistency_bonus,
            "problem_solving_bonus": problem_solving_bonus,
        }

    def _calculate_learning_score(self, predictions: list, factors: dict) -> float:
        """Calculate the overall learning ability score."""
        score = factors["base_score"]
        score += factors["skill_breadth_bonus"]
        score += factors["consistency_bonus"]
        score += factors["problem_solving_bonus"]

        # Penalty for hard-to-learn skills
        for pred in predictions:
            if pred["estimated_months"] > 4:
                score -= 5
            elif pred["estimated_months"] > 2:
                score -= 2

        return max(0, min(100, score))

    def _generate_explanation(
        self, score: float, predictions: list, factors: dict
    ) -> str:
        """Generate human-readable learning ability explanation."""
        if score >= 80:
            verdict = "High learning potential"
        elif score >= 60:
            verdict = "Good learning potential"
        elif score >= 40:
            verdict = "Moderate learning potential"
        else:
            verdict = "Learning may be challenging"

        fast = [p for p in predictions if p["estimated_months"] <= 2]
        slow = [p for p in predictions if p["estimated_months"] > 4]

        parts = [f"{verdict} ({score:.0f}/100)."]

        if fast:
            parts.append(
                f"Can quickly pick up: {', '.join(p['skill'] for p in fast)}."
            )
        if slow:
            parts.append(
                f"Will need more time for: {', '.join(p['skill'] for p in slow)}."
            )

        bonuses = []
        if factors["consistency_bonus"] > 0:
            bonuses.append("consistent GitHub activity")
        if factors["problem_solving_bonus"] > 0:
            bonuses.append("strong problem-solving skills")
        if factors["skill_breadth_bonus"] >= 16:
            bonuses.append("diverse skill set")

        if bonuses:
            parts.append(f"Positive signals: {', '.join(bonuses)}.")

        return " ".join(parts)
