"""
HireSense AI — LeetCode Analyzer Service
Fetches problem-solving stats from LeetCode GraphQL endpoint.
"""

import requests
from typing import Optional


class LeetCodeAnalyzer:
    """Analyzes a LeetCode profile using the public GraphQL API."""

    GRAPHQL_URL = "https://leetcode.com/graphql"

    PROFILE_QUERY = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            profile {
                ranking
                reputation
                starRating
            }
            userCalendar {
                streak
                totalActiveDays
            }
        }
    }
    """

    def __init__(self):
        self.headers = {
            "Content-Type": "application/json",
            "Referer": "https://leetcode.com",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        }

    def analyze(self, username: str) -> dict:
        """
        Analyze a LeetCode user profile.

        Returns dict with: username, profile, problems, scores, details, explanations
        """
        user_data = self._fetch_user_data(username)

        if user_data.get("error"):
            return {
                "username": username,
                "user_not_found": True,
                "error": user_data["error"],
                "problems": {"total_solved": 0, "easy": 0, "medium": 0, "hard": 0},
                "scores": {"problem_solving": 0, "difficulty_balance": 0, "overall": 0},
                "explanations": {
                    "problem_solving": "User not found on LeetCode",
                    "difficulty_balance": "N/A",
                },
            }

        matched = user_data.get("matchedUser", {})
        if not matched:
            return {
                "username": username,
                "user_not_found": True,
                "error": f"LeetCode user '{username}' not found",
                "problems": {"total_solved": 0, "easy": 0, "medium": 0, "hard": 0},
                "scores": {"problem_solving": 0, "difficulty_balance": 0, "overall": 0},
                "explanations": {
                    "problem_solving": "User not found on LeetCode",
                    "difficulty_balance": "N/A",
                },
            }

        # Parse problem stats
        problems = self._parse_problem_stats(matched)

        # Parse profile
        profile_data = matched.get("profile", {}) or {}
        calendar_data = matched.get("userCalendar", {}) or {}

        # Calculate scores
        ps_score, ps_expl = self._calculate_problem_solving_score(problems)
        db_score, db_expl = self._calculate_difficulty_balance_score(problems)

        # Overall = weighted average
        overall = ps_score * 0.65 + db_score * 0.35

        return {
            "username": username,
            "profile": {
                "ranking": profile_data.get("ranking", 0),
                "reputation": profile_data.get("reputation", 0),
                "star_rating": profile_data.get("starRating"),
            },
            "problems": problems,
            "scores": {
                "problem_solving": round(ps_score, 1),
                "difficulty_balance": round(db_score, 1),
                "overall": round(overall, 1),
            },
            "details": {
                "easy_percentage": round(
                    (problems["easy"] / max(problems["total_solved"], 1)) * 100, 1
                ),
                "medium_percentage": round(
                    (problems["medium"] / max(problems["total_solved"], 1)) * 100, 1
                ),
                "hard_percentage": round(
                    (problems["hard"] / max(problems["total_solved"], 1)) * 100, 1
                ),
                "streak": calendar_data.get("streak", 0),
                "total_active_days": calendar_data.get("totalActiveDays", 0),
            },
            "explanations": {
                "problem_solving": ps_expl,
                "difficulty_balance": db_expl,
            },
        }

    def _fetch_user_data(self, username: str) -> dict:
        """Fetch user data from LeetCode GraphQL endpoint."""
        try:
            payload = {
                "query": self.PROFILE_QUERY,
                "variables": {"username": username},
            }

            resp = requests.post(
                self.GRAPHQL_URL,
                json=payload,
                headers=self.headers,
                timeout=15,
            )

            if resp.status_code != 200:
                return {"error": f"LeetCode API returned status {resp.status_code}"}

            data = resp.json()

            if "errors" in data:
                error_msg = data["errors"][0].get("message", "Unknown GraphQL error")
                return {"error": f"LeetCode GraphQL error: {error_msg}"}

            return data.get("data", {})

        except requests.Timeout:
            return {"error": "LeetCode API request timed out"}
        except requests.RequestException as e:
            return {"error": f"LeetCode API error: {str(e)}"}
        except (ValueError, KeyError) as e:
            return {"error": f"Failed to parse LeetCode response: {str(e)}"}

    def _parse_problem_stats(self, matched_user: dict) -> dict:
        """Parse submission stats into problem counts."""
        problems = {"total_solved": 0, "easy": 0, "medium": 0, "hard": 0}

        submit_stats = matched_user.get("submitStatsGlobal", {}) or {}
        ac_submissions = submit_stats.get("acSubmissionNum", []) or []

        for item in ac_submissions:
            difficulty = item.get("difficulty", "").lower()
            count = item.get("count", 0)

            if difficulty == "all":
                problems["total_solved"] = count
            elif difficulty == "easy":
                problems["easy"] = count
            elif difficulty == "medium":
                problems["medium"] = count
            elif difficulty == "hard":
                problems["hard"] = count

        # If 'All' wasn't explicit, sum the difficulties
        if problems["total_solved"] == 0:
            problems["total_solved"] = problems["easy"] + problems["medium"] + problems["hard"]

        return problems

    def _calculate_problem_solving_score(self, problems: dict) -> tuple:
        """
        Score based on number and difficulty of problems solved.
        Weighted: easy=1pt, medium=3pt, hard=5pt.
        """
        total = problems["total_solved"]
        if total == 0:
            return 0.0, "No problems solved on LeetCode"

        weighted = problems["easy"] * 1 + problems["medium"] * 3 + problems["hard"] * 5

        if weighted >= 500:
            score = 90 + min(10, (weighted - 500) // 100)
            explanation = (
                f"Exceptional problem solver: {total} problems solved "
                f"({problems['easy']}E/{problems['medium']}M/{problems['hard']}H). "
                f"Weighted score: {weighted} points."
            )
        elif weighted >= 200:
            score = 70 + min(20, (weighted - 200) // 20)
            explanation = (
                f"Strong problem solver: {total} problems "
                f"({problems['easy']}E/{problems['medium']}M/{problems['hard']}H). "
                f"Good depth in algorithmic challenges."
            )
        elif weighted >= 50:
            score = 40 + min(30, (weighted - 50) // 6)
            explanation = (
                f"Developing skills: {total} problems solved "
                f"({problems['easy']}E/{problems['medium']}M/{problems['hard']}H). "
                f"Building a solid algorithmic foundation."
            )
        elif weighted > 0:
            score = 15 + min(25, weighted)
            explanation = (
                f"Getting started: {total} problems solved. "
                f"More practice needed to demonstrate strong problem-solving ability."
            )
        else:
            score = 5
            explanation = "Minimal LeetCode activity."

        return min(score, 100), explanation

    def _calculate_difficulty_balance_score(self, problems: dict) -> tuple:
        """
        Score based on the mix of easy/medium/hard problems.
        Ideal mix: some easy, mostly medium, meaningful hard.
        """
        total = problems["total_solved"]
        if total == 0:
            return 0.0, "No problems solved — cannot assess difficulty balance"

        easy_pct = problems["easy"] / total
        medium_pct = problems["medium"] / total
        hard_pct = problems["hard"] / total

        # Ideal: 20-40% easy, 40-50% medium, 15-30% hard
        if hard_pct >= 0.15 and medium_pct >= 0.35:
            score = 80 + min(20, int(hard_pct * 50))
            explanation = (
                f"Excellent difficulty balance: {int(easy_pct*100)}% easy, "
                f"{int(medium_pct*100)}% medium, {int(hard_pct*100)}% hard. "
                f"Actively challenging themselves with hard problems."
            )
        elif medium_pct >= 0.3 and hard_pct >= 0.05:
            score = 55 + min(25, int(medium_pct * 40))
            explanation = (
                f"Good balance: {int(easy_pct*100)}% easy, "
                f"{int(medium_pct*100)}% medium, {int(hard_pct*100)}% hard. "
                f"Could benefit from attempting more hard problems."
            )
        elif easy_pct > 0.7:
            score = 20 + min(15, int(medium_pct * 50))
            explanation = (
                f"Heavily skewed toward easy problems ({int(easy_pct*100)}%). "
                f"Should attempt more medium and hard challenges to demonstrate growth."
            )
        elif medium_pct >= 0.3:
            score = 45 + min(20, int(medium_pct * 30))
            explanation = (
                f"Moderate balance: {int(easy_pct*100)}% easy, "
                f"{int(medium_pct*100)}% medium, {int(hard_pct*100)}% hard. "
                f"Decent mix but room for harder challenges."
            )
        else:
            score = 30
            explanation = (
                f"Limited diversity: {int(easy_pct*100)}% easy, "
                f"{int(medium_pct*100)}% medium, {int(hard_pct*100)}% hard. "
                f"Recommend attempting a broader range of difficulties."
            )

        return min(score, 100), explanation
