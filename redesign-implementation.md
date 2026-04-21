# Landing Page Phone Redesign Implementation Plan

## Purpose

This document is the implementation companion to `redesign.md`.

`redesign.md` explains what is wrong.
This file explains how to fix it without creating a second drift cycle.

The focus is execution, sequencing, ownership, and validation for the homepage phone renders.

This plan assumes:

- the phone redesign is the priority
- website copy matching is the last phase
- the landing page should move closer to the real app's visual mechanics
- the supplied real app screenshots are now the primary visual target for hero, onboarding, workout, summary, and dashboard where code inspection alone is ambiguous

## Primary Outcome

The homepage should end up with:

- one phone render system, not separate desktop and mobile inventions
- phone screens that feel like the actual product, not marketing illustrations
- mobile layouts that prioritize the phone itself
- bottom-right faded background imagery over mostly black UI surfaces
- screenshot-faithful screen surfaces for the states we have real app captures for
- CTA/tabbar treatment decided by the actual app reference first, not by stale mock assumptions
- preserved existing website copy until the final cleanup phase

## Implementation Progress

- [x] Step 1 complete: the homepage no longer relies on the separate mobile preview-card phone path. Desktop and mobile now use the same canonical phone partials, the responsive section order places the phone before the support card on smaller screens, and the obsolete `preview-*.html` files plus their unused CSS have been removed from the repo.
- [x] Step 2 complete: the phone shell now uses a black-first background system with the image anchored to the bottom-right and faded across the left side, matching the app's atmospheric treatment much more closely than the old full-cover wallpaper approach.
- [x] Step 3 complete: the section markers now top-align with the heading block and the number scale no longer overwhelms or sags beside multiline titles.
- [x] Step 4 complete: the hero phone now renders the screenshot-backed `Full Body C` workout preview state instead of active logging, with the in-phone action and bottom nav following the real app capture.
- [x] Step 5 complete: the workout, summary, dashboard, and onboarding phones were rebuilt around real app screenshots and current app mechanics, with stable set-column geometry and screenshot-faithful footer surfaces where present.
- [x] Screenshot pass complete for 5 screens: after receiving real Expo screenshots, hero, onboarding, workout, dashboard, and summary were rebuilt again to match the actual app states more closely.

## Completed Work Log

This section records what has actually shipped in the current implementation pass.

### Step 1 shipped: one phone system

Files changed:

- `astro-src/pages/index.astro`
- `src/styles/main.css`
- `src/styles/critical.css`
- deleted: `src/partials/preview-loop-mobile.html`
- deleted: `src/partials/preview-onboarding-mobile.html`
- deleted: `src/partials/preview-workout-mobile.html`
- deleted: `src/partials/preview-feedback-mobile.html`
- deleted: `src/partials/preview-results-mobile.html`

What changed:

- mobile and desktop now render the same canonical phone partials instead of separate conceptual screens
- the phone appears before the support card on smaller layouts
- the unused mobile preview-card system was fully removed instead of being left dormant in the repo

Why this matters:

- it closes the biggest structural drift source from the previous homepage
- future phone changes now happen in one place instead of being split across desktop and mobile inventions

### Screenshot-driven pass shipped: real app captures now drive all five requested phone states

Files changed:

- `src/partials/phone-workout.html`
- `src/partials/phone-onboarding.html`
- `src/partials/phone-workout-leg.html`
- `src/partials/phone-dashboard.html`
- `src/styles/main.css`
- `src/styles/critical.css`
- `astro-src/pages/index.astro`

What changed:

- the provided Expo screenshots replaced earlier assumptions as the source of truth for hero, onboarding, workout, summary, and dashboard
- hero now matches the real `Full Body C` preview state, including the weekly strip, coach review row, primary action, and bottom navigation
- onboarding now matches the experience-level step instead of the previously assumed session-duration step
- workout logging now matches the real `Full Body C` active session composition instead of the older timeline-based mock
- summary now matches the reflection-first session review layout, including the Safari status treatment, total-volume block, compact stat row, exercise recap, and `Save & close` action
- dashboard now matches the current level-progress and calendar layout instead of the earlier streak-first concept

Current limitation:

