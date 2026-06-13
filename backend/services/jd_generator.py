"""
HireSense AI — Job Description Generator
Template-based JD generation from hire plan entries.
"""

# Responsibility templates by skill
RESPONSIBILITY_TEMPLATES = {
    "docker": "Design, build, and maintain containerized applications using Docker",
    "kubernetes": "Deploy and manage Kubernetes clusters for production workloads",
    "k8s": "Deploy and manage Kubernetes clusters for production workloads",
    "terraform": "Define and maintain infrastructure as code using Terraform",
    "ci/cd": "Build and maintain CI/CD pipelines for automated testing and deployment",
    "aws": "Architect and manage cloud infrastructure on AWS",
    "azure": "Architect and manage cloud infrastructure on Azure",
    "gcp": "Architect and manage cloud infrastructure on Google Cloud Platform",
    "jenkins": "Configure and maintain Jenkins pipelines for continuous integration",
    "github actions": "Set up and maintain GitHub Actions workflows",
    "react": "Build responsive, reusable UI components with React",
    "vue": "Develop interactive frontend interfaces using Vue.js",
    "angular": "Build enterprise-grade frontend applications with Angular",
    "next.js": "Develop server-rendered React applications with Next.js",
    "tailwind": "Implement modern, responsive UI designs with TailwindCSS",
    "node.js": "Build scalable backend services with Node.js",
    "python": "Develop backend services and automation scripts in Python",
    "fastapi": "Build high-performance APIs using FastAPI",
    "django": "Develop full-featured web applications with Django",
    "flask": "Build lightweight API services with Flask",
    "graphql": "Design and implement GraphQL APIs for flexible data access",
    "postgresql": "Design and optimize PostgreSQL database schemas",
    "mongodb": "Manage and optimize MongoDB document databases",
    "redis": "Implement caching and real-time data layers with Redis",
    "elasticsearch": "Set up and manage Elasticsearch for search and analytics",
    "machine learning": "Design and train machine learning models for production use",
    "deep learning": "Build and deploy deep learning models using modern frameworks",
    "tensorflow": "Develop and deploy TensorFlow models for production inference",
    "pytorch": "Build and optimize PyTorch models for research and production",
    "nlp": "Implement NLP pipelines for text analysis and understanding",
    "computer vision": "Build computer vision solutions for image/video processing",
    "react native": "Develop cross-platform mobile apps with React Native",
    "flutter": "Build performant cross-platform mobile apps with Flutter",
    "swift": "Develop native iOS applications using Swift",
    "kotlin": "Build native Android applications using Kotlin",
    "nginx": "Configure and optimize Nginx for production deployments",
    "linux": "Manage and optimize Linux server environments",
    "prometheus": "Set up monitoring and alerting with Prometheus and Grafana",
    "grafana": "Build dashboards and alerts with Grafana",
    "kafka": "Design and manage event-driven architectures with Kafka",
    "microservices": "Design and implement microservices architectures",
    "oauth": "Implement secure authentication flows using OAuth/OIDC",
    "jwt": "Design and implement JWT-based authentication systems",
}

# Requirement templates by skill
REQUIREMENT_TEMPLATES = {
    "docker": "Proficiency in Docker containerization and multi-stage builds",
    "kubernetes": "Experience with Kubernetes orchestration (deployments, services, ingress)",
    "terraform": "Hands-on experience with Terraform for infrastructure provisioning",
    "ci/cd": "Experience building CI/CD pipelines (GitHub Actions, GitLab CI, or Jenkins)",
    "aws": "Strong AWS experience (EC2, S3, RDS, Lambda, ECS/EKS)",
    "react": "Strong proficiency in React.js and modern frontend tooling",
    "vue": "Experience building applications with Vue.js ecosystem",
    "node.js": "Proficiency in Node.js backend development",
    "python": "Strong Python skills for backend development",
    "graphql": "Experience designing and consuming GraphQL APIs",
    "postgresql": "Database design experience with PostgreSQL",
    "redis": "Experience with Redis for caching and pub/sub",
    "mongodb": "Experience with MongoDB and NoSQL data modeling",
    "machine learning": "Experience building and deploying ML models in production",
    "tensorflow": "Proficiency with TensorFlow 2.x for model development",
    "pytorch": "Experience with PyTorch for research and production models",
    "react native": "Experience building cross-platform mobile apps with React Native",
    "flutter": "Proficiency in Flutter and Dart for mobile development",
    "kafka": "Experience with Apache Kafka or similar event streaming platforms",
    "microservices": "Experience designing and operating microservices architectures",
    "linux": "Strong Linux administration and scripting skills",
}

