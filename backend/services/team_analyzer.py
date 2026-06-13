"""
HireSense AI — Team Skill Gap Analyzer
Computes coverage, identifies domain-clustered gaps, generates hire plan.
Works on a per-member team model so it can also surface bus-factor risk
and upskilling opportunities.
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

# Severity weights per domain — a security/devops gap hurts more than a
# trivia gap, so risk-adjusted coverage weights requirements accordingly.
DOMAIN_WEIGHTS = {
    "security": 2.0,
    "devops": 2.0,
    "cloud": 1.5,
    "databases": 1.3,
    "ml_ai": 1.3,
    "backend": 1.2,
}
DEFAULT_WEIGHT = 1.0


class TeamAnalyzer:
    """Analyzes team skills against project requirements to identify gaps."""

    def analyze(
        self,
        members: list,
        project_requirements: list,
        team_name: str = "",
    ) -> dict:
        """
        Full team gap analysis on a per-member team model.

        members: list of {"name": str, "skills": list[str]}
        project_requirements: list[str]

        Returns coverage score, risk-adjusted coverage, gaps clustered by
        domain, per-domain coverage (for the radar), bus-factor risk,
        upskilling suggestions, and a prioritized hire plan.
        """
        # Normalize members
        norm_members = []
        for m in members:
            skills = [normalize_skill(s) for s in m.get("skills", []) if s and s.strip()]
            if not skills and not m.get("name"):
                continue
            norm_members.append({
                "name": m.get("name") or "Team Member",
                "skills": skills,
                "expanded": self._expand_skills(skills),
            })

        # Team-wide skill set (union of all members' expanded skills)
        team_set = set()
        for m in norm_members:
            team_set |= m["expanded"]

        reqs_normalized = [normalize_skill(s) for s in project_requirements if s and s.strip()]
        # De-dup while preserving order
        seen = set()
        reqs_normalized = [r for r in reqs_normalized if not (r in seen or seen.add(r))]

        # Compute coverage
        covered, gaps = self._compute_coverage(team_set, reqs_normalized)

        total = len(reqs_normalized)
        coverage_score = round((len(covered) / total * 100) if total > 0 else 0, 1)

        # Risk-adjusted (severity-weighted) coverage
        weighted_coverage_score = self._weighted_coverage(covered, reqs_normalized)

        # Cluster gaps by domain
        gap_clusters = self._cluster_gaps(gaps)

        # Per-domain coverage breakdown (radar axes)
        domain_coverage = self._domain_breakdown(covered, reqs_normalized)

        # Bus-factor / redundancy risk
        bus_factor = self._compute_bus_factor(norm_members, covered)

        # Upskilling suggestions for lower-urgency gaps
        upskill_suggestions = self._suggest_upskilling(norm_members, gap_clusters)

        # Generate hire plan
        hire_plan = self._generate_hire_plan(gap_clusters, team_name)

        # Generate explanation
        explanation = self._generate_explanation(
            coverage_score, weighted_coverage_score,
            len(covered), len(gaps), len(hire_plan), team_name,
        )

        return {
            "team_name": team_name,
            "coverage_score": coverage_score,
            "weighted_coverage_score": weighted_coverage_score,
            "gap_summary": {
                "total_required": total,
                "covered": len(covered),
                "gaps": len(gaps),
            },
            "covered_skills": sorted(covered),
            "gap_clusters": gap_clusters,
            "domain_coverage": domain_coverage,
            "bus_factor": bus_factor,
            "upskill_suggestions": upskill_suggestions,
            "hire_plan": hire_plan,
            "explanation": explanation,
        }

    def _expand_skills(self, skills: list) -> set:
        """
        Expand a skill list with category-aware aliases.
        e.g. "react" also covers "reactjs", "react.js".
        """
        expanded = set(skills)
        for skill in skills:
            cat = get_skill_category(skill)
            if cat != "other":
                for cat_skill in SKILL_CATEGORIES.get(cat, []):
                    norm = normalize_skill(cat_skill)
                    if norm.startswith(skill) or skill.startswith(norm):
                        expanded.add(norm)
        return expanded

    def _compute_coverage(self, team_set: set, required: list) -> tuple:
        """Check which requirements the (expanded) team set covers."""
        covered = []
        gaps = []
        for req in required:
            if req in team_set:
                covered.append(req)
            else:
                gaps.append(req)
        return covered, gaps

    def _weighted_coverage(self, covered: list, required: list) -> float:
        """Severity-weighted coverage — critical-domain skills count more."""
        if not required:
            return 0.0
        covered_set = set(covered)
        total_weight = 0.0
        covered_weight = 0.0
        for req in required:
            w = DOMAIN_WEIGHTS.get(get_skill_category(req), DEFAULT_WEIGHT)
            total_weight += w
            if req in covered_set:
                covered_weight += w
        return round((covered_weight / total_weight * 100) if total_weight else 0, 1)

    def _domain_breakdown(self, covered: list, required: list) -> list:
        """
        Per-domain coverage % across the required skills.
        Powers the team-composition radar.
        """
        covered_set = set(covered)
        by_domain = {}
        for req in required:
            domain = get_skill_category(req)
            slot = by_domain.setdefault(domain, {"required": 0, "covered": 0})
            slot["required"] += 1
            if req in covered_set:
                slot["covered"] += 1

        result = []
        for domain, counts in by_domain.items():
            pct = round(counts["covered"] / counts["required"] * 100, 1) if counts["required"] else 0
            result.append({
                "domain": domain,
                "label": domain.replace("_", "/").title(),
                "required": counts["required"],
                "covered": counts["covered"],
                "coverage": pct,
            })
        # Stable, readable order
        result.sort(key=lambda d: (-d["required"], d["domain"]))
        return result

    def _compute_bus_factor(self, members: list, covered: list) -> dict:
        """
        For each covered skill, count how many members hold it.
        Skills held by exactly one member are single points of failure.
        """
        skill_holders = {}
        for skill in covered:
            holders = [m["name"] for m in members if skill in m["expanded"]]
            if holders:
                skill_holders[skill] = sorted(set(holders))

        single_points = [
            {"skill": skill, "holder": holders[0]}
            for skill, holders in sorted(skill_holders.items())
            if len(holders) == 1
        ]
        well_covered = [
            {"skill": skill, "holders": holders, "count": len(holders)}
            for skill, holders in sorted(skill_holders.items())
            if len(holders) >= 2
        ]

        # Members who are the sole holder of >=1 skill = key-person risk
        risk_by_member = {}
        for spof in single_points:
            risk_by_member.setdefault(spof["holder"], []).append(spof["skill"])
        key_people = [
            {"name": name, "exclusive_skills": sorted(skills), "count": len(skills)}
            for name, skills in sorted(risk_by_member.items(), key=lambda kv: -len(kv[1]))
        ]

        total = len(skill_holders)
        spof_count = len(single_points)
        if total == 0:
            risk_level = "unknown"
        elif spof_count == 0:
            risk_level = "low"
        elif spof_count / total >= 0.5:
            risk_level = "high"
        else:
            risk_level = "medium"

        return {
            "risk_level": risk_level,
            "single_points_of_failure": single_points,
            "well_covered_skills": well_covered,
            "key_people": key_people,
            "summary": self._bus_factor_summary(risk_level, spof_count, total),
        }

    def _bus_factor_summary(self, risk_level: str, spof_count: int, total: int) -> str:
        if total == 0:
            return "No covered skills to assess for redundancy."
        if spof_count == 0:
            return "Every covered skill is held by at least two members — no key-person risk."
        share = round(spof_count / total * 100)
        return (
            f"{spof_count} of {total} covered skills ({share}%) rely on a single team member. "
            f"Losing that person would open an immediate gap."
        )

    def _suggest_upskilling(self, members: list, clusters: list) -> list:
        """
        For non-critical gaps, suggest upskilling an existing member who
        already knows an adjacent skill in the same domain — cheaper than
        hiring.
        """
        suggestions = []
        for cluster in clusters:
            if cluster["urgency"] == "critical":
                continue  # Critical gaps need a real hire, not an upskill
            domain = cluster["domain"]
            for gap in cluster["skills"]:
                # Find a member with an adjacent skill in the same domain
                candidate = None
                adjacent = None
                for m in members:
                    for s in m["skills"]:
                        if get_skill_category(s) == domain and s != gap:
                            candidate = m["name"]
                            adjacent = s
                            break
                    if candidate:
                        break
                if candidate:
                    suggestions.append({
                        "member": candidate,
                        "current_skill": adjacent,
                        "target_skill": gap,
                        "domain": domain.replace("_", "/").title(),
                        "reason": (
                            f"{candidate} already works in {domain.replace('_', '/').title()} "
                            f"({adjacent}); upskilling to {gap} is faster than a new hire."
                        ),
                    })
        return suggestions

    def _cluster_gaps(self, gaps: list) -> list:
        """Group gaps by skill category/domain and assign urgency."""
        clusters = {}
        for gap in gaps:
            domain = get_skill_category(gap)
            clusters.setdefault(domain, []).append(gap)

        result = []
        for domain, skills in sorted(clusters.items()):
            urgency = self._compute_urgency(domain, skills)
            result.append({
                "domain": domain,
                "label": domain.replace("_", "/").title(),
                "skills": sorted(skills),
                "urgency": urgency,
                "reason": self._urgency_reason(domain, skills, urgency),
            })

        urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        result.sort(key=lambda c: urgency_order.get(c["urgency"], 4))
        return result

    def _compute_urgency(self, domain: str, skills: list) -> str:
        """Determine urgency based on gap count and domain importance."""
        count = len(skills)
        if count >= 3:
            base = "critical"
        elif count == 2:
            base = "high"
        else:
            base = "medium"

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
            justification = self._hire_justification(role, skills, urgency, team_name)
            hire_plan.append({
                "role": role,
                "priority": priority,
                "urgency": urgency,
                "skills_covered": skills,
                "justification": justification,
            })
            priority += 1
        return hire_plan

    def _hire_justification(self, role: str, skills: list, urgency: str, team_name: str) -> str:
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
        weighted: float,
        covered_count: int,
        gap_count: int,
        hire_count: int,
        team_name: str,
    ) -> str:
        """Generate overall assessment explanation."""
        team_ref = team_name or "The team"
        parts = [
            f"{team_ref} covers {coverage:.0f}% of project requirements "
            f"({covered_count} of {covered_count + gap_count} skills)."
        ]

        # Surface risk-adjusted divergence when meaningful
        if weighted and abs(weighted - coverage) >= 8:
            parts.append(
                f"Risk-adjusted coverage is {weighted:.0f}% — gaps are concentrated "
                f"in higher-severity domains."
            )

        if gap_count == 0:
            parts.append("No skill gaps detected — the team is fully equipped.")
        elif coverage >= 70:
            parts.append(f"Minor gaps in {gap_count} area(s). {hire_count} hire(s) recommended to reach full coverage.")
        elif coverage >= 40:
            parts.append(f"Significant gaps in {gap_count} area(s). {hire_count} hire(s) recommended to strengthen the team.")
        else:
            parts.append(f"Major coverage gaps across {gap_count} skills. {hire_count} hire(s) needed to build core capabilities.")

        return " ".join(parts)
