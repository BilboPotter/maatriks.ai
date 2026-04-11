# Homepage Mobile Scannability Implementation Plan

Current production baseline is already pushed to GitHub at commit `bbd8311` (`Fix footer link layout`).

This plan replaces the previous mobile-only rehaul scope.

The active scope is now:
- structured and scannable text blocks for each existing story step
- mobile text-first step layout
- hero/mobile boundary cleanup
- cookie banner reduction on phone

Desktop and mobile story compression are intentionally out of scope.

## Scope

In scope:
- homepage step text hierarchy and copy structure
- homepage mobile journey layout order
- homepage mobile first-view behavior
- homepage cookie-banner presentation on phone

Out of scope:
- store badge destination behavior
- legal pages
- auth flows
- blog structure
- new trust, pricing, FAQ, team, or social-proof sections
- copywriting polish beyond structural placeholders
- merging journey sections into a single desktop system section
- reducing the number of journey sections
- compressing the story on desktop
- compressing the story on mobile

## Current Problems

Observed locally in the existing homepage implementation:

1. Desktop spends too much vertical space on too little new information.
   - This is acknowledged, but not addressed in this plan.
   - No desktop story compression work should be implemented under this scope.

2. The story steps are readable, but not especially scannable.
   - Each step currently uses `number -> title -> paragraph -> support card`, which forces too much sentence reading before the user can extract the point.
   - Source structure: [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html:58).

3. Mobile first view is still too obstructed.
   - The hero is text-led, but the cookie banner still competes with the CTA and preview area.
   - Mobile cookie styles live in [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css:3745).

4. Desktop and mobile are solving the same content problem with too much repetition.
   - This is acknowledged, but the current four-step structure should remain intact in this plan.

5. The current plan assumes desktop must remain visually unchanged.
   - That constraint is no longer valid and should not guide implementation.

## Product Direction

The homepage should behave like this:

1. Hero stays cinematic and high-impact.
2. The existing four-step journey remains four separate steps.
3. The text inside each step becomes visibly structured and easy to skim.
4. Mobile keeps the same overall flow, but each step becomes more text-first and less obstructed.
5. Cookie consent still works, but it should no longer sit on top of the most important mobile content.

## Target Content Pattern For Each Step

Before final copy arrives, every step should use the same structural pattern:

- step number and short label
- one strong headline
- one short supporting sentence
- one compact structured detail group

Recommended structured detail group:
- `Input`
- `What happens`
- `Outcome`

Alternative if the content fits better:
- 3 short bullets with one line each

Example shape:

- `1. Onboarding`
- `Start from your constraints`
- `The app uses your schedule and goal to shape the first week.`
- `Input: frequency, session length, focus`
- `What happens: the system builds your initial structure`
- `Outcome: no generic starting template`

The key rule is:
- do not rely on long paragraphs to communicate the step
- do not rely on the support card to carry the important meaning

## Implementation Strategy

The safest path is:

1. Keep the hero and the existing four-step journey structure.
2. Redesign the step text blocks so they explain themselves quickly.
3. Make the mobile step layout text-first without changing the number of steps.
4. Improve the hero/mobile boundary so the first viewport is more controlled.
5. Reduce mobile obstruction from the cookie banner without changing consent logic.

## Deliverables

### Phase 1: Add Structured, Scannable Step Copy Blocks

Goal:
- make the text blocks easier to skim before final copy is written

Files:
- [astro-src/pages/index.astro](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/astro-src/pages/index.astro)
- [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html)
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)

Tasks:
- replace the current `title + paragraph + support card` step rhythm with a structured pattern
- introduce a reusable step-text layout such as:
  - `.step-kicker`
  - `.step-title`
  - `.step-summary`
  - `.step-meta-list`
  - `.step-meta-row`
- ensure each step block can be understood from headings and labels alone
- keep placeholder copy short and mechanical rather than polished
- treat the current support-card content as structured metadata, not as a second paragraph
- do not merge or remove any of the four step sections
- keep the desktop step order and overall section count intact

Verification:
- each step should still make sense when scanned in 5 to 8 seconds
- the section should work even if the reader does not read every sentence

### Phase 2: Redesign The Mobile Journey For Text-First Reading

Goal:
- keep mobile stacked, but reduce repetition and make the explanation visible faster