# Role-specific about sections
ROLE_ABOUT = {
    "DevOps Engineer": "We're looking for a DevOps Engineer to build and maintain our infrastructure, CI/CD pipelines, and deployment automation. You'll work closely with the engineering team to ensure reliable, scalable, and secure systems.",
    "Frontend Developer": "We're hiring a Frontend Developer to build beautiful, performant user interfaces. You'll translate designs into pixel-perfect, accessible components and ensure a smooth user experience across devices.",
    "Backend Developer": "We're looking for a Backend Developer to design and build the server-side architecture. You'll develop APIs, manage databases, and ensure our services are fast, reliable, and well-tested.",
    "Full Stack Developer": "We're hiring a Full Stack Developer who can work across the entire stack — from crafting responsive UIs to designing robust backend services and managing databases.",
    "ML/AI Engineer": "We're looking for an ML/AI Engineer to design, train, and deploy machine learning models. You'll work on real-world problems using modern frameworks and turn data into actionable intelligence.",
    "Database Engineer": "We're hiring a Database Engineer to design, optimize, and manage our data infrastructure. You'll ensure data integrity, query performance, and scalable storage solutions.",
    "Mobile Developer": "We're looking for a Mobile Developer to build native or cross-platform mobile applications. You'll create smooth, responsive experiences that users love.",
    "Platform Engineer": "We're hiring a Platform Engineer to build and maintain the tools and systems that empower our engineering team. You'll focus on developer experience, automation, and operational excellence.",
    "Software Engineer": "We're looking for a Software Engineer to join our team and contribute across the stack. You'll design, build, and maintain software that solves real problems for our users.",
    "Cloud Engineer": "We're hiring a Cloud Engineer to design and manage our cloud infrastructure. You'll ensure high availability, cost optimization, and security across our cloud environments.",
    "Security Engineer": "We're looking for a Security Engineer to protect our systems and data. You'll implement security best practices, conduct audits, and respond to threats.",
}


class JDGenerator:
    """Generates ready-to-post job descriptions from hire plan entries."""

    def generate(
        self,
        role: str,
        skills: list,
        team_name: str = "",
    ) -> dict:
        """Generate a complete job description for a role."""
        title = self._make_title(role, team_name)
        about = ROLE_ABOUT.get(role, ROLE_ABOUT["Software Engineer"])
        responsibilities = self._build_responsibilities(skills)
        requirements = self._build_requirements(skills, role)
        nice_to_have = self._build_nice_to_have(skills)
        compensation = self._build_compensation()

        # Build full markdown description
        sections = {
            "about": about,
            "responsibilities": responsibilities,
            "requirements": requirements,
            "nice_to_have": nice_to_have,
            "compensation": compensation,
        }

        description = self._format_markdown(title, sections, team_name)

        return {
            "title": title,
            "description": description,
            "sections": sections,
        }

    def generate_all(
        self,
        hire_plan: list,
        team_name: str = "",
    ) -> list:
        """Generate JDs for all roles in the hire plan."""
        jds = []
        for hire in hire_plan:
            role = hire.get("role", "Software Engineer")
            skills = hire.get("skills_covered", [])

            jd = self.generate(
                role=role,
                skills=skills,
                team_name=team_name,
            )
            jds.append(jd)

        return jds

    def _make_title(self, role: str, team_name: str) -> str:
        """Create JD title."""
        if team_name:
            return f"{role} — {team_name}"
        return role

    def _build_responsibilities(self, skills: list) -> list:
        """Build responsibilities from skill templates."""
        responsibilities = []
        for skill in skills:
            template = RESPONSIBILITY_TEMPLATES.get(skill.lower())
            if template:
                responsibilities.append(template)

        # Add standard responsibilities
        responsibilities.extend([
            "Collaborate with the team on code reviews and technical decisions",
            "Write clean, well-tested, production-ready code",
            "Participate in sprint planning and retrospectives",
        ])

        return responsibilities

    def _build_requirements(self, skills: list, role: str) -> list:
        """Build requirements from skill templates."""
        requirements = []
        for skill in skills:
            template = REQUIREMENT_TEMPLATES.get(skill.lower())
            if template:
                requirements.append(template)

        # Add standard requirements
        requirements.extend([
            "Strong problem-solving skills and attention to detail",
            "Excellent communication and collaboration abilities",
            "Experience with Git and version control best practices",
        ])

        return requirements

    def _build_nice_to_have(self, skills: list) -> list:
        """Build nice-to-have from related skills."""
        from backend.services.skill_dictionary import SKILL_CATEGORIES, get_skill_category

        related = set()
        for skill in skills:
            category = get_skill_category(skill)
            if category != "other" and category in SKILL_CATEGORIES:
                for cat_skill in SKILL_CATEGORIES[category]:
                    if cat_skill not in [s.lower() for s in skills]:
                        related.add(cat_skill)
                        if len(related) >= 5:
                            break
            if len(related) >= 5:
                break

        nice_to_have = [f"Experience with {skill}" for skill in sorted(related)[:5]]
        nice_to_have.append("Contributions to open-source projects")
        return nice_to_have

    def _build_compensation(self) -> str:
        """Build compensation section."""
        return "Competitive salary commensurate with experience, plus equity and benefits."

    def _format_markdown(
        self, title: str, sections: dict, team_name: str
    ) -> str:
        """Format the full JD as markdown."""
        lines = [f"# {title}", ""]

        # About
        lines.append("## About the Role")
        lines.append(sections["about"])
        lines.append("")

        if team_name:
            lines.append(f"You'll be joining **{team_name}** and working closely with the existing engineering team.")
            lines.append("")

        # Responsibilities
        lines.append("## Responsibilities")
        for r in sections["responsibilities"]:
            lines.append(f"- {r}")
        lines.append("")

        # Requirements
        lines.append("## Requirements")
        for r in sections["requirements"]:
            lines.append(f"- {r}")
        lines.append("")

        # Nice to have
        lines.append("## Nice to Have")
        for n in sections["nice_to_have"]:
            lines.append(f"- {n}")
        lines.append("")

        # Compensation
        lines.append("## Compensation")
        lines.append(sections["compensation"])
        lines.append("")

        return "\n".join(lines)
