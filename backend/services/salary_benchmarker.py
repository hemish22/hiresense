"""
HireSense AI — Salary Benchmarker
Built-in salary dataset for hire-plan budget estimation.
"""


# Salary data: (role, experience, location) → (min, max, currency, unit)
# INR values in LPA (Lakhs Per Annum), USD values in K (thousands)
SALARY_DATA = {
    # ─── Bangalore ───
    ("DevOps Engineer", "junior", "bangalore"):        (8, 15, "INR", "LPA"),
    ("DevOps Engineer", "mid", "bangalore"):           (15, 26, "INR", "LPA"),
    ("DevOps Engineer", "senior", "bangalore"):        (26, 45, "INR", "LPA"),
    ("Frontend Developer", "junior", "bangalore"):     (6, 12, "INR", "LPA"),
    ("Frontend Developer", "mid", "bangalore"):        (12, 22, "INR", "LPA"),
    ("Frontend Developer", "senior", "bangalore"):     (22, 38, "INR", "LPA"),
    ("Backend Developer", "junior", "bangalore"):      (8, 14, "INR", "LPA"),
    ("Backend Developer", "mid", "bangalore"):         (14, 25, "INR", "LPA"),
    ("Backend Developer", "senior", "bangalore"):      (25, 42, "INR", "LPA"),
    ("Full Stack Developer", "junior", "bangalore"):   (8, 15, "INR", "LPA"),
    ("Full Stack Developer", "mid", "bangalore"):      (15, 28, "INR", "LPA"),
    ("Full Stack Developer", "senior", "bangalore"):   (28, 45, "INR", "LPA"),
    ("ML/AI Engineer", "junior", "bangalore"):         (10, 18, "INR", "LPA"),
    ("ML/AI Engineer", "mid", "bangalore"):            (18, 35, "INR", "LPA"),
    ("ML/AI Engineer", "senior", "bangalore"):         (35, 60, "INR", "LPA"),
    ("Cloud Engineer", "junior", "bangalore"):         (8, 14, "INR", "LPA"),
    ("Cloud Engineer", "mid", "bangalore"):            (15, 28, "INR", "LPA"),
    ("Cloud Engineer", "senior", "bangalore"):         (28, 48, "INR", "LPA"),
    ("Database Engineer", "junior", "bangalore"):      (6, 12, "INR", "LPA"),
    ("Database Engineer", "mid", "bangalore"):         (12, 22, "INR", "LPA"),
    ("Database Engineer", "senior", "bangalore"):      (22, 38, "INR", "LPA"),
    ("Mobile Developer", "junior", "bangalore"):       (6, 12, "INR", "LPA"),
    ("Mobile Developer", "mid", "bangalore"):          (12, 24, "INR", "LPA"),
    ("Mobile Developer", "senior", "bangalore"):       (24, 40, "INR", "LPA"),
    ("Platform Engineer", "junior", "bangalore"):      (8, 14, "INR", "LPA"),
    ("Platform Engineer", "mid", "bangalore"):         (14, 26, "INR", "LPA"),
    ("Platform Engineer", "senior", "bangalore"):      (26, 42, "INR", "LPA"),
    ("Software Engineer", "junior", "bangalore"):      (6, 12, "INR", "LPA"),
    ("Software Engineer", "mid", "bangalore"):         (12, 22, "INR", "LPA"),
    ("Software Engineer", "senior", "bangalore"):      (22, 38, "INR", "LPA"),
    ("Security Engineer", "junior", "bangalore"):      (8, 15, "INR", "LPA"),
    ("Security Engineer", "mid", "bangalore"):         (16, 30, "INR", "LPA"),
    ("Security Engineer", "senior", "bangalore"):      (30, 50, "INR", "LPA"),

    # ─── Delhi/NCR ───
    ("DevOps Engineer", "mid", "delhi"):               (14, 24, "INR", "LPA"),
    ("Frontend Developer", "mid", "delhi"):            (10, 20, "INR", "LPA"),
    ("Backend Developer", "mid", "delhi"):             (12, 22, "INR", "LPA"),
    ("Full Stack Developer", "mid", "delhi"):          (13, 25, "INR", "LPA"),
    ("ML/AI Engineer", "mid", "delhi"):                (16, 32, "INR", "LPA"),
    ("Database Engineer", "mid", "delhi"):             (10, 20, "INR", "LPA"),
    ("Software Engineer", "mid", "delhi"):             (10, 20, "INR", "LPA"),
    ("Security Engineer", "mid", "delhi"):             (14, 28, "INR", "LPA"),

    # ─── Hyderabad ───
    ("DevOps Engineer", "mid", "hyderabad"):           (13, 24, "INR", "LPA"),
    ("Frontend Developer", "mid", "hyderabad"):        (10, 20, "INR", "LPA"),
    ("Backend Developer", "mid", "hyderabad"):         (12, 23, "INR", "LPA"),
    ("Full Stack Developer", "mid", "hyderabad"):      (14, 26, "INR", "LPA"),
    ("ML/AI Engineer", "mid", "hyderabad"):            (16, 33, "INR", "LPA"),
    ("Database Engineer", "mid", "hyderabad"):         (10, 20, "INR", "LPA"),
    ("Software Engineer", "mid", "hyderabad"):         (10, 20, "INR", "LPA"),

    # ─── Mumbai ───
    ("DevOps Engineer", "mid", "mumbai"):              (15, 26, "INR", "LPA"),
    ("Frontend Developer", "mid", "mumbai"):           (11, 22, "INR", "LPA"),
    ("Backend Developer", "mid", "mumbai"):            (13, 24, "INR", "LPA"),
    ("Full Stack Developer", "mid", "mumbai"):         (15, 28, "INR", "LPA"),
    ("ML/AI Engineer", "mid", "mumbai"):               (18, 35, "INR", "LPA"),
    ("Database Engineer", "mid", "mumbai"):            (11, 22, "INR", "LPA"),
    ("Software Engineer", "mid", "mumbai"):            (11, 22, "INR", "LPA"),

    # ─── Pune ───
    ("DevOps Engineer", "mid", "pune"):                (12, 22, "INR", "LPA"),
    ("Frontend Developer", "mid", "pune"):             (9, 18, "INR", "LPA"),
    ("Backend Developer", "mid", "pune"):              (10, 20, "INR", "LPA"),
    ("Full Stack Developer", "mid", "pune"):           (12, 24, "INR", "LPA"),
    ("ML/AI Engineer", "mid", "pune"):                 (15, 30, "INR", "LPA"),
    ("Software Engineer", "mid", "pune"):              (9, 18, "INR", "LPA"),

    # ─── Remote India ───
    ("DevOps Engineer", "junior", "remote_india"):     (7, 13, "INR", "LPA"),
    ("DevOps Engineer", "mid", "remote_india"):        (13, 24, "INR", "LPA"),
    ("DevOps Engineer", "senior", "remote_india"):     (24, 40, "INR", "LPA"),
    ("Frontend Developer", "mid", "remote_india"):     (10, 20, "INR", "LPA"),
    ("Backend Developer", "mid", "remote_india"):      (12, 22, "INR", "LPA"),
    ("Full Stack Developer", "mid", "remote_india"):   (13, 25, "INR", "LPA"),
    ("ML/AI Engineer", "mid", "remote_india"):         (16, 32, "INR", "LPA"),
    ("Database Engineer", "mid", "remote_india"):      (10, 18, "INR", "LPA"),
    ("Mobile Developer", "mid", "remote_india"):       (10, 22, "INR", "LPA"),
    ("Platform Engineer", "mid", "remote_india"):      (12, 24, "INR", "LPA"),
    ("Software Engineer", "mid", "remote_india"):      (10, 20, "INR", "LPA"),
    ("Security Engineer", "mid", "remote_india"):      (14, 26, "INR", "LPA"),

    # ─── US Remote ───
    ("DevOps Engineer", "junior", "us_remote"):        (80, 130, "USD", "K"),
    ("DevOps Engineer", "mid", "us_remote"):           (120, 180, "USD", "K"),
    ("DevOps Engineer", "senior", "us_remote"):        (170, 250, "USD", "K"),
    ("Frontend Developer", "junior", "us_remote"):     (70, 110, "USD", "K"),
    ("Frontend Developer", "mid", "us_remote"):        (100, 160, "USD", "K"),
    ("Frontend Developer", "senior", "us_remote"):     (150, 220, "USD", "K"),
    ("Backend Developer", "junior", "us_remote"):      (75, 120, "USD", "K"),
    ("Backend Developer", "mid", "us_remote"):         (110, 170, "USD", "K"),
    ("Backend Developer", "senior", "us_remote"):      (160, 240, "USD", "K"),
    ("Full Stack Developer", "mid", "us_remote"):      (120, 180, "USD", "K"),
    ("Full Stack Developer", "senior", "us_remote"):   (170, 250, "USD", "K"),
    ("ML/AI Engineer", "junior", "us_remote"):         (90, 140, "USD", "K"),
    ("ML/AI Engineer", "mid", "us_remote"):            (140, 220, "USD", "K"),
    ("ML/AI Engineer", "senior", "us_remote"):         (200, 320, "USD", "K"),
    ("Cloud Engineer", "mid", "us_remote"):            (120, 180, "USD", "K"),
    ("Database Engineer", "mid", "us_remote"):         (100, 160, "USD", "K"),
    ("Mobile Developer", "mid", "us_remote"):          (110, 170, "USD", "K"),
    ("Platform Engineer", "mid", "us_remote"):         (120, 180, "USD", "K"),
    ("Software Engineer", "mid", "us_remote"):         (110, 170, "USD", "K"),
    ("Security Engineer", "mid", "us_remote"):         (130, 200, "USD", "K"),
}

