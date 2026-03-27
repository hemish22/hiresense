"""
HireSense AI — Resume Inflation Detector
Cross-references resume claims against GitHub/LeetCode evidence.
"""

from backend.services.skill_dictionary import get_skill_category, normalize_skill


class InflationDetector:
    """Detects resume inflation by cross-referencing claims with verified data."""

    # Language name normalization (GitHub language → common skill name)
    LANGUAGE_MAP = {
        "python": "python",
        "javascript": "javascript",
        "typescript": "typescript",
        "java": "java",
        "c++": "c++",
        "c#": "c#",
        "c": "c",
        "go": "go",
        "golang": "go",
        "rust": "rust",
        "ruby": "ruby",
        "php": "php",
        "swift": "swift",
        "kotlin": "kotlin",
        "scala": "scala",
        "r": "r",
        "dart": "dart",
        "shell": "bash",
        "html": "html",
        "css": "css",
        "scss": "sass",
        "sass": "sass",
        "makefile": "linux",
        "dockerfile": "docker",
        "hcl": "terraform",
    }

    def detect(
        self,
        resume_skills: list[str],
        github_data: dict = None,
        leetcode_data: dict = None,
    ) -> dict:
        """
        Cross-reference resume skill claims against verified evidence.
        """
        flags = []

        # Check each skill against available evidence
        for skill in resume_skills:
            flag = self._check_skill(skill, github_data, leetcode_data)
            flags.append(flag)

        # Calculate credibility score
        credibility_score = self._calculate_credibility_score(flags)

        # Summary
        verified = [f for f in flags if f["status"] == "verified"]
        unverified = [f for f in flags if f["status"] == "unverified"]
        inflated = [f for f in flags if f["status"] == "inflated"]

        summary = {
            "verified_count": len(verified),
            "unverified_count": len(unverified),
            "inflated_count": len(inflated),
            "total_claimed": len(resume_skills),
        }

        explanation = self._generate_explanation(credibility_score, summary)

        return {
            "credibility_score": round(credibility_score, 1),
            "flags": flags,
            "summary": summary,
            "explanation": explanation,
        }

    def _check_skill(
        self, skill: str, github_data: dict = None, leetcode_data: dict = None
    ) -> dict:
        """Check a single skill claim against available evidence."""
        normalized = normalize_skill(skill)
        category = get_skill_category(skill)

        # Try GitHub evidence first
        if github_data:
            gh_result = self._check_github(normalized, category, github_data)
            if gh_result["status"] == "verified":
                return gh_result

        # Try LeetCode evidence
        if leetcode_data:
            lc_result = self._check_leetcode(normalized, category, leetcode_data)
            if lc_result["status"] == "verified":
                return lc_result

        # No evidence found — classify as unverified (not inflated)
        # Only flag as inflated in special circumstances
        if github_data and self._is_suspiciously_absent(normalized, category, github_data):
            return {
                "skill": skill,
                "status": "inflated",
                "evidence": f"Claimed '{skill}' but no evidence found in GitHub repos despite active profile",
                "source": "github",
            }

        return {
            "skill": skill,
            "status": "unverified",
            "evidence": f"Cannot verify '{skill}' — may be from work experience or non-public contributions",
            "source": "none",
        }

    def _check_github(self, skill: str, category: str, github_data: dict) -> dict:
        """Check if a skill is evidenced in GitHub data."""
        details = github_data.get("details", {})
        languages = details.get("languages", {})

        # Normalize GitHub languages for comparison
        gh_langs_normalized = {}
        for lang, bytes_count in languages.items():
            normalized_lang = self.LANGUAGE_MAP.get(lang.lower(), lang.lower())
            gh_langs_normalized[normalized_lang] = (
                gh_langs_normalized.get(normalized_lang, 0) + bytes_count
            )

        # Direct language match
        if skill in gh_langs_normalized:
            bytes_count = gh_langs_normalized[skill]
            if bytes_count > 1000:
                return {
                    "skill": skill,
                    "status": "verified",
                    "evidence": f"Found {self._format_bytes(bytes_count)} of {skill} code in GitHub repos",
                    "source": "github",
                }

        # Category-based verification for non-language skills
        if category in ("devops", "tools", "frontend", "backend", "databases"):
            # Check if any language in the same ecosystem is present
            related_langs = self._get_ecosystem_languages(skill)
            for rl in related_langs:
                if rl in gh_langs_normalized and gh_langs_normalized[rl] > 5000:
                    return {
                        "skill": skill,
                        "status": "verified",
                        "evidence": f"GitHub shows {rl} code — consistent with '{skill}' experience",
                        "source": "github",
                    }

        # Check repo count as general activity evidence
        total_repos = details.get("total_repos", 0)
        if total_repos >= 10 and category in ("tools", "devops"):
            # Tools/devops skills are often not visible in language stats
            return {
                "skill": skill,
                "status": "unverified",
                "evidence": f"Active GitHub profile ({total_repos} repos) but '{skill}' not directly visible in code",
                "source": "github",
            }

        return {"skill": skill, "status": "unverified", "evidence": "", "source": "none"}

    def _check_leetcode(self, skill: str, category: str, leetcode_data: dict) -> dict:
        """Check if a skill claim is supported by LeetCode data."""
        problems = leetcode_data.get("problems", {})
        total_solved = problems.get("total_solved", 0)

        # Algorithmic/DSA skills
        algo_skills = {
            "data structures", "algorithms", "problem solving",
            "dynamic programming", "graph algorithms", "sorting",
        }

        if skill in algo_skills or category == "ml_ai":
            if total_solved >= 50:
                return {
                    "skill": skill,
                    "status": "verified",
                    "evidence": f"LeetCode profile shows {total_solved} problems solved — supports '{skill}' claim",
                    "source": "leetcode",
                }

        return {"skill": skill, "status": "unverified", "evidence": "", "source": "none"}

    def _is_suspiciously_absent(self, skill: str, category: str, github_data: dict) -> bool:
        """Determine if a skill claim is suspiciously absent from GitHub."""
        details = github_data.get("details", {})
        languages = details.get("languages", {})
        total_repos = details.get("total_repos", 0)

        # Only flag if user has significant GitHub activity but skill is completely absent
        if total_repos < 5:
            return False  # Not enough data to call inflation

        # Only flag programming languages that should show up
        if category != "languages":
            return False  # Non-language skills are often not visible in GitHub

        # Check if the language is completely absent
        gh_langs_lower = {lang.lower() for lang in languages.keys()}
        if skill not in gh_langs_lower and skill not in self.LANGUAGE_MAP:
            # Language claimed but not found in any repo
            return total_repos >= 15  # Only flag for very active users

        return False

    def _get_ecosystem_languages(self, skill: str) -> list[str]:
        """Get programming languages associated with a framework/tool."""
        ecosystems = {
            "react": ["javascript", "typescript"],
            "react.js": ["javascript", "typescript"],
            "reactjs": ["javascript", "typescript"],
            "angular": ["typescript", "javascript"],
            "vue": ["javascript", "typescript"],
            "vue.js": ["javascript", "typescript"],
            "next.js": ["javascript", "typescript"],
            "nextjs": ["javascript", "typescript"],
            "node.js": ["javascript", "typescript"],
            "nodejs": ["javascript", "typescript"],
            "express": ["javascript", "typescript"],
            "django": ["python"],
            "flask": ["python"],
            "fastapi": ["python"],
            "spring boot": ["java", "kotlin"],
            "spring": ["java", "kotlin"],
            "rails": ["ruby"],
            "ruby on rails": ["ruby"],
            "laravel": ["php"],
            "docker": ["python", "javascript", "go"],
            "kubernetes": ["python", "go"],
            "machine learning": ["python", "r"],
            "deep learning": ["python"],
            "tensorflow": ["python"],
            "pytorch": ["python"],
            "pandas": ["python"],
            "numpy": ["python"],
            "scikit-learn": ["python"],
        }
        return ecosystems.get(skill, [])

    def _calculate_credibility_score(self, flags: list) -> float:
        """Calculate overall credibility score."""
        if not flags:
            return 50.0

        score = 100.0

        for flag in flags:
            if flag["status"] == "inflated":
                score -= 10
            elif flag["status"] == "unverified":
                score -= 3

        return max(0, min(100, score))

    def _generate_explanation(self, score: float, summary: dict) -> str:
        """Generate credibility explanation."""
        total = summary["total_claimed"]

        if score >= 85:
            verdict = "High credibility"
        elif score >= 65:
            verdict = "Good credibility"
        elif score >= 45:
            verdict = "Moderate credibility"
        else:
            verdict = "Low credibility — review carefully"

        parts = [f"{verdict} ({score:.0f}/100)."]
        parts.append(
            f"{summary['verified_count']}/{total} skills verified against public data."
        )

        if summary["inflated_count"] > 0:
            parts.append(
                f"⚠ {summary['inflated_count']} skill(s) flagged as potentially inflated."
            )

        if summary["unverified_count"] > 0:
            parts.append(
                f"{summary['unverified_count']} skill(s) could not be verified "
                f"(may be from private/work experience)."
            )

        return " ".join(parts)

    def _format_bytes(self, bytes_count: int) -> str:
        """Format byte count to human-readable."""
        if bytes_count >= 1_000_000:
            return f"{bytes_count / 1_000_000:.1f}MB"
        elif bytes_count >= 1_000:
            return f"{bytes_count / 1_000:.1f}KB"
        return f"{bytes_count}B"
