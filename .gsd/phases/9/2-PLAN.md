# Plan 9.2: Implement Shadcn Radar Chart and Verification Badges

## Objective
Revamp the `CandidateView` UI report by replacing the legacy radar chart with the dynamic "Radar Chart - Dots" design, and display real-time tracking badges for the system's asynchronous background tools (GitHub, LeetCode, Gemini).

## Context
The current candidate analysis output returns nested objects detailing GitHub hits (`github_analysis`), LeetCode solving history (`leetcode_analysis`), and the semantic assessment engine utilized (`scoring.skill_match.details.engine`). A visual badge block is required for UX clarity.

## Tasks
1. Build a localized `ChartRadarDots` inner-component in `CandidateView.tsx`.
    - Map the `labelMap` output to expected `config` keys (e.g., `frontend: { label: "Frontend", color: "var(--chart-1)" }`).
    - Pass `radarData` to the new `ChartContainer` UI.
2. Develop a `VerificationBadges` component.
    - Track `result.github_analysis` — showing a `<CheckCircle2>` (success), `<MinusCircle>` (not found), or `<XCircle>` (error).
    - Track `result.leetcode_analysis` — identical tracking logic.
    - Track Gemini Intelligence via `result.scoring?.skill_match?.details?.engine === "gemini"`.
3. Integrate these badges immediately contiguous to the Executive Summary or Match Score sections.