# Location display names
LOCATION_LABELS = {
    "bangalore": "Bangalore",
    "delhi": "Delhi/NCR",
    "hyderabad": "Hyderabad",
    "mumbai": "Mumbai",
    "pune": "Pune",
    "remote_india": "Remote (India)",
    "us_remote": "Remote (US)",
}


class SalaryBenchmarker:
    """Estimates salary ranges for roles using a built-in dataset."""

    def estimate(
        self,
        role: str,
        location: str = "bangalore",
        experience: str = "mid",
    ) -> dict:
        """
        Estimate salary for a given role, location, and experience level.
        Falls back to nearest match if exact entry not found.
        """
        location = location.lower().strip()
        experience = experience.lower().strip()

        # Exact lookup
        key = (role, experience, location)
        entry = SALARY_DATA.get(key)

        # Fallback 1: try "mid" experience
        if not entry and experience != "mid":
            entry = SALARY_DATA.get((role, "mid", location))

        # Fallback 2: try bangalore (largest dataset)
        if not entry and location != "bangalore":
            entry = SALARY_DATA.get((role, experience, "bangalore"))
            if not entry:
                entry = SALARY_DATA.get((role, "mid", "bangalore"))

        # Fallback 3: try Software Engineer as generic role
        if not entry:
            entry = SALARY_DATA.get(("Software Engineer", experience, location))
            if not entry:
                entry = SALARY_DATA.get(("Software Engineer", "mid", "bangalore"))

        if not entry:
            return {
                "role": role,
                "location": LOCATION_LABELS.get(location, location.title()),
                "experience": experience,
                "salary_range": {"min": 0, "max": 0},
                "currency": "INR",
                "formatted": "Data not available",
            }

        min_sal, max_sal, currency, unit = entry

        if currency == "INR":
            formatted = f"₹{min_sal}–{max_sal} LPA"
        else:
            formatted = f"${min_sal}–{max_sal}K"

        return {
            "role": role,
            "location": LOCATION_LABELS.get(location, location.title()),
            "experience": experience,
            "salary_range": {"min": min_sal, "max": max_sal},
            "currency": currency,
            "formatted": formatted,
        }

    def enrich_hire_plan(
        self,
        hire_plan: list,
        location: str = "bangalore",
        experience: str = "mid",
    ) -> dict:
        """
        Add salary estimates to each role in the hire plan.
        Returns enriched plan + total budget impact.
        """
        enriched = []
        total_min = 0
        total_max = 0
        currency = "INR"

        for hire in hire_plan:
            role = hire.get("role", "Software Engineer")
            salary = self.estimate(role, location, experience)

            enriched_hire = {**hire, "salary": salary}
            enriched.append(enriched_hire)

            total_min += salary["salary_range"]["min"]
            total_max += salary["salary_range"]["max"]
            currency = salary["currency"]

        # Format budget
        if currency == "INR":
            budget_formatted = f"₹{total_min}–{total_max} LPA"
        else:
            budget_formatted = f"${total_min}–{total_max}K"

        return {
            "hire_plan": enriched,
            "budget_impact": {
                "total_min": total_min,
                "total_max": total_max,
                "currency": currency,
                "formatted": budget_formatted,
                "location": LOCATION_LABELS.get(location, location.title()),
                "experience": experience,
            },
        }
