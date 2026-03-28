---
phase: 6
plan: 2
wave: 1
---

# Plan 6.2: Core Animated Components Setup

## Objective
Establish the foundational design system components (`Button`, `TextEffect`, `AnimatedGroup`) which will serve as building blocks for the Hero and Background graphics.

## Context
- User Prompt containing component code (`button`, `text-effect`, `animated-group`).
- `frontend/src/components/ui/` destination folder.

## Tasks

<task type="auto">
  <name>Implement Shadcn Custom Button</name>
  <files>frontend/src/components/ui/button.tsx</files>
  <action>
    - Create the `button.tsx` file inside `src/components/ui/`.
    - Copy exactly the Shadcn button code snippet provided by user.
  </action>
  <verify>test -f "frontend/src/components/ui/button.tsx"</verify>
  <done>Button component correctly exposes variants and standard sizes.</done>
</task>

<task type="auto">
  <name>Implement ibelick/text-effect</name>
  <files>frontend/src/components/ui/text-effect.tsx</files>
  <action>
    - Create `text-effect.tsx` in `src/components/ui/`.
    - Paste the code provided by the user. Ensure `'use client'` is active at the top.
  </action>
  <verify>test -f "frontend/src/components/ui/text-effect.tsx"</verify>
  <done>TextEffect module handles text staggering and framer motion variations.</done>
</task>

<task type="auto">
  <name>Implement ibelick/animated-group</name>
  <files>frontend/src/components/ui/animated-group.tsx</files>
  <action>
    - Create `animated-group.tsx` in `src/components/ui/`.
    - Paste the code provided by the user to handle grouped staggered animations.
  </action>
  <verify>test -f "frontend/src/components/ui/animated-group.tsx"</verify>
  <done>AnimatedGroup component manages staggered container reveals.</done>
</task>

## Success Criteria
- [ ] Base foundational components (`Button`, `TextEffect`, `AnimatedGroup`) exist inside `.tsx` files inside `components/ui`.
- [ ] No compilation or missing dependency errors on React imports.
