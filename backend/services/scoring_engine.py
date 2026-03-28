"""
HireSense AI — Scoring Engine Orchestrator
Combines all ML scoring services into a unified candidate score.
"""

from backend.services.skill_matcher import SkillMatcher
from backend.services.learning_predictor import LearningPredictor
from backend.services.inflation_detector import InflationDetector


class ScoringEngine:
    """Orchestrates all scoring services to produce a unified candidate assessment."""

    WEIGHTS = {
        "match_score": 0.40,
        "github_score": 0.20,
        "leetcode_score": 0.15,
        "learning_score": 0.10,
        "credibility_score": 0.15,
    }

    RECOMMENDATION_THRESHOLDS = {
        80: "Strong Hire",
        60: "Hire",
        40: "Maybe",
        0: "Pass",
    }

    def __init__(self):
        self.skill_matcher = SkillMatcher()
        self.learning_predictor = LearningPredictor()
        self.inflation_detector = InflationDetector()

    def score(
        self,
        parsed_resume: dict,
        job_description: str,
        github_data: dict = None,
        leetcode_data: dict = None,
    ) -> dict:
        """
        Run all scoring services and produce a unified assessment.
        """
        candidate_skills = parsed_resume.get("skills", [])

        # 1. Skill matching
        github_languages = None
        github_repo_context = None
        if github_data and not github_data.get("user_not_found"):
            github_languages = github_data.get("details", {}).get("languages")
            github_repo_context = github_data.get("repo_context")

        skill_match_result = self.skill_matcher.match(
            candidate_skills=candidate_skills,
            job_description=job_description,
            github_languages=github_languages,
            github_repo_context=github_repo_context,
        )

        # 2. Learning ability prediction
        missing_skills = skill_match_result.get("missing_skills", [])
        learning_result = self.learning_predictor.predict(
            candidate_skills=candidate_skills,
            missing_skills=missing_skills,
            github_data=github_data if github_data and not github_data.get("user_not_found") else None,
            leetcode_data=leetcode_data if leetcode_data and not leetcode_data.get("user_not_found") else None,
        )

        # 3. Inflation detection
        inflation_result = self.inflation_detector.detect(
            resume_skills=candidate_skills,
            github_data=github_data if github_data and not github_data.get("user_not_found") else None,
            leetcode_data=leetcode_data if leetcode_data and not leetcode_data.get("user_not_found") else None,
        )

        # 4. Extract sub-scores
        match_score = skill_match_result.get("match_score", 0)
        github_score = (
            github_data.get("scores", {}).get("overall", 0)
            if github_data and not github_data.get("user_not_found")
            else 0
        )
        leetcode_score = (
            leetcode_data.get("scores", {}).get("overall", 0)
            if leetcode_data and not leetcode_data.get("user_not_found")
            else 0
        )
        learning_score = learning_result.get("learning_score", 0)
        credibility_score = inflation_result.get("credibility_score", 0)

        # 5. Compute dynamic weights (adjust if data is missing)
        weights = dict(self.WEIGHTS)
        if not github_data or github_data.get("user_not_found"):
            # Redistribute GitHub weight
            weights["github_score"] = 0
            weights["match_score"] += 0.10
            weights["credibility_score"] += 0.05
            weights["learning_score"] += 0.05
        if not leetcode_data or leetcode_data.get("user_not_found"):
            # Redistribute LeetCode weight
            weights["leetcode_score"] = 0
            weights["match_score"] += 0.08
            weights["learning_score"] += 0.07

        # 6. Weighted overall score
        overall_score = (
            match_score * weights["match_score"]
            + github_score * weights["github_score"]
            + leetcode_score * weights["leetcode_score"]
            + learning_score * weights["learning_score"]
            + credibility_score * weights["credibility_score"]
        )

        # 7. Generate recommendation
        recommendation = self._get_recommendation(overall_score)

        # 8. Overall explanation
        explanation = self._generate_explanation(
            overall_score, recommendation, match_score, github_score,
            leetcode_score, learning_score, credibility_score,
        )

        return {
            "overall_score": round(overall_score, 1),
            "recommendation": recommendation,
            "scores": {
                "match_score": round(match_score, 1),
                "github_score": round(github_score, 1),
                "leetcode_score": round(leetcode_score, 1),
                "learning_score": round(learning_score, 1),
                "credibility_score": round(credibility_score, 1),
            },
            "skill_match": skill_match_result,
            "learning_analysis": learning_result,
            "credibility_analysis": inflation_result,
            "explanation": explanation,
        }

    def _get_recommendation(self, score: float) -> str:
        """Get recommendation label based on overall score."""
        for threshold in sorted(self.RECOMMENDATION_THRESHOLDS.keys(), reverse=True):
            if score >= threshold:
                return self.RECOMMENDATION_THRESHOLDS[threshold]
        return "Pass"

    def _generate_explanation(
        self,
        overall: float,
        recommendation: str,
        match: float,
        github: float,
        leetcode: float,
        learning: float,
        credibility: float,
    ) -> str:
        """Generate narrative summary of the candidate assessment."""
        parts = [f"Overall assessment: {recommendation} ({overall:.0f}/100)."]

        # Highlight strengths
        strengths = []
        if match >= 70:
            strengths.append("strong skill match")
        if github >= 70:
            strengths.append("solid GitHub presence")
        if leetcode >= 70:
            strengths.append("strong problem-solving ability")
        if learning >= 80:
            strengths.append("high learning potential")
        if credibility >= 85:
            strengths.append("high resume credibility")

        if strengths:
            parts.append(f"Key strengths: {', '.join(strengths)}.")

        # Highlight concerns
        concerns = []
        if match < 40:
            concerns.append("significant skill gaps")
        if github > 0 and github < 30:
            concerns.append("limited GitHub activity")
        if credibility < 50:
            concerns.append("credibility concerns")

        if concerns:
            parts.append(f"Areas of concern: {', '.join(concerns)}.")

        return " ".join(parts)
