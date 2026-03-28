---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: Dash Architecture & APIs

## Objective
Establish the Next.js `dashboard` route structure, set up the Next.js API proxy to communicate with the FastAPI backend unhindered by CORS/ports, and install the additional Shadcn UI elements required.

## Context
- `frontend/next.config.ts`
- FastAPI backend runs on `127.0.0.1:8000/api`
- Next.js dev server runs on `3000`.

## Tasks

<task type="auto">
  <name>Configure API Proxy & Utilities</name>
  <files>frontend/next.config.ts, frontend/src/lib/api.ts</files>
  <action>
    - Add an async `rewrites()` rule in `next.config.ts` mapping `/api/:path*` to `http://127.0.0.1:8000/api/:path*`.
    - Create `frontend/src/lib/api.ts` with typed Fetch wrappers for `uploadCandidate` and `analyzeTeam` pointing to the `/api/*` routes.
  </action>
  <verify>grep -q "rewrites" "frontend/next.config.ts"</verify>
  <done>Next config correctly forwards `/api/` traffic to local port 8000.</done>
</task>

<task type="auto">
  <name>Install Dashboard Prerequisites</name>
  <files>frontend/package.json</files>
  <action>
    - Use `npx shadcn@latest add card input label tabs textarea progress badge alert scroll-area separator` to install forms and presentation layers.
  </action>
  <verify>test -f "frontend/src/components/ui/card.tsx"</verify>
  <done>Fundamental UI layout primitives installed natively into `components/ui`.</done>
</task>

<task type="auto">
  <name>Create Dashboard Root Layout</name>
  <files>frontend/src/app/dashboard/layout.tsx, frontend/src/app/dashboard/page.tsx</files>
  <action>
    - Scaffold `layout.tsx` with a minimal App header (Link back to `/`).
    - Scaffold `page.tsx` utilizing Shadcn generic `<Tabs>` pointing to `Candidate` and `Team` forms.
  </action>
  <verify>test -f "frontend/src/app/dashboard/page.tsx"</verify>
  <done>User can navigate from `/` to `/dashboard` and see a tabbed structural foundation.</done>
</task>

## Success Criteria
- [ ] Next.js app seamlessly proxies API calls to FastAPI.
- [ ] Shadcn core view components configured.
- [ ] Dashboard root URL is visually accessible.