- dashboard still uses a compressed month/list balance to keep the `Recent` section visible inside the marketing device frame
- outer marketing copy is still intentionally unchanged

Important note:

- this screenshot-driven pass supersedes the earlier no-CTA/no-tabbar assumption for every screen we now have a real capture for
- if the landing page should intentionally simplify those surfaces later, that should be a separate design choice after screenshot parity is established

### Step 2 shipped: app-like background composition

Files changed:

- `src/styles/main.css`
- `src/styles/critical.css`

What changed:

- the phone screen is now black-first instead of wallpaper-first
- the gym image is anchored to the bottom-right
- the image is treated as atmosphere through explicit opacity and sizing controls
- the left side now fades aggressively into black, with additional top and bottom shading

App comparison:

- this follows the composition logic in `../maatriks/src/lib/viewportBackgrounds.ts`
- it moves the landing page away from the old full-cover wallpaper treatment that made the phones feel like posters instead of app screens

### Step 3 shipped: section number alignment and scale

Files changed:

- `src/styles/main.css`

What changed:

- the step number was increased in size
- the heading row alignment was changed from center-weighted positioning to top alignment against the headline block
- spacing between number and heading was adjusted for desktop and mobile

Result:

- the section number now reads as part of the heading block rather than a detached ornament hanging too low beside the title

### Step 4 shipped: hero moved to workout preview

Files changed:

- `src/partials/phone-workout.html`
- `src/styles/main.css`
- `src/styles/critical.css`

What changed:

- the hero no longer shows active set logging
- the hero now shows a screenshot-backed preview state with eyebrow, title, exercise count, week progress, coach review row, primary action, and bottom navigation

App comparison:

- this follows the split in `../maatriks/src/features/workout/screens/WorkoutScreen.tsx` between preview and active states
- the landing page now uses the correct narrative hierarchy: hero equals preparation, section 2 equals logging

Revision after screenshots:

- the first implementation used a simplified preview mock
- after the real Expo capture arrived, the hero was rebuilt around the actual `Full Body C` preview state, including the surfaces that were previously removed by assumption

### Step 5 shipped: target phone fidelity pass

Files changed:

- `src/partials/phone-workout-leg.html`
- `src/partials/phone-feedback.html`
- `src/partials/phone-dashboard.html`
- `src/partials/phone-onboarding.html`
- `src/styles/main.css`

What changed in the workout phone:

- set rows were rebuilt around stable column geometry instead of loose flex spacing
- weight and reps now use explicit field-width classes for alignment
- the visible state now matches the real `Full Body C` logging screen, including the active/inactive set dots, `Add set`, `Add note`, and bottom navigation
- the view now reads as a real logging surface instead of a marketing approximation

What changed in the summary phone:

- the screen now follows the supplied real summary screenshot instead of the earlier coach-note card mock
- the hierarchy is now reflection copy first, then total volume, compact stats, visible exercise recap, and `Save & close`
- Safari/browser context is represented explicitly because it is part of the supplied source image

What changed in the dashboard phone:

- the screen now follows the supplied level-progress plus calendar composition
- the bottom navigation is present because it exists in the real screenshot
- calendar density and recent-list visibility were balanced against the device-frame height

What changed in the onboarding phone:

- the old duration example was discarded
- the phone now uses the real experience-level step with `New` selected and the `Continue` action visible

Revision after screenshots:

- onboarding no longer uses the duration step as the phone example
- the phone now matches the real experience-level step from the supplied Expo capture
- summary is no longer pending; all five requested phone states now have screenshot-backed references

App comparison:

- workout row mechanics were checked against `../maatriks/src/features/workout/components/WorkoutExerciseCard.tsx`
- preview hierarchy was checked against `../maatriks/src/features/workout/screens/WorkoutScreen.tsx`
- dashboard structure was checked against `../maatriks/src/features/dashboard/screens/DashboardScreen.tsx`, `DashboardLevelHero.tsx`, and `DashboardCalendar.tsx`
- summary and dashboard still borrow spacing/background discipline from the app even where the landing-page crop is optimized for the marketing device frame

## Validation Record

The current redesign pass was validated repeatedly during implementation.

- `npm run build`
- `npm run verify`

