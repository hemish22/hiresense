# DECISIONS.md — Architecture Decision Records

## ADR-001: FastAPI Backend
**Date**: 2026-03-27
**Status**: Accepted
**Context**: Need a Python backend framework that supports async, has great ML ecosystem interop, and is hackathon-fast to develop.
**Decision**: Use FastAPI with uvicorn.
**Rationale**: Async support, automatic OpenAPI docs, Pydantic validation, seamless Python ML library integration.

## ADR-002: Plain HTML/CSS/JS Frontend
**Date**: 2026-03-27
**Status**: Accepted
**Context**: Need a frontend approach that's fast to build, has no build step, and works for a hackathon demo.
**Decision**: Use vanilla HTML, CSS, and JavaScript — no framework.
**Rationale**: Zero setup overhead, instant iteration, no dependency management. Can upgrade to a framework later if needed.

## ADR-003: SQLite Database
**Date**: 2026-03-27
**Status**: Accepted
**Context**: Need persistence for analysis results without infrastructure overhead.
**Decision**: Use SQLite via SQLAlchemy.
**Rationale**: Zero-config, file-based, perfect for local-first demo. Trivially swappable for PostgreSQL later.

## ADR-004: Local LLM for Internal Team Data
**Date**: 2026-03-27
**Status**: Accepted
**Context**: Internal team skills and project data is confidential — cannot send to external APIs.
**Decision**: Use local LLM (Ollama / LM Studio) for internal team analysis features.
**Rationale**: Keeps company data on-premise. Achieves confidentiality without sacrificing AI capability.

## ADR-005: GitHub REST API with PAT
**Date**: 2026-03-27
**Status**: Accepted
**Context**: Need to fetch developer activity data from GitHub.
**Decision**: Use GitHub REST API with a Personal Access Token for higher rate limits.
**Rationale**: Simple, well-documented, sufficient for demo. PAT gives 5000 req/hour vs 60 unauthenticated.

## ADR-006: LeetCode GraphQL Endpoint
**Date**: 2026-03-27
**Status**: Accepted
**Context**: LeetCode has no official public API, but community-documented GraphQL endpoints exist.
**Decision**: Use LeetCode's GraphQL endpoint for fetching user problem-solving data.
**Rationale**: Provides structured data (problems by difficulty, submission stats) without scraping HTML.

## ADR-007: Public Salary Datasets for Benchmarking
**Date**: 2026-03-27
**Status**: Accepted
**Context**: Need salary estimation without paid API subscriptions.
**Decision**: Use Levels.fyi public dataset and GitHub Jobs archive for salary ranges.
**Rationale**: Free, credible sources. Combined with skill match + experience + location → market-rate estimation.
