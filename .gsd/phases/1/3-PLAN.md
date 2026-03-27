---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: Frontend Shell & Static File Serving

## Objective
Create the frontend HTML/CSS/JS shell with a premium, modern dark-themed dashboard. Two views: Candidate Analysis and Team Analysis, switchable via navigation tabs. The UI should feel production-grade from day one — this is what the hackathon judges see first.

## Context
- .gsd/SPEC.md — Plain HTML/CSS/JS frontend, two user flows
- .gsd/DECISIONS.md — ADR-002 (vanilla frontend)
- backend/main.py — Static file mount at /

## Tasks

<task type="auto">
  <name>Create frontend directory structure and HTML shell</name>
  <files>
    frontend/index.html
    frontend/css/style.css
    frontend/js/app.js
    frontend/js/api.js
  </files>
  <action>
    **Directory structure:**
    ```
    frontend/
    ├── index.html       # Single-page app shell
    ├── css/
    │   └── style.css    # Complete design system
    └── js/
        ├── app.js       # View switching, UI orchestration
        └── api.js       # API client (fetch wrapper)
    ```

    **index.html specifics:**
    - Single HTML page with two switchable views
    - Header: "HireSense AI" branding with icon/logo area
    - Navigation: Two tabs — "🔍 Candidate Analysis" and "🏢 Team Analysis"
    - Candidate Analysis view:
      - Upload area: drag-and-drop zone for resume PDF
      - Text area: paste job description
      - "Analyze" button
      - Results panel (empty placeholder, will be populated in Phase 5)
    - Team Analysis view:
      - Form: team name, team skills (textarea/tags), project requirements (textarea)
      - "Analyze Team" button
      - Results panel (empty placeholder)
    - Footer: "HireSense AI v1.0 • Decision Intelligence for Startups"
    - Load Google Font: Inter or Outfit
    - Meta tags for SEO

    **css/style.css specifics:**
    Create a premium dark-themed design system:
    - CSS custom properties for the full color palette
    - Dark background (#0a0a0f or similar deep navy/black)
    - Accent colors: electric blue (#6366f1 indigo) + emerald green (#10b981) for positive signals
    - Warning: amber (#f59e0b), Error: red (#ef4444)
    - Glassmorphism cards (backdrop-filter: blur, subtle borders)
    - Smooth transitions on all interactive elements (0.2-0.3s ease)
    - Typography: Inter/Outfit from Google Fonts, proper hierarchy (h1-h3, body text)
    - Responsive grid layout (single column on mobile, two-column on desktop)
    - Upload zone: dashed border, hover effect, drag-active state
    - Tab navigation: pill-style tabs with active indicator animation
    - Buttons: gradient backgrounds, hover glow effects
    - Input fields: dark background, subtle border, focus glow
    - Scrollbar styling for webkit
    - Loading spinner/pulse animation (for later use)
    - Status badges (success, warning, error, info) with colored dots

    **js/api.js specifics:**
    - API base URL constant (http://localhost:8000/api)
    - Async functions:
      - checkHealth() — GET /api/health
      - analyzeCandidateStub(formData) — POST /api/candidates/analyze
      - analyzeTeamStub(data) — POST /api/teams/analyze
      - getCandidateHistory() — GET /api/candidates/history
      - getTeamHistory() — GET /api/teams/history
    - Error handling wrapper with user-friendly error messages

    **js/app.js specifics:**
    - Tab switching logic (show/hide views, update active tab)
    - Drag-and-drop file upload handling (visual feedback, file validation — PDF only)
    - Form submission handlers (wired to api.js stubs)
    - Health check on page load (show connection status indicator)
    - Toast notification system for success/error messages

    AVOID:
    - Do NOT use any CSS framework (Tailwind, Bootstrap, etc.)
    - Do NOT make it look basic/minimal — this is a hackathon showcase
    - Do NOT implement actual analysis logic — just wire up the UI to placeholder API
    - Do NOT use generic colors — use a curated, premium palette
  </action>
  <verify>
    # Start backend server and visit http://localhost:8000
    # Verify:
    # 1. Page loads with dark theme
    # 2. Both tabs switch views correctly
    # 3. Upload zone accepts drag & drop
    # 4. Health indicator shows connected
    # 5. Forms submit and show placeholder response
    curl -s http://localhost:8000/ | head -20
  </verify>
  <done>
    - index.html loads at http://localhost:8000/
    - Dark theme with premium glassmorphism design is visible
    - Two tabs (Candidate / Team) switch views
    - Drag-and-drop upload zone works (visual feedback on drag)
    - Job description text area is present
    - Team analysis form has all fields
    - Health check runs on load and shows status
    - All interactive elements have smooth hover/transition effects
    - Responsive layout works on different screen sizes
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Visual verification of frontend shell</name>
  <files>frontend/index.html</files>
  <action>
    Open http://localhost:8000 in a browser and verify:
    1. The design looks premium and hackathon-ready
    2. Dark theme is visually appealing
    3. Tab switching is smooth
    4. Upload drag-and-drop has visual feedback
    5. All text is readable and well-sized
    6. Layout is responsive

    Take a screenshot or use the browser tool for verification.
  </action>
  <verify>Open browser to http://localhost:8000 and capture screenshot</verify>
  <done>User confirms the frontend shell looks premium and functional</done>
</task>

## Success Criteria
- [ ] http://localhost:8000 serves the frontend shell
- [ ] Premium dark-themed design with glassmorphism, smooth animations
- [ ] Two-tab navigation (Candidate Analysis / Team Analysis) works
- [ ] Drag-and-drop upload zone shows visual feedback
- [ ] API client successfully calls health endpoint
- [ ] Design quality is hackathon-presentation-ready