Render review was also performed against local screenshots taken from the built site in desktop and mobile viewports after the phone-system consolidation.

The screenshot-driven pass was additionally reviewed against isolated local captures of the phone elements and compared directly to the supplied Expo screenshots for:

- hero preview
- onboarding experience step
- active workout logging
- workout reflection summary
- dashboard

## Non-Negotiable Constraint

Do not start with copy work.

Copy changes are deliberately last because the current problem is not wording first. It is fidelity, hierarchy, layout mechanics, and responsive execution.

If copy is changed too early:

- visual issues get masked by content churn
- comparisons become harder
- design review turns subjective too soon
- implementation loses a stable baseline

This plan treats copy in three categories:

### In-scope before final phase

- UI labels inside phone renders that are required for product fidelity
- stale option labels such as onboarding duration values
- stale in-phone metadata when needed to match the target render

### Out of scope until the last phase

- hero headline
- journey section headings and summaries
- support-card marketing copy
- reviews section copy
- FAQ copy
- newsletter/download copy

## Current Architecture Summary

The implementation plan has to respect the real build surface, not an imagined React component tree.

## 1. Astro is now the single homepage build path

The homepage now builds from Astro only:

- Astro build via `astro-src/pages/index.astro`

This removes the old parity burden from homepage work. Structural changes only need to land in the Astro path now, while shared partials and styles remain the canonical content sources.

Relevant files:

- `astro-src/pages/index.astro`
- `verify-astro-output.mjs`

## 2. Partials remain shared

The actual phone markup comes from `src/partials/*.html`, loaded by:

- `astro-src/components/LegacyPartial.astro`
- `astro-src/lib/legacy.mjs`

This means:

- the partials must become the canonical phone source
- page templates should not wire different conceptual screens for desktop and mobile

## 3. CSS is shared, and `critical.css` is part of the first-paint path

The repo currently ships:

- `src/styles/main.css`
- `src/styles/critical.css`

`critical.css` is not decorative. It is read and inlined by the asset manifest pipeline used by both build systems.

Relevant files:

- `lib/shared/assets.js`
- `astro-src/lib/public-assets.mjs`

Implementation consequence:

- if hero shell or phone shell changes happen only in `main.css`, the page can still flash the old hero/device layout on first paint
- any hero, phone shell, or key layout change that affects above-the-fold render must be reflected in `critical.css`

This is a hard requirement.

## 4. The old dual phone system has been removed

The homepage now renders one canonical set of phone partials:

- `phone-workout.html`
- `phone-onboarding.html`
- `phone-workout-leg.html`
- `phone-feedback.html`
- `phone-dashboard.html`

The deleted `preview-*.html` mobile concept cards are no longer part of the page architecture.

Implementation consequence:

- desktop and mobile now share the same conceptual screens
- future redesign work only has one phone source of truth

## 5. Mobile order now prioritizes the phone

In `main.css`, the small-screen `journey-inner` flow now places the phone before the support card:

- `header`
- `copy`
- `phone`
- `support`

Implementation consequence:

- the most product-specific visual element appears earlier on mobile
- support copy no longer pushes the phone below the initial story flow

## Source Of Truth Hierarchy

Use this hierarchy during implementation to resolve ambiguity.

## Level 1: app mechanics

Borrow from the app for:

- spacing discipline
- background composition rules
- numeric field alignment logic
- tone and typography balance
- shell and surface behavior

Source files:

- `../maatriks/src/components/ui/ViewportBackground.tsx`
- `../maatriks/src/lib/viewportBackgrounds.ts`
- `../maatriks/src/features/workout/components/WorkoutExerciseCard.tsx`
- `../maatriks/src/components/ui/InlineSetField.tsx`
- `../maatriks/src/features/workout/components/WorkoutHeader.tsx`
- `../maatriks/src/features/onboarding/components/steps/OnboardingChoiceStep.tsx`
- `../maatriks/src/components/ui/ChoiceCardGroup.tsx`
- `../maatriks/src/theme/index.ts`

## Level 2: supplied target renders

Use the supplied screenshots as the primary visual target for:

- hero workout preview
- onboarding experience-level step
- section 2 workout composition
- section 3 summary composition
- section 4 dashboard composition
- step number size/alignment behavior