Files:
- [astro-src/pages/index.astro](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/astro-src/pages/index.astro)
- [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html)
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)

Tasks:
- keep mobile order as `step -> title -> explanation -> structured details -> visual`
- preserve the mobile preview system that already exists, but make it subordinate to the text block
- tighten vertical spacing between step intro text and preview card
- reduce duplicated support-card treatment on mobile if the structured detail block already communicates the point
- make sure mobile step blocks do not feel like mini-pages
- do not compress multiple steps into a single mobile system section

Verification:
- on phone widths, the user should see the point of the section before the preview dominates the viewport
- mobile sections should feel like a continuous explanation, not four isolated scenes

### Phase 3: Rework The Hero-Mobile Boundary

Goal:
- keep the hero strong while ensuring the first mobile viewport is usable

Files:
- [astro-src/pages/index.astro](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/astro-src/pages/index.astro)
- [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html)
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)
- [src/styles/critical.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/critical.css)

Tasks:
- keep the existing hero message and general visual direction
- make sure the hero CTA area is complete and readable before lower content competes with it
- review whether the mobile hero preview should remain directly visible or sit slightly lower
- if needed, reduce hero preview height or increase separation between CTA and preview

Verification:
- the mobile hero should read clearly as `headline -> lead -> badges`, with preview secondary
- first-view attention should not feel split between CTA, preview, and consent banner

### Phase 4: Make Mobile Consent Less Destructive

Goal:
- keep consent behavior intact while reducing first-view interference

Files:
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)
- [src/styles/critical.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/critical.css) if banner presentation is above-the-fold critical
- [src/scripts/consent.js](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/scripts/consent.js) only if small behavior changes are required

Tasks:
- keep the current accept/decline logic unchanged unless there is a compelling reason to alter it
- reduce visual weight of the banner on phone
- shrink vertical footprint further than the current implementation if necessary
- consider one of these layouts:
  - compact inset card with shorter copy
  - bottom sheet with smaller controls
  - reduced-height bar with stacked action row only if it still reads clearly
- ensure it does not sit directly on top of the hero CTA and first preview content

Verification:
- the first mobile view should remain usable before dismissing consent
- the banner should no longer be one of the dominant visual objects on the screen

## Proposed Homepage Structure After Implementation

Desktop:

1. Hero
2. Step 1
3. Step 2
4. Step 3
5. Step 4
6. Stats
7. Reviews
8. Newsletter
9. Download CTA

Mobile:

1. Hero
2. Step 1
3. Step 2
4. Step 3
5. Step 4
6. Stats
7. Reviews
8. Newsletter
9. Download CTA

The structural change is inside the step content blocks and mobile ordering, not in the number or compression of sections.

## Coding Approach

To keep this maintainable:

1. Do not implement any desktop or mobile story compression under this plan.
2. Keep the hero and lower sections stable unless they directly support the approved scope.
3. Build a reusable step-text pattern instead of writing one-off markup per section.
4. Reuse the existing preview system where it still fits mobile.
5. Keep Astro and legacy page sources in sync.
6. Mirror above-the-fold homepage changes in critical CSS.

## Execution Order

Recommended implementation order:

1. Phase 1: structured step-copy system
2. Phase 2: mobile text-first journey layout
3. Phase 3: hero-mobile boundary cleanup
4. Phase 4: mobile consent cleanup

## Verification Checklist

After each phase:

- `node build.js`
- `npm run astro:build`
- `node verify-build.js`
- `npm run astro:verify`

Visual QA:

- mobile widths: `390`, `375`, `360`, `320`
- desktop widths: `1280`, `1440`

Routes and sections to inspect:

- `/`
- `/#hero`
- `/#step-onboard` if kept
- `/#step-log` if kept
- `/#step-feedback` if kept
- `/#step-results` if kept
- `/#stats`
- `/#reviews`
- `/#newsletter`
- `/#download`

Specific QA checks:

- hero CTA readability on mobile before consent dismissal
- step-block scan speed
- desktop step sections remain intact
- no broken anchor or nav behavior
- no regression to footer, blog, legal, or auth pages

## Success Criteria

- mobile first view is usable even before dismissing consent
- text sections are visibly more structured and scannable
- the adaptive loop is understandable with quick scanning, not only by reading paragraphs
- the existing four-step story remains intact on both desktop and phone
