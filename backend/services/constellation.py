"""
HireSense AI — Candidate Constellation Builder
Projects analyzed candidates into a 3D semantic space for the recruiter
talent map. Candidates are embedded as binary skill fingerprints, reduced to
3D with PCA, and clustered with K-Means. Falls back to an interpretable
field/score layout when there are too few candidates for a stable projection.
"""

import math

from backend.services.skill_dictionary import (
    ALL_SKILLS,
    normalize_skill,
)

# Fixed skill vocabulary → stable fingerprint dimensions.
_VOCAB = sorted(set(normalize_skill(s) for s in ALL_SKILLS))
_VOCAB_INDEX = {s: i for i, s in enumerate(_VOCAB)}

# Minimum candidates needed for a meaningful PCA projection.
_MIN_FOR_PCA = 4

# ── Candidate domain classification (industry/project domains) ──
# slug -> (label, keywords). Priority order: most specific first, so a
# blockchain/CV/health/etc. signal wins over generic web/data signals.
DOMAINS = [
    ("web3_blockchain", "Web3 & Blockchain", [
        "blockchain", "solidity", "ethereum", "web3", "smart contract", "crypto",
        "nft", "defi", "metamask", "hardhat", "truffle", "polygon", "wallet",
    ]),
    ("computer_vision", "Computer Vision", [
        "computer vision", "opencv", "object detection", "image classification",
        "yolo", "segmentation", "image processing", "cnn", "convolutional", "ocr",
    ]),
    ("healthcare", "Healthcare", [
        "healthcare", "medical", "patient", "hospital", "clinical", "diagnosis",
        "biomedical", "ehr", "telemedicine", "pharma", "health record", "disease",
    ]),
    ("sustainability", "Sustainability", [
        "sustainability", "climate", "carbon", "renewable", "solar", "green energy",
        "energy efficiency", "environment", "emissions", "recycling", "clean energy",
    ]),
    ("social_impact", "Social Impact", [
        "social impact", "nonprofit", "ngo", "accessibility", "civic", "welfare",
        "disaster", "volunteer", "education for", "community impact", "inclusion",
    ]),
    ("hardware_iot", "Hardware & IoT", [
        "iot", "arduino", "raspberry pi", "embedded", "firmware", "sensor",
        "microcontroller", "esp32", "robotics", "verilog", "fpga", "hardware",
    ]),
    ("ai_ml", "AI & Machine Learning", [
        "machine learning", "deep learning", "tensorflow", "pytorch", "neural",
        "nlp", "llm", "transformer", "scikit", "keras", "reinforcement", "gpt",
    ]),
    ("data_science", "Data Science", [
        "data science", "data analysis", "pandas", "numpy", "tableau", "power bi",
        "analytics", "statistics", "jupyter", "matplotlib", "etl", "data pipeline",
    ]),
    ("web_development", "Web Development", [
        "react", "next.js", "vue", "angular", "node.js", "express", "django",
        "flask", "fastapi", "typescript", "javascript", "tailwind", "frontend",
        "backend", "rest api", "graphql", "web app", "html", "css",
    ]),
]
_DOMAIN_LABEL = {slug: label for slug, label, _ in DOMAINS}
_DEFAULT_DOMAIN = ("web_development", "Web Development")


def _classify(candidate: dict) -> tuple:
    """Classify a candidate into an industry/project domain (slug, label)."""
    skills = " ".join(normalize_skill(s) for s in candidate.get("skills", []))
    text = (skills + " " + (candidate.get("text") or "")).lower()
    if not text.strip():
        return _DEFAULT_DOMAIN

    best_slug, best_label, best_score = None, None, 0
    for slug, label, keywords in DOMAINS:
        score = sum(text.count(kw) for kw in keywords)
        if score > best_score:
            best_slug, best_label, best_score = slug, label, score

    if best_slug is None:
        return _DEFAULT_DOMAIN
    return best_slug, best_label


def _rand(seed: float) -> float:
    """Deterministic pseudo-random value in [-1, 1] from a seed."""
    x = math.sin(seed * 12.9898) * 43758.5453
    return (x - math.floor(x)) * 2 - 1


def _fingerprint(skills: list) -> list:
    """Binary multi-hot vector over the skill vocabulary."""
    vec = [0.0] * len(_VOCAB)
    for s in skills:
        idx = _VOCAB_INDEX.get(normalize_skill(s))
        if idx is not None:
            vec[idx] = 1.0
    return vec