This is necessary because code inspection alone does not resolve crop, spacing, footer-surface, and background-treatment details reliably enough.

## Level 3: current landing-page copy and section structure

Keep the page narrative and copy structure intact until the last phase.

This means:

- do not rewrite the section messaging while screen fidelity is still in flux
- focus the early phases on the phone system and layout behavior

## In-Scope Work

## Required by the brief

- fix step number alignment/scale in section 2 heading
- convert hero phone to workout preview
- rebuild section 2 workout phone so it matches the target render and aligns like the app
- rebuild section 3 summary phone to match the screenshot-backed render
- rebuild section 4 dashboard phone to match the screenshot-backed render
- analyze app mismatches and implement against the agreed hierarchy

## Strongly recommended in the same pass

- replace the separate mobile preview-card system
- reorder mobile sections so phone comes before support card
- replace stale onboarding examples with screenshot-backed app truth
- rebuild phone background treatment to match app logic
- remove obsolete phone CSS that no longer maps to shipped phone states

## Out of scope until final phase

- rewriting marketing copy across the page
- redesigning reviews/newsletter/download sections
- changing product positioning
- changing the app itself in `../maatriks`

## Key Design/Implementation Decisions

These should be treated as defaults unless a later requirement overrides them.

## Decision 1: desktop and mobile must use the same conceptual screens

There should be one canonical phone definition per state.

Bad:

- desktop = real phone mock
- mobile = abstract concept card

Good:

- desktop and mobile both render the same screen state
- differences are scaling, cropping, order, and shell behavior only

## Decision 2: CTA and tabbar surfaces follow screenshot truth

Do not make blanket assumptions about removing or keeping interactive surfaces.

Instead:

- keep them when they are clearly visible in the supplied real app screenshot
- remove them only when they are absent from the target state or clearly hurt readability in the marketing crop

The page is selling product trust first, so screenshot fidelity wins over earlier simplification rules.

## Decision 3: hero must show preparation, not logging

The hero line "Just show up. We'll handle the plan." supports a prepared-session screen, not an active set-entry screen.

Therefore:

- hero uses workout preview
- section 2 uses workout logging

This separation is important for narrative clarity.

## Decision 4: summary and dashboard intentionally follow the target renders more than the current app

This needs to stay explicit during implementation.

The current app summary and dashboard do not match the supplied target screenshots.

Working assumption for this implementation:

- summary phone follows the supplied screenshot composition
- dashboard phone follows the supplied screenshot composition
- spacing/background/number discipline still borrow from the app

## Decision 5: phone backgrounds should follow the app's composition rule

The landing page should move from full-cover wallpaper behavior to app-style composition:

- black base
- image anchored bottom-right
- image treated as atmosphere
- strong left fade
- top and bottom shading

## Current Screen Ownership

The homepage is now organized around one canonical screen partial per phone state:

- `src/partials/phone-workout.html`: screenshot-backed hero preview for `Full Body C`
- `src/partials/phone-onboarding.html`: screenshot-backed experience-level step
- `src/partials/phone-workout-leg.html`: screenshot-backed active workout logging screen
- `src/partials/phone-feedback.html`: screenshot-backed reflection summary screen
- `src/partials/phone-dashboard.html`: screenshot-backed dashboard screen

Shared page wiring lives in:

- `astro-src/pages/index.astro`

Shared phone shell and screen styling lives in:

- `src/styles/main.css`
- `src/styles/critical.css`

This is the key structural correction. Future phone changes should happen here instead of creating a second mobile-only visual system.

## Current Styling Model

The phone redesign now follows a consistent three-layer model:

### Shell

Owns:

- outer device frame
- island
- status treatment
- footer action/tabbar containers

Implemented in:

- `main.css`
- `critical.css`

### Background

Owns:

- black-first canvas
- bottom-right background image placement
- left fade
- top and bottom shading

Implemented in:

- screen-specific CSS variable overrides in `main.css`
- mirrored first-paint rules in `critical.css`

### Screen content

Owns:

- titles
- metrics
- rows
- notes
- calendar
- exercise recaps

Implemented in:

- the individual `phone-*.html` partials
- their screen-specific CSS blocks

## File-Level Outcome

## `astro-src/pages/index.astro`

