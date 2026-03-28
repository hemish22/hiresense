---
phase: 6
plan: 3
wave: 2
---

# Plan 6.3: Master Landing Page Assembly

## Objective
Combine the UI building blocks into a functional, highly-polished landing page (`BackgroundPaths`, `HeroSection`) matching exactly the requested aesthetic layout.

## Context
- User Prompt containing `background-paths.tsx` and `hero-section-1.tsx` implementations.
- Phosphor and Lucide React specifications.

## Tasks

<task type="auto">
  <name>Implement BackgroundPaths Graphics</name>
  <files>frontend/src/components/ui/background-paths.tsx</files>
  <action>
    - Create `background-paths.tsx` inside `/src/components/ui/`.
    - Paste the user's explicit code for FloatingPaths and BackgroundPaths.
  </action>
  <verify>test -f "frontend/src/components/ui/background-paths.tsx"</verify>
  <done>Animated SVG paths configured to run as a Framer Motion loop.</done>
</task>

<task type="auto">
  <name>Implement HeroSection</name>
  <files>frontend/src/components/blocks/hero-section-1.tsx</files>
  <action>
    - Create `/src/components/blocks/hero-section-1.tsx`. 
    - Paste the `HeroSection` and `HeroHeader` code from the user prompt. 
    - **Note:** The user requested "Use lucide-react icons for svgs or logos if component requires them." Ensure imports point to the correct `lucide-react` icons (e.g. `ArrowRight`, `ChevronRight`).
  </action>
  <verify>test -f "frontend/src/components/blocks/hero-section-1.tsx"</verify>
  <done>HeroSection successfully orchestrates structural header, hero title, and customer banner.</done>
</task>

<task type="auto">
  <name>Assemble the Master Landing Page</name>
  <files>frontend/src/app/page.tsx</files>
  <action>
    - Replace `app/page.tsx` base template with the newly built components.
    - Stack `<BackgroundPaths />` and `<HeroSection />`. (The prompt implies using both: `HeroSection` offers the header layout while `BackgroundPaths` is a background component. Actually, the BackgroundPaths is its own standalone demo element in the prompt, rendering "Background Paths" text. We will implement both distinctly to show they are working, or blend them dynamically to present the best aesthetic.)
    - Remove ANY emojis throughout the UI string blocks.
  </action>
  <verify>grep -q "HeroSection" "frontend/src/app/page.tsx"</verify>
  <done>Full visual landing page dynamically rendered over `/` next route.</done>
</task>

## Success Criteria
- [ ] No emojis present in UI templates.
- [ ] Phosphor or Lucide icons successfully handling SVGs.
- [ ] Complete `page.tsx` integrating both Hero and Background features efficiently.
