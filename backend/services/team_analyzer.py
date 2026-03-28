"""
HireSense AI — Team Skill Gap Analyzer
Computes coverage, identifies domain-clustered gaps, generates hire plan.
"""

from backend.services.skill_dictionary import (
    SKILL_CATEGORIES,
    normalize_skill,
    find_skills_in_text,
    get_skill_category,
)


# Domain → suggested role title
DOMAIN_ROLES = {
    "devops": "DevOps Engineer",
    "frontend": "Frontend Developer",
    "backend": "Backend Developer",
    "databases": "Database Engineer",
    "ml_ai": "ML/AI Engineer",
    "mobile": "Mobile Developer",
    "tools": "Platform Engineer",
    "languages": "Software Engineer",
    "security": "Security Engineer",
    "cloud": "Cloud Engineer",
}

# Urgency boost domains — infra-critical areas get higher urgency
URGENCY_BOOST_DOMAINS = {"devops", "security"}


class TeamAnalyzer:
    """Analyzes team skills against project requirements to identify gaps."""

    def analyze(
        self,
        team_skills: list,
        project_requirements: list,
        team_name: str = "",
    ) -> dict:
        """
        Full team gap analysis.
        Returns coverage score, gaps clustered by domain, and hire plan.
        """
        # Normalize inputs
        team_normalized = [normalize_skill(s) for s in team_skills if s.strip()]
        reqs_normalized = [normalize_skill(s) for s in project_requirements if s.strip()]

        # Compute coverage
        covered, gaps = self._compute_coverage(team_normalized, reqs_normalized)

        # Coverage score
        total = len(reqs_normalized)
        coverage_score = round((len(covered) / total * 100) if total > 0 else 0, 1)

        # Cluster gaps by domain
        gap_clusters = self._cluster_gaps(gaps)

        # Generate hire plan
        hire_plan = self._generate_hire_plan(gap_clusters, team_name)

        # Generate explanation
        explanation = self._generate_explanation(
            coverage_score, len(covered), len(gaps), len(hire_plan), team_name
        )

        return {
            "team_name": team_name,
            "coverage_score": coverage_score,
            "gap_summary": {
                "total_required": total,
                "covered": len(covered),
                "gaps": len(gaps),
            },
            "covered_skills": sorted(covered),
            "gap_clusters": gap_clusters,
            "hire_plan": hire_plan,
            "explanation": explanation,
        }

    def _compute_coverage(self, team: list, required: list) -> tuple:
        """
        Check which requirements the team covers.
        Uses exact match + category-aware alias matching.
        Returns (covered_list, gap_list).
        """
        covered = []
        gaps = []

        # Build team skill set with aliases
        team_set = set(team)
        # Also add canonical forms
        for skill in team:
            # Check aliases within the same category
            cat = get_skill_category(skill)
            if cat != "other":
                for cat_skill in SKILL_CATEGORIES.get(cat, []):
                    # If team has "react" it covers "reactjs", "react.js" etc.
                    if normalize_skill(cat_skill).startswith(skill) or skill.startswith(normalize_skill(cat_skill)):
                        team_set.add(normalize_skill(cat_skill))

        for req in required:
            if req in team_set:
                covered.append(req)
            else:
                gaps.append(req)

        return covered, gaps

    def _cluster_gaps(self, gaps: list) -> list:
        """Group gaps by skill category/domain and assign urgency."""
        clusters = {}

        for gap in gaps:
            domain = get_skill_category(gap)
            if domain not in clusters:
                clusters[domain] = []
            clusters[domain].append(gap)

        result = []
        for domain, skills in sorted(clusters.items()):
            urgency = self._compute_urgency(domain, skills)
            result.append({
                "domain": domain,
                "skills": sorted(skills),
                "urgency": urgency,
                "reason": self._urgency_reason(domain, skills, urgency),
            })

        # Sort by urgency priority
        urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        result.sort(key=lambda c: urgency_order.get(c["urgency"], 4))

        return result

    def _compute_urgency(self, domain: str, skills: list) -> str:
        """Determine urgency based on gap count and domain importance."""
        count = len(skills)

        # Base urgency from gap count
        if count >= 3:
            base = "critical"
        elif count == 2:
            base = "high"
        else:
            base = "medium"

        # Boost for infrastructure-critical domains
        if domain in URGENCY_BOOST_DOMAINS and base == "medium":
            base = "high"
        elif domain in URGENCY_BOOST_DOMAINS and base == "high":
            base = "critical"

        return base

    def _urgency_reason(self, domain: str, skills: list, urgency: str) -> str:
        """Generate human-readable reason for the urgency level."""
        count = len(skills)
        domain_label = domain.replace("_", "/").title()

        reasons = []
        if count >= 3:
            reasons.append(f"{count} missing skills in {domain_label}")
        elif count == 2:
            reasons.append(f"Multiple gaps in {domain_label}")
        else:
            reasons.append(f"Gap in {domain_label}: {skills[0]}")

        if domain in URGENCY_BOOST_DOMAINS:
            reasons.append("infrastructure-critical domain")

        return ". ".join(reasons) + "."

    def _generate_hire_plan(self, clusters: list, team_name: str) -> list:
        """Generate a prioritized hire plan from gap clusters."""
        hire_plan = []
        priority = 1

        for cluster in clusters:
            domain = cluster["domain"]
            skills = cluster["skills"]
            urgency = cluster["urgency"]

            role = DOMAIN_ROLES.get(domain, "Software Engineer")

            justification = self._hire_justification(
                role, skills, urgency, team_name
            )

            hire_plan.append({
                "role": role,
                "priority": priority,
                "urgency": urgency,
                "skills_covered": skills,
                "justification": justification,
            })
            priority += 1

        return hire_plan

    def _hire_justification(
        self, role: str, skills: list, urgency: str, team_name: str
    ) -> str:
        """Generate justification for a hire recommendation."""
        team_ref = f"for {team_name}" if team_name else "for the team"
        skill_list = ", ".join(skills)

        if urgency == "critical":
            return (
                f"Critical hire {team_ref}. "
                f"Multiple skill gaps ({skill_list}) indicate no current coverage in this area. "
                f"This role should be prioritized immediately."
            )
        elif urgency == "high":
            return (
                f"High-priority hire {team_ref}. "
                f"Missing {skill_list} creates a significant capability gap. "
                f"Recommend filling within 1-2 months."
            )
        elif urgency == "medium":
            return (
                f"Recommended hire {team_ref}. "
                f"Adding {skill_list} expertise would strengthen the team. "
                f"Can be planned for next quarter."
            )
        else:
            return (
                f"Optional hire {team_ref}. "
                f"{skill_list} would be a nice-to-have addition."
            )

    def _generate_explanation(
        self,
        coverage: float,
        covered_count: int,
        gap_count: int,
        hire_count: int,
        team_name: str,
    ) -> str:
        """Generate overall assessment explanation."""
        team_ref = team_name or "The team"

        parts = [f"{team_ref} covers {coverage:.0f}% of project requirements ({covered_count} of {covered_count + gap_count} skills)."]

        if gap_count == 0:
            parts.append("No skill gaps detected — the team is fully equipped.")
        elif coverage >= 70:
            parts.append(f"Minor gaps in {gap_count} area(s). {hire_count} hire(s) recommended to reach full coverage.")
        elif coverage >= 40:
            parts.append(f"Significant gaps in {gap_count} area(s). {hire_count} hire(s) recommended to strengthen the team.")
        else:
            parts.append(f"Major coverage gaps across {gap_count} skills. {hire_count} hire(s) needed to build core capabilities.")

        return " ".join(parts)