Current state:

- desktop and mobile both point at the same canonical phone partials
- aria labels now describe the screenshot-backed phone states more accurately

## `src/partials/phone-workout.html`

Current state:

- hero shows the real `Full Body C` preview state
- weekly strip, coach review row, primary action, and bottom nav match the supplied screenshot

## `src/partials/phone-onboarding.html`

Current state:

- duration-step drift is gone
- the phone now shows the real experience-level question with `New` selected and `Continue` visible

## `src/partials/phone-workout-leg.html`

Current state:

- set rows use stable column geometry
- weight and reps align cleanly
- the rendered state matches the supplied `Full Body C` active workout screenshot much more closely than the old timeline-based mock

## `src/partials/phone-feedback.html`

Current state:

- the old coach-card summary mock was fully replaced
- the phone now uses the reflection-first summary hierarchy from the supplied screenshot
- total volume, stat row, exercise recap, and `Save & close` footer action are part of the current render

## `src/partials/phone-dashboard.html`

Current state:

- the old streak-first concept has been replaced
- the phone now follows the supplied level-progress plus calendar dashboard layout
- recent-workout visibility was balanced against the device-frame height

## `src/styles/main.css` and `src/styles/critical.css`

Current state:

- both files now contain the current phone-shell, screenshot-surface, and background-composition logic
- summary-specific and screenshot-specific states are mirrored so the first paint and final render do not diverge

## Remaining Work

The redesign is materially implemented, but there are still two reasonable follow-up passes if tighter fidelity is needed.

## 1. Pixel-tight screenshot parity pass

Most of the requested phone states are now in the right structural family.
The remaining gains are smaller:

- dashboard calendar/list density can still be tuned further if exact line-for-line parity matters
- summary exercise-row spacing can still be tightened if the target crop needs to be matched even more aggressively
- status-area/browser-context details can be refined if future screenshots come from a slightly different capture environment

This is no longer architecture work.
It is a controlled fidelity pass.

## 2. Final copy alignment pass

This remains intentionally last.

Still deferred:

- hero headline alignment to the shipped hero phone
- journey section summary copy alignment to the screenshot-backed phone states
- support-card copy review

## Updated Validation Plan

## Build validation

Use:

- `npm run build`
- `npm run verify`

These now cover the production Astro path directly.

## Manual visual validation

Check at relevant desktop and phone-like widths:

- hero shows preview state, not active logging
- step number aligns with the heading block instead of sagging beside it
- onboarding matches the experience-level screenshot
- workout rows keep clean numeric alignment
- summary exposes reflection, total volume, stats, and visible exercise recap above the footer action
- dashboard shows level hero, calendar, and recent history inside the same device frame
- mobile places the phone before the support card
- phone backgrounds remain black-first with the image treated as atmosphere

## Current Risks

## Risk 1: screenshot drift returns through ad-hoc edits

If later homepage edits change phone copy, spacing, or footer surfaces without referencing app screenshots again, the page can drift back into a parallel product language.

## Risk 2: `main.css` and `critical.css` fall out of sync

If future hero/device work lands in only one stylesheet, first paint can diverge from the settled render.

## Risk 3: copy cleanup starts changing phone truth

The remaining copy pass should change surrounding marketing text first.
It should not casually rewrite in-phone UI labels that are there for screenshot fidelity.

## Updated Definition Of Done

For the phone redesign phase, done now means:

- desktop and mobile use the same canonical phone system
- hero is a workout preview
- section 2 number alignment is fixed
- onboarding, workout, summary, and dashboard phones are all screenshot-backed
- active workout rows align cleanly
- phone backgrounds use bottom-right faded imagery over mostly black surfaces
- mobile places the phone before the support card
- `main.css` and `critical.css` are consistent for the redesigned first-paint experience
- `npm run build` and `npm run verify` pass
- copy cleanup remains a later, explicit phase

## Recommendation

Treat the current state as the new baseline.

The structural redesign work is already done:

- one phone system
- screenshot-backed states
- app-like background composition
- corrected heading alignment

From here, future work should be incremental and evidence-driven:

- tighten screenshot parity when a specific mismatch is visible
- do copy cleanup only after visual fidelity decisions are settled
