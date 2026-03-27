"""
HireSense AI — Skill Dictionary
Comprehensive mapping of technical skills for resume matching.
"""

SKILL_CATEGORIES = {
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c",
        "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala",
        "r", "matlab", "perl", "lua", "dart", "elixir", "haskell",
        "objective-c", "sql", "html", "css", "sass", "less",
        "bash", "shell", "powershell",
    ],
    "frontend": [
        "react", "reactjs", "react.js", "angular", "angularjs", "vue",
        "vue.js", "vuejs", "svelte", "next.js", "nextjs", "nuxt",
        "nuxt.js", "gatsby", "tailwind", "tailwindcss", "bootstrap",
        "material ui", "chakra ui", "jquery", "redux", "zustand",
        "webpack", "vite", "rollup", "storybook", "three.js",
    ],
    "backend": [
        "node.js", "nodejs", "express", "express.js", "fastapi", "flask",
        "django", "spring", "spring boot", "rails", "ruby on rails",
        "laravel", "asp.net", ".net", "gin", "fiber", "actix",
        "nestjs", "koa", "hapi", "fastify", "graphql",
    ],
    "databases": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
        "elasticsearch", "cassandra", "dynamodb", "firebase", "supabase",
        "neo4j", "couchdb", "influxdb", "mariadb", "oracle",
        "sql server", "cockroachdb", "prisma", "sequelize", "mongoose",
    ],
    "devops": [
        "docker", "kubernetes", "k8s", "aws", "amazon web services",
        "azure", "gcp", "google cloud", "terraform", "ansible",
        "jenkins", "github actions", "gitlab ci", "ci/cd", "nginx",
        "apache", "linux", "ubuntu", "centos", "helm", "istio",
        "prometheus", "grafana", "datadog", "new relic",
        "cloudflare", "vercel", "netlify", "heroku", "render",
    ],
    "ml_ai": [
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "scikit-learn", "sklearn", "keras", "pandas", "numpy", "scipy",
        "nlp", "natural language processing", "computer vision", "opencv",
        "llm", "large language model", "transformers", "hugging face",
        "huggingface", "bert", "gpt", "langchain", "openai",
        "stable diffusion", "generative ai", "reinforcement learning",
        "neural network", "cnn", "rnn", "lstm", "gan",
        "data science", "data analysis", "data engineering",
        "spark", "hadoop", "airflow", "dbt", "tableau", "power bi",
        "matplotlib", "seaborn", "plotly",
    ],
    "mobile": [
        "react native", "flutter", "ios", "android", "swift ui",
        "swiftui", "jetpack compose", "xamarin", "ionic", "capacitor",
        "expo", "mobile development",
    ],
    "tools": [
        "git", "github", "gitlab", "bitbucket", "jira", "confluence",
        "figma", "sketch", "adobe xd", "postman", "insomnia",
        "kafka", "rabbitmq", "celery", "websocket", "rest api",
        "restful", "microservices", "monorepo", "agile", "scrum",
        "tdd", "bdd", "unit testing", "integration testing",
        "jest", "pytest", "mocha", "cypress", "selenium",
        "playwright", "puppeteer",
    ],
    "security": [
        "oauth", "oauth2", "jwt", "authentication", "authorization",
        "encryption", "ssl", "tls", "https", "cors", "csrf",
        "penetration testing", "owasp", "cybersecurity",
    ],
}

# Flattened set for fast lookup
ALL_SKILLS = set()
for category_skills in SKILL_CATEGORIES.values():
    ALL_SKILLS.update(category_skills)

# Build a sorted list for consistent iteration
ALL_SKILLS_LIST = sorted(ALL_SKILLS)


def normalize_skill(skill: str) -> str:
    """Normalize a skill name for matching."""
    return skill.lower().strip().replace("-", " ").replace("_", " ")


def find_skills_in_text(text: str) -> list[str]:
    """
    Find all skills mentioned in a text.
    Returns deduplicated, sorted list of matched skills.
    """
    text_lower = text.lower()
    found = set()

    for skill in ALL_SKILLS:
        # For multi-word skills, check exact phrase
        if " " in skill or "." in skill:
            if skill in text_lower:
                found.add(skill)
        else:
            # For single-word skills, check word boundaries
            # This avoids matching "r" inside "react" etc.
            import re
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                found.add(skill)

    return sorted(found)


def get_skill_category(skill: str) -> str:
    """Get the category a skill belongs to."""
    normalized = normalize_skill(skill)
    for category, skills in SKILL_CATEGORIES.items():
        if normalized in skills:
            return category
    return "other"
