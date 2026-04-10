# Mobile Rehaul Implementation Plan

Current production baseline is already pushed to GitHub at commit `bbd8311` (`Fix footer link layout`).

This plan is for a mobile-only overhaul of the homepage story flow. Desktop should remain visually unchanged.

## Constraints

- Do not change desktop layout or desktop phone mockups.
- Do not change site routes, auth flows, legal pages, or blog behavior.
- Keep Astro output and legacy build output in parity.
- Restrict visual changes to mobile and small-tablet breakpoints.
- Preserve the overall brand feel: dark canvas, amber accent, technical/product tone.

## Current Mobile Problems

Observed locally on iPhone-sized viewport against `astro-dist`:

1. The phone frames are too narrow on mobile.
   - The outer device shrinks hard at the mobile breakpoint in [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css#L2895), but the internal UI paddings and font sizes stay relatively large in [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css#L1099).

2. The mobile sections lead with a giant phone before the explanation.
   - The current mobile stack is effectively `header -> phone -> body`, so the phone dominates the first screen and the explanation is pushed below the fold.
   - Source structure: [astro-src/pages/index.astro](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/astro-src/pages/index.astro) and [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html).

3. The app screens are too dense for the available mobile marketing space.
   - The current partials are full, literal app screens instead of focused marketing visuals:
   - [src/partials/phone-onboarding.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/partials/phone-onboarding.html)
   - [src/partials/phone-workout.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/partials/phone-workout.html)
   - [src/partials/phone-workout-leg.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/partials/phone-workout-leg.html)
   - [src/partials/phone-feedback.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/partials/phone-feedback.html)
   - [src/partials/phone-dashboard.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/partials/phone-dashboard.html)

4. The hero still feels crowded on first visit.
   - Even after previous cleanup, the phone preview plus store badges plus background plus cookie banner still compete in the first screen on mobile.

5. The cookie banner materially worsens the mobile first-view experience.
   - It takes too much vertical space and covers already cramped sections.
   - Styles: [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css#L2687)

## Implementation Strategy

The safest path is:

1. Keep desktop full-device mockups exactly as they are.
2. Give mobile its own story composition.
3. Use mobile-specific product visuals instead of shrinking the desktop visuals harder.
4. Keep the code modular by isolating mobile-only product previews and mobile-only layout rules.

## Deliverables

### Phase 1: Rebuild Mobile Section Architecture

Goal:
- Every mobile section should read as `step -> title -> short explanation -> product visual -> support card`.

Files:
- [astro-src/pages/index.astro](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/astro-src/pages/index.astro)
- [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html)
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)
- [src/styles/critical.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/critical.css)

Tasks:
- Keep desktop DOM structure unchanged where possible.
- On mobile, change journey section grid areas from `header / phone / body` to `header / body / phone`.
- Ensure the first explanatory paragraph is visible above the phone on small screens.
- Reduce per-section top and bottom padding so the transition between sections feels tighter.

Verification:
- `#step-onboard`, `#step-log`, `#step-feedback`, and `#step-results` must all show title plus explanation before the phone dominates the viewport.

### Phase 2: Introduce Mobile-Specific Product Visuals

Goal:
- Stop using full tall desktop mockups as the primary mobile visual language.

Files to add:
- `src/partials/phone-onboarding-mobile.html`
- `src/partials/phone-workout-mobile.html`
- `src/partials/phone-feedback-mobile.html`
- `src/partials/phone-results-mobile.html`

Files to update:
- [astro-src/pages/index.astro](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/astro-src/pages/index.astro)
- [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html)
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)

Tasks:
- Add a dedicated mobile visual variant for each story step.
- These should be shorter product windows or cropped screen cards, not full 390x844 framed phones.
- Desktop keeps the existing `.device` mockups.
- Mobile uses a new visual wrapper such as `.story-visual-mobile`.

Content rules for each mobile visual:
- Onboard: question title + one selected option
- Log workout: one exercise header + 2-3 set rows
- Feedback: key metrics + first coach note
- Results: streak + compact calendar or monthly volume block

Verification:
- Mobile product visuals must fit comfortably in one viewport without tiny or crowded text.

### Phase 3: Add a Dedicated Mobile Product-Preview System

