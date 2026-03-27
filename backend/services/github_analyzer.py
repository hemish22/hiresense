"""
HireSense AI — GitHub Analyzer Service
Fetches developer activity from GitHub REST API and computes scores.
"""

import requests
from datetime import datetime, timezone, timedelta
from typing import Optional
import statistics


class GitHubAnalyzer:
    """Analyzes a GitHub profile and computes activity-based scores."""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: Optional[str] = None):
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
        self.has_token = bool(token)

    def analyze(self, username: str) -> dict:
        """
        Analyze a GitHub user profile.

        Returns dict with: username, profile, scores, details, explanations
        """
        # Fetch profile
        profile = self._fetch_profile(username)
        if profile.get("error"):
            return {
                "username": username,
                "user_not_found": True,
                "error": profile["error"],
                "scores": {"consistency": 0, "project_depth": 0, "tech_breadth": 0, "recency": 0, "overall": 0},
                "explanations": {"consistency": "User not found on GitHub", "project_depth": "N/A", "tech_breadth": "N/A", "recency": "N/A"},
            }

        # Fetch repos (excluding forks)
        repos = self._fetch_repos(username)
        original_repos = [r for r in repos if not r.get("fork", False)]

        # Fetch languages from top repos
        languages = self._fetch_languages(username, original_repos[:10])

        # Fetch commit activity from top repos
        commit_data = self._fetch_commit_activity(username, original_repos[:5])

        # Calculate scores
        consistency_score, consistency_expl = self._calculate_consistency_score(commit_data)
        depth_score, depth_expl = self._calculate_project_depth_score(original_repos)
        breadth_score, breadth_expl = self._calculate_tech_breadth_score(languages)
        recency_score, recency_expl = self._calculate_recency_score(original_repos, commit_data)

        # Overall = weighted average
        overall = (
            consistency_score * 0.30
            + depth_score * 0.25
            + breadth_score * 0.20
            + recency_score * 0.25
        )

        # Top repos for display
        top_repos = sorted(original_repos, key=lambda r: r.get("stargazers_count", 0), reverse=True)[:5]
        top_repos_display = [
            {
                "name": r["name"],
                "stars": r.get("stargazers_count", 0),
                "forks": r.get("forks_count", 0),
                "language": r.get("language"),
                "updated_at": r.get("pushed_at"),
            }
            for r in top_repos
        ]

        warnings = []
        if not self.has_token:
            warnings.append("No GitHub token — using unauthenticated requests (60 req/hour limit)")

        return {
            "username": username,
            "profile": {
                "name": profile.get("name") or username,
                "bio": profile.get("bio"),
                "public_repos": profile.get("public_repos", 0),
                "followers": profile.get("followers", 0),
                "following": profile.get("following", 0),
                "created_at": profile.get("created_at"),
                "avatar_url": profile.get("avatar_url"),
            },
            "scores": {
                "consistency": round(consistency_score, 1),
                "project_depth": round(depth_score, 1),
                "tech_breadth": round(breadth_score, 1),
                "recency": round(recency_score, 1),
                "overall": round(overall, 1),
            },
            "details": {
                "total_repos": len(original_repos),
                "total_stars": sum(r.get("stargazers_count", 0) for r in original_repos),
                "total_commits_sampled": sum(len(commits) for commits in commit_data.values()),
                "languages": languages,
                "top_repos": top_repos_display,
                "commit_months": self._get_monthly_counts(commit_data),
                "active_days": self._count_active_days(commit_data),
            },
            "explanations": {
                "consistency": consistency_expl,
                "project_depth": depth_expl,
                "tech_breadth": breadth_expl,
                "recency": recency_expl,
            },
            "warnings": warnings,
        }

    def _fetch_profile(self, username: str) -> dict:
        """Fetch GitHub user profile."""
        try:
            resp = requests.get(f"{self.BASE_URL}/users/{username}", headers=self.headers, timeout=10)
            if resp.status_code == 404:
                return {"error": f"GitHub user '{username}' not found"}
            if resp.status_code == 403:
                return {"error": "GitHub API rate limit exceeded"}
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            return {"error": f"GitHub API error: {str(e)}"}

    def _fetch_repos(self, username: str) -> list:
        """Fetch user repositories sorted by last pushed."""
        try:
            resp = requests.get(
                f"{self.BASE_URL}/users/{username}/repos",
                params={"per_page": 100, "sort": "pushed", "type": "owner"},
                headers=self.headers,
                timeout=15,
            )
            if resp.status_code != 200:
                return []
            return resp.json()
        except requests.RequestException:
            return []

    def _fetch_languages(self, username: str, repos: list) -> dict:
        """Aggregate languages across top repos."""
        languages = {}
        for repo in repos:
            try:
                resp = requests.get(
                    f"{self.BASE_URL}/repos/{username}/{repo['name']}/languages",
                    headers=self.headers,
                    timeout=10,
                )
                if resp.status_code == 200:
                    for lang, bytes_count in resp.json().items():
                        languages[lang] = languages.get(lang, 0) + bytes_count
            except requests.RequestException:
                continue
        return languages

    def _fetch_commit_activity(self, username: str, repos: list) -> dict:
        """Fetch recent commit dates from top repos."""
        commit_data = {}
        for repo in repos:
            try:
                resp = requests.get(
                    f"{self.BASE_URL}/repos/{username}/{repo['name']}/commits",
                    params={"per_page": 100, "author": username},
                    headers=self.headers,
                    timeout=10,
                )
                if resp.status_code == 200:
                    commits = resp.json()
                    dates = []
                    for c in commits:
                        if isinstance(c, dict) and "commit" in c:
                            date_str = c["commit"].get("author", {}).get("date", "")
                            if date_str:
                                dates.append(date_str)
                    commit_data[repo["name"]] = dates
            except requests.RequestException:
                continue
        return commit_data

    def _get_monthly_counts(self, commit_data: dict) -> dict:
        """Bucket commit dates by month."""
        monthly = {}
        for repo_dates in commit_data.values():
            for date_str in repo_dates:
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    key = dt.strftime("%Y-%m")
                    monthly[key] = monthly.get(key, 0) + 1
                except (ValueError, AttributeError):
                    continue
        return dict(sorted(monthly.items()))

    def _count_active_days(self, commit_data: dict) -> int:
        """Count unique days with at least one commit."""
        days = set()
        for repo_dates in commit_data.values():
            for date_str in repo_dates:
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    days.add(dt.date())
                except (ValueError, AttributeError):
                    continue
        return len(days)

    def _calculate_consistency_score(self, commit_data: dict) -> tuple:
        """Score based on how evenly distributed commits are over time."""
        monthly = self._get_monthly_counts(commit_data)
        if not monthly:
            return 0.0, "No commit data available"

        counts = list(monthly.values())
        if len(counts) < 2:
            return 30.0, f"Only {len(counts)} month(s) of activity — insufficient data for consistency analysis"

        mean = statistics.mean(counts)
        stdev = statistics.stdev(counts)

        if mean == 0:
            return 0.0, "No commits found"

        cv = stdev / mean  # Coefficient of variation

        if cv < 0.3:
            score = 85 + min(15, len(counts) * 2)
            explanation = f"Very consistent activity across {len(counts)} months (CV={cv:.2f}). Commits are evenly distributed."
        elif cv < 0.6:
            score = 60 + min(20, len(counts))
            explanation = f"Moderately consistent across {len(counts)} months (CV={cv:.2f}). Some variation in activity levels."
        elif cv < 1.0:
            score = 35 + min(15, len(counts))
            explanation = f"Irregular activity pattern across {len(counts)} months (CV={cv:.2f}). Bursts of activity followed by quiet periods."
        else:
            score = max(10, 25 - int(cv * 5))
            explanation = f"Highly irregular activity (CV={cv:.2f}). Sporadic bursts with long gaps between contributions."

        return min(score, 100), explanation

    def _calculate_project_depth_score(self, repos: list) -> tuple:
        """Score based on project impact (stars, forks)."""
        if not repos:
            return 0.0, "No repositories found"

        total_stars = sum(r.get("stargazers_count", 0) for r in repos)
        total_forks = sum(r.get("forks_count", 0) for r in repos)
        max_stars = max((r.get("stargazers_count", 0) for r in repos), default=0)

        # Weighted impact score
        impact = total_stars * 3 + total_forks * 2

        if impact > 1000:
            score = 90 + min(10, impact // 500)
            explanation = f"High-impact projects: {total_stars} total stars, {total_forks} forks across {len(repos)} repos. Top repo has {max_stars} stars."
        elif impact > 200:
            score = 70 + min(20, impact // 50)
            explanation = f"Solid project portfolio: {total_stars} stars, {total_forks} forks. Shows meaningful community engagement."
        elif impact > 50:
            score = 45 + min(25, impact // 10)
            explanation = f"Growing portfolio: {total_stars} stars across {len(repos)} repos. Projects are gaining traction."
        elif impact > 10:
            score = 25 + min(20, impact)
            explanation = f"Early-stage projects: {total_stars} stars, {total_forks} forks. Building up a portfolio."
        else:
            score = max(10, len(repos) * 3)
            explanation = f"{len(repos)} repos with minimal community engagement. Focus on building public, impactful projects."

        return min(score, 100), explanation

    def _calculate_tech_breadth_score(self, languages: dict) -> tuple:
        """Score based on diversity of programming languages."""
        if not languages:
            return 0.0, "No language data available"

        lang_count = len(languages)

        # Filter out very minor languages (< 1% of total bytes)
        total_bytes = sum(languages.values())
        significant_langs = {
            lang: bytes_count
            for lang, bytes_count in languages.items()
            if bytes_count > total_bytes * 0.01
        }
        sig_count = len(significant_langs)

        if sig_count >= 7:
            score = 85 + min(15, sig_count - 7)
            explanation = f"Excellent breadth: {sig_count} significant languages ({', '.join(list(significant_langs.keys())[:6])}...). Versatile developer."
        elif sig_count >= 5:
            score = 65 + min(20, sig_count * 3)
            explanation = f"Good breadth: {sig_count} languages ({', '.join(significant_langs.keys())}). Comfortable across multiple tech stacks."
        elif sig_count >= 3:
            score = 45 + min(20, sig_count * 5)
            explanation = f"Moderate breadth: {sig_count} languages ({', '.join(significant_langs.keys())}). Room to explore more technologies."
        elif sig_count >= 1:
            score = 20 + sig_count * 10
            explanation = f"Narrow focus: {sig_count} language(s) ({', '.join(significant_langs.keys())}). Consider diversifying."
        else:
            score = 5
            explanation = "No significant language usage detected."

        return min(score, 100), explanation

    def _calculate_recency_score(self, repos: list, commit_data: dict) -> tuple:
        """Score based on how recently the user has been active."""
        now = datetime.now(timezone.utc)
        most_recent = None

        # Check commit dates
        for repo_dates in commit_data.values():
            for date_str in repo_dates:
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    if most_recent is None or dt > most_recent:
                        most_recent = dt
                except (ValueError, AttributeError):
                    continue

        # Also check repo pushed_at dates
        for repo in repos:
            pushed_at = repo.get("pushed_at")
            if pushed_at:
                try:
                    dt = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
                    if most_recent is None or dt > most_recent:
                        most_recent = dt
                except (ValueError, AttributeError):
                    continue

        if most_recent is None:
            return 0.0, "No activity timestamps found"

        days_ago = (now - most_recent).days

        if days_ago <= 7:
            score = 95
            explanation = f"Very active — last contribution {days_ago} day(s) ago. Currently engaged."
        elif days_ago <= 30:
            score = 80
            explanation = f"Recently active — last contribution {days_ago} days ago. Regular contributor."
        elif days_ago <= 90:
            score = 60
            explanation = f"Moderately recent — last active {days_ago} days ago. Some gap in activity."
        elif days_ago <= 180:
            score = 40
            explanation = f"Declining activity — last active {days_ago} days ago ({days_ago // 30} months). May be focused elsewhere."
        elif days_ago <= 365:
            score = 25
            explanation = f"Inactive for {days_ago // 30} months. Limited recent contribution evidence."
        else:
            score = 10
            explanation = f"Inactive for {days_ago // 365}+ years. GitHub may not reflect current abilities."

        return score, explanation
