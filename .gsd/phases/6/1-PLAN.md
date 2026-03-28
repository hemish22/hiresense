---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Next.js + Tailwind + Shadcn Initialization

## Objective
Initialize the new Next.js frontend to replace the legacy Vanilla JS implementation. This sets up the React, TypeScript, Tailwind CSS, and Shadcn UI foundations for building the advanced landing page required by the prompts.

## Context
- .gsd/ROADMAP.md (Phase 6)
- User Prompt containing custom Tailwind `@theme inline` variables.

## Tasks

<task type="auto">
  <name>Rename Legacy Frontend</name>
  <files>frontend</files>
  <action>
    - Rename the existing `frontend` directory to `frontend_legacy` to preserve the original vanilla Implementation without losing data.
  </action>
  <verify>test -d "frontend_legacy"</verify>
  <done>Folder is renamed to `frontend_legacy`.</done>
</task>

<task type="auto">
  <name>Initialize Next.js & Dependencies</name>
  <files>frontend/package.json</files>
  <action>
    - Run `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` to create a modern Next.js 14-15 project.
    - Change directory to `frontend` and install core animation and icon libraries.
    - Run `npm install framer-motion lucide-react @phosphor-icons/react @radix-ui/react-slot class-variance-authority`
  </action>
  <verify>test -f "frontend/package.json"</verify>
  <done>Next.js app initialized with all NPM dependencies successfully installed.</done>
</task>

<task type="auto">
  <name>Configure Shadcn UI & Tailwind Theme</name>
  <files>frontend/src/app/globals.css, frontend/components.json</files>
  <action>
    - Initialize Shadcn via `npx shadcn@latest init -d`.
    - Ensure component paths are set to `/src/components/ui`. This is critical because all shadcn defaults target this structure, allowing automatic component installations and maintaining modular UI organization without clutter.
    - Create `src/components/ui` if absent.
    - Update `frontend/src/app/globals.css` exactly with the color theme variables provided in the user prompt (specifically the `:root`, `.dark` and `@theme inline` blocks).
  </action>
  <verify>test -d "frontend/src/components/ui"</verify>
  <done>Shadcn structural layout configured and global tailored theme variables applied.</done>
</task>

## Success Criteria
- [ ] Next.js app running out of `frontend/` directory.
- [ ] `framer-motion`, `lucide-react`, and `@phosphor-icons/react` are listed as dependencies.
- [ ] Theme configuration precisely follows the provided input format in globals.css.