Goal:
- Make the mobile visuals easy to maintain without touching the desktop phone system.

Files:
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)
- Optional new partial helper styles section near existing device styles

Tasks:
- Add a separate style namespace for mobile previews, for example:
  - `.preview-shell`
  - `.preview-card`
  - `.preview-metric-row`
  - `.preview-choice`
  - `.preview-list-row`
- Do not overload `.device`, `.screen-scroll`, and the existing app-screen classes for mobile marketing previews.
- Keep the mobile preview system independent so new steps can be added later without reworking the desktop mockups.

Verification:
- The CSS for mobile previews should be isolated and readable.
- Desktop `.device` rules should not be affected.

### Phase 4: Rework the Hero for Mobile

Goal:
- The first mobile viewport should be text-led and controlled.

Files:
- [astro-src/pages/index.astro](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/astro-src/pages/index.astro)
- [src/pages/index.html](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/pages/index.html)
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)
- [src/styles/critical.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/critical.css)

Tasks:
- Keep the existing desktop hero composition.
- On mobile, reduce the visual weight of the product mockup in the hero.
- Use either:
  - a compact cropped preview below the CTA area, or
  - a much shorter framed phone section with only the top of the app visible.
- Ensure the headline, lead, and store badges remain readable without the phone colliding into them.

Verification:
- The hero should feel finished before the phone enters.
- The CTA area should remain visible even with the cookie banner present.

### Phase 5: Make the Cookie Banner Less Destructive on Mobile

Goal:
- Keep consent behavior, reduce viewport damage.

Files:
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)
- [src/scripts/consent.js](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/scripts/consent.js) only if behavior changes are required

Tasks:
- Keep the banner functional.
- Shorten the copy on mobile styling treatment.
- Reduce vertical padding and button footprint.
- Consider a more compact inset layout on phone instead of a full-width heavy bar.

Verification:
- The banner should no longer cover critical portions of the mobile hero and journey previews.

### Phase 6: Tighten the Mobile Rhythm of the Lower Sections

Goal:
- Make the rest of the page feel intentionally paced on phone.

Files:
- [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css)

Tasks:
- Reduce spacing between the story sections and the following stats/reviews sections on mobile.
- Ensure the visual hierarchy remains:
  - story section
  - proof/stats
  - reviews
  - newsletter/download
- Review card heights, section padding, and inter-section gaps on phone.

Verification:
- Scrolling down the page should feel continuous rather than sectionally overpadded.

## Coding Approach

To keep this modular and easy to maintain:

1. Do not mutate the existing desktop phone partials to fit mobile.
2. Add dedicated mobile preview partials instead of overloading one markup set for all contexts.
3. Group all mobile-only preview CSS under a clearly labeled section in [src/styles/main.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/main.css).
4. Mirror any hero-above-the-fold changes in [src/styles/critical.css](/Users/reioinnos/Project Claude/projects/maatriks/maatriks/src/styles/critical.css).
5. Update both Astro and legacy page sources together to preserve build parity.

## Execution Order

Recommended implementation order:

1. Phase 1: mobile section architecture
2. Phase 2: mobile-specific visuals
3. Phase 3: mobile preview style system
4. Phase 4: hero mobile rework
5. Phase 5: cookie banner mobile cleanup
6. Phase 6: lower-section rhythm cleanup

## Verification Checklist

After each phase:

- `node build.js`
- `npm run astro:build`
- `node verify-build.js`
- `npm run astro:verify`

Visual QA after major phases:

- `390px` wide
- `375px` wide
- `360px` wide
- `320px` wide

Routes/anchors to inspect:

- `/`
- `/#hero`
- `/#step-onboard`
- `/#step-log`
- `/#step-feedback`
- `/#step-results`

Desktop regression check:

- `1280px` and `1440px` widths
- Header/footer alignment
- Hero layout
- Existing journey sections
- Blog unaffected

## Success Criteria

- Mobile no longer feels like the desktop page stacked vertically.
- No phone mockup looks unnaturally slim or text-crammed.
- Every mobile section explains itself before the product visual takes over.
- The hero has one clear focal point.
- Cookie consent no longer destroys the first-visit mobile experience.
- Desktop remains visually unchanged.