def _scale_axis(values, target=10.0):
    """Scale a list of values into [-target, target]."""
    lo, hi = min(values), max(values)
    span = hi - lo
    if span < 1e-9:
        return [0.0 for _ in values]
    return [round(((v - lo) / span * 2 - 1) * target, 3) for v in values]


def _base_point(c: dict, field: str, label: str) -> dict:
    return {
        "id": c["id"],
        "name": c["name"],
        "field": field,
        "field_label": label,
        "score": c.get("score", 0),
        "match_score": c.get("match_score", 0),
        "github_username": c.get("github_username"),
        "leetcode_username": c.get("leetcode_username"),
        "applied_job": c.get("applied_job"),
        "top_skills": [normalize_skill(s) for s in c.get("skills", [])[:6]],
        "skill_count": len(c.get("skills", [])),
    }


def _interpretable_layout(candidates: list) -> dict:
    """
    Deterministic fallback: cluster by field around a circle, height by score.
    Works at any N, every axis has plain meaning.
    """
    classified = [(c, _classify(c)) for c in candidates]
    fields = sorted({slug for _, (slug, _) in classified})
    angle_of = {f: (2 * math.pi * i / max(len(fields), 1)) for i, f in enumerate(fields)}
    per_field_seen: dict = {}

    points = []
    for c, (field, label) in classified:
        ang = angle_of[field]
        # Spread same-field candidates along the radius + jitter to de-overlap
        k = per_field_seen.get(field, 0)
        per_field_seen[field] = k + 1
        radius = 6.0 + (k % 5) * 1.3
        score = c.get("score", 0)
        cid = c["id"]
        pt = _base_point(c, field, label)
        pt.update({
            "x": round(math.cos(ang) * radius + _rand(cid * 3 + 1) * 0.9, 3),
            "z": round(math.sin(ang) * radius + _rand(cid * 3 + 2) * 0.9, 3),
            "y": round((score - 50) / 6.0 + _rand(cid * 3 + 3) * 0.6, 3),
            "cluster": field,
        })
        points.append(pt)

    return {
        "layout": "interpretable",
        "count": len(points),
        "fields": fields,
        "points": points,
    }


def build_constellation(candidates: list) -> dict:
    """Build the 3D constellation payload for the talent map."""
    if not candidates:
        return {"layout": "empty", "count": 0, "fields": [], "points": []}

    if len(candidates) < _MIN_FOR_PCA:
        return _interpretable_layout(candidates)

    # Try a semantic PCA projection of skill fingerprints.
    try:
        import numpy as np
        from sklearn.decomposition import PCA
        from sklearn.cluster import KMeans

        X = np.array([_fingerprint(c.get("skills", [])) for c in candidates], dtype=float)

        # Degenerate input (no skills / identical) → fall back
        if X.shape[1] == 0 or float(np.count_nonzero(X)) == 0:
            return _interpretable_layout(candidates)

        coords = PCA(n_components=3, random_state=42).fit_transform(X)

        k = max(2, min(8, len(candidates) // 2))
        labels = KMeans(n_clusters=k, n_init=10, random_state=42).fit_predict(X)

        xs = _scale_axis(coords[:, 0].tolist())
        ys = _scale_axis(coords[:, 1].tolist())
        zs = _scale_axis(coords[:, 2].tolist())

        fields_seen = set()
        points = []
        for i, c in enumerate(candidates):
            field, label = _classify(c)
            fields_seen.add(field)
            cid = c["id"]
            pt = _base_point(c, field, label)
            # Jitter separates candidates with identical skill fingerprints
            # that PCA would otherwise collapse onto the same coordinate.
            pt.update({
                "x": round(xs[i] + _rand(cid * 3 + 1) * 0.8, 3),
                "y": round(ys[i] + _rand(cid * 3 + 2) * 0.8, 3),
                "z": round(zs[i] + _rand(cid * 3 + 3) * 0.8, 3),
                "cluster": int(labels[i]),
            })
            points.append(pt)

        return {
            "layout": "semantic",
            "count": len(points),
            "clusters": k,
            "fields": sorted(fields_seen),
            "points": points,
        }
    except Exception:
        # Any failure (missing libs, numerical issues) → interpretable layout
        return _interpretable_layout(candidates)
