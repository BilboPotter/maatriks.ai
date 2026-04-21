# Landing Page Phone Redesign Audit

## Purpose

This document is a source-of-truth audit for the phone renders on the `maatriks.ai` landing page, with special focus on the five requested fixes:

1. section number alignment and scale in "Track what actually happened"
2. section 2 workout phone matching the target workout render, especially set row alignment
3. section 3 summary phone matching the target summary render, with no CTA and no tabbar
4. section 4 dashboard phone matching the target dashboard render, with no CTA and no tabbar
5. hero phone changing to a workout preview, with no CTA and no tabbar

This also audits the actual app in `../maatriks/app` and `../maatriks/src` to identify where the current landing page has drifted away from the real product.

The goal is not a vague design critique. The goal is to define exactly what is wrong, why it is wrong, what the app currently does, what your supplied target renders are asking for, and how the landing page should be rebuilt so the phone views stop feeling fake.

## What Was Reviewed

### Landing page code

- `astro-src/pages/index.astro`
- `src/partials/phone-workout.html`
- `src/partials/phone-workout-leg.html`
- `src/partials/phone-feedback.html`
- `src/partials/phone-dashboard.html`
- `src/partials/phone-onboarding.html`
- `src/partials/preview-loop-mobile.html`
- `src/partials/preview-workout-mobile.html`
- `src/partials/preview-feedback-mobile.html`
- `src/partials/preview-results-mobile.html`
- `src/partials/preview-onboarding-mobile.html`
- `src/styles/main.css`
- `astro-src/lib/legacy.mjs`

### Actual app code

- `../maatriks/app/(tabs)/workout.tsx`
- `../maatriks/app/(tabs)/dashboard.tsx`
- `../maatriks/app/onboarding.tsx`
- `../maatriks/app/workout-summary/[id].tsx`
- `../maatriks/app/(tabs)/_layout.tsx`
- `../maatriks/src/components/ui/ViewportBackground.tsx`
- `../maatriks/src/lib/viewportBackgrounds.ts`
- `../maatriks/src/features/workout/screens/WorkoutScreen.tsx`
- `../maatriks/src/features/workout/screens/WorkoutSummaryScreen.tsx`
- `../maatriks/src/features/workout/components/WorkoutExerciseCard.tsx`
- `../maatriks/src/components/ui/InlineSetField.tsx`
- `../maatriks/src/features/workout/components/WorkoutHeader.tsx`
- `../maatriks/src/features/workout/lib/workoutCopy.ts`
- `../maatriks/src/features/workout/lib/summary.ts`
- `../maatriks/src/features/dashboard/screens/DashboardScreen.tsx`
- `../maatriks/src/features/dashboard/components/DashboardLevelHero.tsx`
- `../maatriks/src/features/dashboard/components/DashboardCalendar.tsx`
- `../maatriks/src/features/dashboard/lib/dashboardViewModel.ts`
- `../maatriks/src/features/onboarding/lib/onboardingCopy.ts`
- `../maatriks/src/components/ui/ChoiceCardGroup.tsx`
- `../maatriks/src/features/navigation/components/TabBar.tsx`

## Executive Conclusion

The landing page currently has a structural fidelity problem, not just a polish problem.

It is rendering three different product languages at once:

- desktop phone mocks built as old custom HTML scenes
- mobile phone replacements built as simplified "preview cards"
- a real app in `../maatriks` that has already evolved past both of those systems

Because of that, the phones do not feel like the actual app. They feel like marketing illustrations of an earlier product idea.

The biggest problem is not one broken row or one wrong label. The biggest problem is that the website no longer has a single truth for what a "maatriks screen" is.

Right now:

- the desktop hero uses `phone-workout.html`
- mobile hero swaps to `preview-loop-mobile.html`
- section 2 desktop uses `phone-workout-leg.html`
- section 2 mobile swaps to `preview-workout-mobile.html`
- section 3 desktop uses `phone-feedback.html`
- section 3 mobile swaps to `preview-feedback-mobile.html`
- section 4 desktop uses `phone-dashboard.html`
- section 4 mobile swaps to `preview-results-mobile.html`

That means each step has two unrelated render systems. The desktop version and mobile version are not the same screen scaled differently. They are different artifacts with different structure, different hierarchy, different spacing logic, different typography logic, and sometimes different product meaning.

This is the root cause of the current mismatch.

## Most Important Truth: The Supplied Target Renders And The Current App Are Not The Same Thing

This needs to be explicit before any redesign work starts.

The screenshots you supplied are coherent with each other, but they do **not** fully match the current shipped app code in `../maatriks`.

### Example 1: workout active screen

Your supplied target workout screen shows:

- title `Leg Day A`
- meta line `legs · 2026-04-09`
- label `4 planned lifts`
- exercise blocks with set rows inline under each exercise

The current app in `WorkoutScreen.tsx` does not render the active session like that. In current app code:

- active mode uses `WorkoutHeader eyebrow={workoutCopy.active.label} title={sessionHeading}`
- `workoutCopy.active.label` is `Session`
- there is no screenshot-style `legs · 2026-04-09`
- there is no top `4 planned lifts`
- the app uses `WorkoutExerciseCard` blocks with right-aligned fields and a `Finish session` CTA at the bottom

So if the landing page is rebuilt to match your supplied screenshot exactly, that will be closer to your target render system than to the current active workout implementation in the app.

### Example 2: summary screen

Your supplied target summary screen shows:

- `Back`
- `Session Summary`
- `Push Day A`
- `09. Apr 2026`
- a top three-metric row
- a coach notes card
- an exercise list immediately underneath

The current app summary in `WorkoutSummaryScreen.tsx` is different:

- eyebrow is `Session complete · {heading}`
- the hero is reflection-first
- there is a "Reflection / Maatriks" section
- there is a large total volume block
- metric rail is `Sets / Exercises / PRs`
- footer contains a `Done` button

So the current site mock already diverges from the app, but even the current site mock still is not a faithful execution of your target screenshot.

### Example 3: dashboard screen

Your supplied target dashboard shows:

- `7 day streak`
- `Longest 14`
- XP progress bar
- a calendar with filled green workout-day circles
- monthly comparison figures at the bottom

The current app dashboard in `DashboardScreen.tsx` is different:

- hero is `Level {n}`
- supporting value is `+{weeklyVolume} kg this week`
- calendar uses dot markers, not filled green circles
- recent workout list is prominent
- optional session CTA is at the bottom

So the landing page cannot simultaneously "match the app exactly" and "match the screenshot exactly" for section 4. Those are two different targets.

## Decision Rule For This Redesign

For the phone redesign, use this order of truth:

1. **Interaction and layout grammar should come from the current app code wherever possible.**
2. **The visual target for the specific four requested screens should follow your supplied screenshots where the app has clearly drifted.**
3. **The landing page should not invent a third system.**

In practical terms:

- keep the app's spacing logic, background logic, and field alignment logic where possible
- use the supplied screenshots as the target composition for hero, section 2, summary, and dashboard
- omit CTA buttons and tabbars on the marketing page even if the app currently includes them

That is the only coherent way to satisfy the request.

## Current Landing Page Architecture Problems

## 1. Desktop and mobile phones are not the same product render

This is the most damaging structural issue.

Desktop screens:

- `phone-workout.html`
- `phone-onboarding.html`
- `phone-workout-leg.html`
- `phone-feedback.html`
- `phone-dashboard.html`

Mobile screens:

- `preview-loop-mobile.html`
- `preview-onboarding-mobile.html`
- `preview-workout-mobile.html`
- `preview-feedback-mobile.html`
- `preview-results-mobile.html`

These mobile files are not scaled app screens. They are abstract card summaries. They are effectively mini infographics.

Consequences:

- the desktop and mobile experiences tell different stories
- mobile loses authenticity first, because it no longer looks like a screen from the app
- every phone state must be maintained twice
- drift becomes guaranteed

### Recommendation

Remove the conceptual distinction between "desktop phone mock" and "mobile preview card."

The mobile versions should be the same screens, just scaled and cropped differently. The landing page should have one screen definition per state, not two.

## 2. The current page still contains obsolete phone UX

Examples in the current website mocks:

- `Submit workout` CTA in workout mocks
- bottom nav row in summary mock
- old custom tabbar styles still present in CSS
- onboarding duration options `45 / 60 / 75 / 90`
- summary and dashboard structures that are no longer backed by real app components

This creates the impression that the product has not been designed intentionally.

### Recommendation

Remove all CTA and tabbar surfaces from the marketing phones for this pass.

The marketing page should show:

- the state itself
- the information hierarchy
- the product logic

It should not spend visual budget on actions the user explicitly asked to remove.

## 3. The phone background treatment is wrong relative to the app

Current website CSS uses:

- `background-size: cover`
- `background-position: center`
- layered scrims over a full-screen background image

The real app uses a much more specific atmospheric system in `ViewportBackground.tsx`:

- solid black canvas base
- photo image placed at `right bottom`
- image constrained to roughly `76%` width and `62%` height
- strong left-to-right fade that keeps most of the viewport dark
- top shade and bottom shade overlays

This matters because the background is part of the product identity.

The current website backgrounds make the phones feel like wallpaper screens.
The app backgrounds make the phones feel like dark UI with a photographic ghost in the lower-right.

### Recommendation

The landing page phone backgrounds should be rebuilt around the app rule:

- mostly black screen
- photo anchored bottom-right
- hard fade to black across the left majority of the frame
- enough image to create atmosphere, not enough to compete with UI

This matches both the app code and your stated direction about the photo being a faded element in the lower-right.

## Requested Fix Audit

## 1. Section number alignment and scale in "Track what actually happened"

### Current issue

The number `2` does not feel integrated with the heading. It reads like a small marker dropped beside the headline instead of part of the title composition.

### Current implementation causing it

In `src/styles/main.css`:

- `.journey-header` uses `flex-direction: row`
- `.journey-header` uses `align-items: flex-end`
- `.journey-header h2` uses a very tight `line-height: 0.95`
- `.step-number` uses `font-size: clamp(22px, 3vw, 30px)`

This creates two problems:

- the number anchors to the bottom edge of the heading block instead of aligning to the visual headline mass
- the number is much smaller than the perceived scale of the heading

On the supplied target render, the number reads like a deliberate section marker that shares the same optical rhythm as the heading. In the current site, it feels secondary and too low.

### What the target is asking for

The number should:

- sit higher relative to the first headline line
- be optically heavier
- feel intentional, not incidental
- preserve the mono accent style but carry more visual authority

### Redesign direction

- align the number to the first-line/top portion of the headline block rather than the bottom edge
- increase scale so it stands up to the heading mass
- tighten the horizontal relationship between number and title
- do not let responsive behavior push the number too low on mobile

### Acceptance criteria

- section numbers read as part of the title composition, not detached labels
- number `2` does not feel undersized beside the section 2 headline
- desktop and mobile both maintain the same alignment logic

## 2. Section 2 phone should match the workout render, especially set row alignment

### Current website state

`src/partials/phone-workout-leg.html` is already the closest of the current mocks to your target, but it still misses the target in important ways:

- it still includes a fake bottom note and `Submit workout`
- set rows are laid out with custom HTML that does not follow the real app field geometry
- numeric alignment is wrong
- unit labels and rep labels do not sit in stable columns
- the overall row rhythm feels hand-assembled rather than app-derived

### Why the alignment looks wrong

The current website CSS uses:

- `.set-row { display: flex; gap: 12px; }`
- `.inline-field { display: flex; align-items: flex-end; gap: 6px; }`
- `.inline-input { width: 64px; text-align: center; }`

The real app uses a different system:

- `InlineSetField` uses `textAlign: 'right'`
- `InlineSetField` uses tabular numerals
- weight and rep widths are fixed separately
- suffixes are separate elements, not visually fused to the numeric content
- `WorkoutExerciseCard` defines weight width `74` and reps width `58`
- the rep field is right-justified by design

That is the exact reason the website rows look soft and uneven. The website is centering numbers inside generic inline groups, while the app is using column discipline.

### Additional mismatch between screenshot and app

Your supplied screenshot shows:

- `Leg Day A`
- `legs · 2026-04-09`
- `4 planned lifts`

The current app active screen does not actually use that header structure anymore. It uses a simpler active `WorkoutHeader`.

So this landing page section should be treated as a marketing render of the workout logging state, using the screenshot composition but app-like field geometry.

### Exact redesign direction

- keep the supplied screen composition and exercise sequence
- remove the CTA and home/tabbar language entirely
- rebuild the set row layout to behave like the app:
- left dot / set label / weight field / reps field / tail spacer
- right-align numbers
- give `kg` and `reps` stable suffix columns
- use tabular number styling
- preserve incomplete row emphasis through underline state, not through random opacity tricks
- keep the active row focused, but do not add a finish CTA

### Acceptance criteria

- all weight values align in a clear weight column
- all unit labels align in a consistent unit column
- all rep values align in a clear rep column
- all rep suffixes align consistently
- changing from `95` to `122.5` does not visually break the row
- the screen looks like a real app UI, not a hand-built illustration

## 3. Summary phone should match the target render, with no CTA and no tabbar

### Current website state

`src/partials/phone-feedback.html` is closer to the screenshot than the real app, but it still has fidelity issues:

- spacing is too even and generic
- metric rhythm is not sharp enough
- bottom nav row is unnecessary and incorrect for the requested scope
- the card and list structures still feel like a marketing approximation

### Current app mismatch

The real app summary in `WorkoutSummaryScreen.tsx` is now a different experience:

- reflection-first hero
- total volume block
- metric rail `Sets / Exercises / PRs`
- recap list
- footer button

That means the current site summary is neither fully app-faithful nor fully target-faithful.

### What the supplied screenshot is asking for

The target summary render has a very specific feel:

- top-left back affordance
- restrained section label
- strong title/date block
- top metric rail with thin separators
- one anchored coach note card
- exercise list visible immediately after the note
- no action clutter

It is intentionally editorial. The note card is the hero, not the CTA.

### Redesign direction

- keep the summary as a static recap screen
- remove the bottom nav row completely
- do not add any CTA
- make the metrics row tighter and more architectural
- tighten label spacing and use the screenshot's proportion balance
- keep the coach note card as the main visual mass
- use the same bottom-right faded background treatment as the app

### Acceptance criteria

- the summary screen immediately reads as the supplied target render
- there is no bottom navigation language
- there is no action button
- the screen still feels like maatriks, not a random dashboard card

## 4. Dashboard phone should match the target render, with no CTA and no tabbar

### Current website state

`src/partials/phone-dashboard.html` is overloaded.

It currently includes:

- streak block
- progress bar
- calendar
- monthly volume comparison
- PR-style list block
- recent workout list block

That is too much for a single marketing screen. It tries to show every possible data type instead of showing the most legible product state.

### Why it fails visually

- the eye does not know whether the hero is the streak, the calendar, the volume numbers, or the lists
- the lower half becomes list-heavy and dull
- the screenshot target is much cleaner and more singular

### Current app mismatch

The current app dashboard is not streak-first anymore. It is:

- week eyebrow
- level / XP hero
- calendar with tiny dot markers
- recent workout list
- optional session CTA

So again, the screenshot target and the app are different systems.

### What the target render is asking for

The supplied dashboard render makes a different choice:

- streak first
- XP second
- calendar third
- month comparison last
- no recent list noise

This is a much stronger landing page story than the current overloaded mock.

### Redesign direction

- match the supplied streak/XP/calendar/volume composition
- remove both list blocks from the current website mock
- remove any CTA
- remove any tabbar
- keep the calendar as a focal object, not a utility widget
- keep monthly comparison visible at the bottom, but do not bury it under extra rows

### Additional mismatch to watch

The real app calendar uses tiny dots, not filled green day circles. If the landing page uses filled green day circles to match the screenshot, this is an intentional marketing divergence from the current app. That is acceptable as long as it is deliberate and not accidental.

### Acceptance criteria

- dashboard phone shows only the target hierarchy
- no recent-workout list
- no PR list
- no CTA
- no tabbar
- the calendar occupies enough vertical space to matter

## 5. Hero should change to workout preview, with no CTA and no tabbar

### Current website state

The hero currently uses `phone-workout.html`, which is not a true preview. It is an active workout log scene with:

- completed and pending sets
- multiple exercise entries
- notes line
- `Submit workout`

That is the wrong hero state for the current story.

The hero headline says:

- "Just show up. We'll handle the plan."

That copy implies a preview state, not an in-progress logging state.

### Current app truth

The current app does have a clear preview state in `WorkoutScreen.tsx` when `session.status === 'planned'`:

- eyebrow via `formatTrainingWeekEyebrow()`
- label `Today`
- title `sessionHeading`
- subtitle like `{n} exercises`
- optional `WeekStratum`
- optional `Coach review`
- bottom `Start session` CTA

This is the correct conceptual basis for the hero.

### Requested landing page adaptation

You explicitly want:

- workout preview
- no CTA
- no tabbar

So the hero should borrow the preview hierarchy from the app, but suppress the action surfaces.

### Redesign direction

- replace active logging hero with planned-session preview
- hero should show the state before the workout begins
- do not show `Start session`
- do not show tabbar
- do not show logging fields
- hero should communicate "your session is ready" rather than "you are mid-workout"

### Acceptance criteria

- the hero phone clearly reads as a prepared workout preview
- it visually supports the headline
- it does not look like section 2 duplicated

## App-vs-Web Mismatch Audit By Screen

## Hero / workout preview

### Current app

- preview exists as a real state
- title hierarchy is strong
- week context exists
- background treatment is current

### Current website

- hero uses active logging state instead of preview
- mobile hero swaps to an abstract card called `Adaptive loop`
- desktop and mobile hero do not even represent the same concept

### Required correction

Use one real preview render for both desktop and mobile.

## Onboarding

### Current app

- duration choices are `30 / 40 / 50 / 60 / 70 min`
- choice cards are bordered, not divider-list rows
- selected state uses orange border and subtle fill

### Current website

- duration choices are `45 / 60 / 75 / 90`
- layout is older list-row treatment
- mobile version is also stale

### Required correction

Even though onboarding is not in the five requested fixes, it is already visibly stale versus the app. It should be updated in the same redesign pass or it will remain an obvious weak point.

## Workout logging

### Current app strengths to borrow

- right-aligned numeric fields
- stable weight/reps widths
- suffixes separated from values
- active state discipline
- cleaner field hierarchy

### Current website weaknesses

- center-aligned numeric values
- generic separators
- fake bottom CTA
- extra note line that dilutes the exercise stack

### Required correction

Keep the screenshot composition, but borrow the real app's set-row logic.

## Summary

### Current app strengths to borrow

- typography and spacing language
- background treatment
- label hierarchy

### Current website weaknesses

- bottom nav row
- slightly generic metric rail
- weaker overall composition control

### Required correction

Use the screenshot structure, but render it with app-faithful tone and spacing discipline.

## Dashboard

### Current app strengths to borrow

- restrained calendar typography
- dark visual system
- spacing rhythm

### Current website weaknesses

- too many content blocks
- tries to show too much product at once
- lower half becomes cluttered

### Required correction

Use the screenshot hierarchy and simplify aggressively.

## Mobile Audit

This deserves its own section because the mobile phones are the weakest part of the current landing page.

## Mobile problem 1: the phone is replaced by a non-phone preview card system

On mobile, the website hides the desktop phone mock and swaps in `.story-preview` or `.hero-preview-mobile`. Those surfaces render `preview-*.html` card layouts, not the same screen definition used on desktop.

That means the mobile page is not a responsive version of the desktop page. It is a different product story.

### Why this is bad

- it breaks brand consistency
- it breaks screen fidelity
- it creates maintenance drift
- it guarantees mobile will never match the real app

### Required fix

Mobile should use the same phone screens as desktop, scaled for the smaller viewport.

## Mobile problem 2: the simplified preview cards flatten the product

Examples:

- `preview-loop-mobile.html` reduces the hero to abstract copy blocks and stat chips
- `preview-workout-mobile.html` reduces workout logging to a card summary
- `preview-feedback-mobile.html` strips away the actual summary screen composition
- `preview-results-mobile.html` compresses dashboard into an infographic

These all lose the main thing that makes the product credible: it looks like a real app with real screens.

### Required fix

Stop turning app states into explanatory cards. Show the actual screens.

## Mobile problem 3: mobile currently removes the most useful visual proof

The phone renders are the proof that the product exists and is designed. On mobile, that proof is being replaced by the weakest render system on the page.

That is the opposite of what the page should do.

### Required fix

Make the mobile phone views the most faithful version of the product, not the least faithful.

## Mobile problem 4: section hierarchy and phone hierarchy are out of balance

Because mobile uses simplified cards, the support copy and support cards can feel as important as the product screen itself. The page stops feeling app-led.

### Required fix

The phone should remain the center of gravity on mobile:

- header
- short copy
- phone
- supporting card

That order already exists structurally in places, but the current mobile preview system weakens it visually.

## Visual System Mismatch Audit

## Typography mismatch

The current phone mocks use the site stylesheet's mock typography classes, while the real app has moved into a more disciplined component scale.

This is not catastrophic on its own, but it compounds every other mismatch.

The redesign should preserve the website's existing brand fonts if needed, but the hierarchy should feel closer to the app:

- restrained labels
- strong but not oversized headings
- cleaner mono accents
- more disciplined number rendering

## Spacing mismatch

The current phone mocks often use evenly distributed gaps. The app uses more intentional spacing:

- clear top offsets
- grouped header blocks
- deliberate compression inside data rows
- stronger separation between sections

The website often feels "laid out." The app feels "composed."

## Background mismatch

This is one of the clearest implementation mismatches.

### Current app

- one shared background image source
- placed bottom-right
- most of the viewport stays black
- left fade is strong and intentional

### Current website

- full-cover background images
- center-positioned by default
- separate images for screen types
- scrims compensate for image placement rather than using the app's composition rule

### Required fix

Recreate the app's composition rule in CSS for the website phones.

## No-CTA / No-Tabbar Rule

This redesign should follow a strict content rule:

- no CTA buttons inside the phone renders
- no bottom nav row
- no tabbar
- no floating action button

Reason:

- the user requested it
- the CTA surfaces consume vertical space that should go to the actual content
- the tabbar on the current website is legacy and not the real app's tabbar anyway
- for landing-page phones, state readability matters more than action fidelity

This rule should apply to:

- hero preview
- workout logging phone
- summary phone
- dashboard phone

If a future pass reintroduces action affordances, they should only be added if they match the app, not the old website system.

## File-Level Findings

## `astro-src/pages/index.astro`

Current issues:

- hero phone uses the wrong state
- each section pairs a desktop mock with a separate mobile abstraction

Needed redesign implication:

- one shared render concept per screen
- mobile should not point to a different conceptual partial than desktop

## `src/partials/phone-workout.html`

Current issues:

- active logging state used in hero
- includes bottom note and `Submit workout`
- not a true preview

Needed redesign implication:

- convert to workout preview for hero use
- remove action surfaces

## `src/partials/phone-workout-leg.html`

Current issues:

- closest to target composition
- row alignment does not match app
- includes fake CTA

Needed redesign implication:

- preserve screen composition
- rebuild row geometry
- remove CTA

## `src/partials/phone-feedback.html`

Current issues:

- bottom nav row should be removed
- spacing should be tightened toward screenshot target

Needed redesign implication:

- static summary-only render
- no nav
- stronger composition hierarchy

## `src/partials/phone-dashboard.html`

Current issues:

- overloaded
- too many blocks
- not screenshot-faithful

Needed redesign implication:

- simplify to streak + XP + calendar + month comparison

## `src/partials/preview-*.html`

Current issues:

- they are the wrong abstraction
- they guarantee mobile drift

Needed redesign implication:

- remove or replace with true screen renders

## `src/styles/main.css`

Current issues:

- step number scale/alignment is weak
- workout row fields are not app-faithful
- full-cover background system differs from app
- old tabbar CSS still exists

Needed redesign implication:

- update title alignment
- rework phone screen background composition
- rework workout field geometry
- remove dead CTA/tabbar styling if unused

## Recommended Implementation Strategy

## Phase 1: establish one phone system

- stop treating mobile as a different phone language
- choose one render per state
- ensure hero, workout, summary, dashboard each exist as one canonical partial

## Phase 2: rebuild the background system

- replace center-cover screen backgrounds with app-like bottom-right faded imagery
- make black the dominant field color
- ensure readability comes from placement, not from heavy global scrims

## Phase 3: fix the five requested screens

- step number alignment
- hero preview
- section 2 workout
- section 3 summary
- section 4 dashboard

## Phase 4: update onboarding to remove the next obvious mismatch

- change duration options to `30 / 40 / 50 / 60 / 70`
- update card treatment to feel closer to app choice cards

## Detailed Build Recipes

These are not code snippets. They are screen recipes that define what each phone should contain and what it should intentionally omit.

## Hero phone recipe

### Goal

Show the user that maatriks already prepared the session before they even start.

### Keep

- planned-session hierarchy
- title-first composition
- training-week context
- minimal supporting metadata
- atmospheric bottom-right photo fade

### Remove

- set-entry rows
- notes line
- `Submit workout`
- `Start session`
- tabbar
- bottom nav

### Visual hierarchy

1. week eyebrow
2. short state label such as `Today`
3. workout title
4. exercise count / preview metadata
5. optional weekly progress strip if it can be rendered cleanly without becoming too busy

### Why

This makes the hero structurally different from section 2. The hero becomes anticipation. Section 2 becomes interaction.

## Section 2 workout phone recipe

### Goal

Show live logging of a real exercise block with disciplined data entry alignment.

### Keep

- target screen composition from the supplied screenshot
- title + meta + planned-lift label
- vertical timeline feel
- multiple exercise blocks
- one active row
- one or more completed rows
- add-set affordance

### Remove

- footer CTA
- generic note field at the bottom
- home indicator if it visually competes with the screen content
- tabbar

### Structural rule

Each set row should behave like a row from the app, not like a prose line.

Meaning:

- row starts from a fixed left edge
- set number has a consistent width
- weight input occupies a stable numeric column
- `kg` suffix occupies a stable suffix column
- reps input occupies a second stable numeric column
- `reps` suffix occupies a stable suffix column
- a tail spacer or remove affordance occupies the far-right edge

### Why

The screenshot already communicates the right story. The missing part is execution fidelity.

## Section 3 summary phone recipe

### Goal

Show the post-workout interpretation layer, not navigation.

### Keep

- back affordance
- session-summary label
- session title and date
- top metrics row
- coach-note card
- exercise recap list

### Remove

- bottom nav row
- CTA
- extra dashboard/workout navigation language

### Structural rule

The coach note card is the main body element. Everything else frames it.

### Why

The current site summary is close conceptually, but it still spends too much weight on utility instead of insight.

## Section 4 dashboard phone recipe

### Goal

Show visible proof of consistency and progress.

### Keep

- streak value
- longest streak
- XP bar
- full calendar block
- monthly comparison numbers

### Remove

- recent-workout list
- PR list
- CTA
- tabbar

### Structural rule

The dashboard should have one read path:

1. streak
2. XP progress
3. calendar
4. month comparison

It should not branch into side stories.

### Why

The current website dashboard is trying to explain too much. Stronger landing pages choose one proof story, not four.

## Specific Mismatches To Correct From The Current Website

This section translates the audit into concrete "stop doing this" rules.

## Do not keep the current mobile preview-card system

The following files represent the wrong level of abstraction for the redesign:

- `src/partials/preview-loop-mobile.html`
- `src/partials/preview-workout-mobile.html`
- `src/partials/preview-feedback-mobile.html`
- `src/partials/preview-results-mobile.html`

These are concept cards, not app screens.

## Do not keep center-aligned workout input values

If the workout fields remain center-aligned, the section 2 screen will still look fake even if the copy and spacing improve.

The most important mechanical correction in section 2 is alignment discipline.

## Do not keep extra bottom utility rows in the summary and dashboard

These rows make the phones look like stitched demos. They also consume the exact space that should go to the core content.

## Do not keep full-screen wallpaper behavior for the phone backgrounds

The product identity depends on darkness first, image second. The landing page should not make the photos louder than the UI.

## Implementation Notes By File

## `astro-src/pages/index.astro`

This file currently wires desktop and mobile to different conceptual screens.

Implementation implication:

- desktop and mobile should both point at the same state definitions
- if separate partials remain for technical reasons, they should still render the same structure and same content hierarchy

## `src/partials/phone-workout.html`

Implementation implication:

- repurpose for hero preview or replace with a true preview partial
- remove active-logging-only elements

## `src/partials/phone-workout-leg.html`

Implementation implication:

- keep as the canonical logging-state partial
- replace row markup and classes if necessary to support app-like column behavior

## `src/partials/phone-feedback.html`

Implementation implication:

- simplify to a summary-only screen
- remove navigation scaffolding that does not belong inside the render

## `src/partials/phone-dashboard.html`

Implementation implication:

- simplify aggressively
- do not preserve lower list blocks out of inertia

## `src/partials/phone-onboarding.html`

Implementation implication:

- update the stale duration options
- move closer to the app's choice-card language

## `src/styles/main.css`

Implementation implication:

- define shared tokens for phone background positioning and fading
- define shared row geometry for set-entry columns
- remove dead CTA/tabbar styles if no longer used
- revise section heading alignment rules rather than patching only the number itself

## Visual Guardrails

These should be treated as hard constraints during implementation.

## Guardrail 1: the phone content must win over the photo

The photo is atmosphere, not content. If the screen becomes a photo-first scene with text laid on top, the redesign has missed the app's actual visual logic.

## Guardrail 2: numbers must feel engineered

This matters most in:

- workout set rows
- summary metrics
- streak / XP figures
- monthly comparison values

If numbers drift, jitter, or feel casually placed, the whole product reads as less trustworthy.

## Guardrail 3: each phone gets one main idea

- hero: session is ready
- workout: log what actually happened
- summary: understand what changed
- dashboard: see progress over time

When a screen tries to communicate more than its section message, the page gets weaker.

## Guardrail 4: desktop and mobile must not tell different product stories

Responsive layout changes are acceptable.
Conceptual screen changes are not.

## Risks If Only Partial Fixes Are Made

## Risk 1: fixing section 2 alignment alone will not solve the fidelity problem

If only the set rows are cleaned up but hero/mobile/summary/dashboard remain on mixed systems, the page will still feel inconsistent.

## Risk 2: keeping the preview-card mobile system will continue to undermine the work

Even with excellent desktop screens, mobile will still be the first impression for many visitors. If mobile remains a simplified abstraction, the redesign will still feel incomplete.

## Risk 3: matching screenshots without using app layout logic will create another drift cycle

If the redesign chases the screenshot visually but ignores the app's field and spacing grammar, the new mocks will age quickly again.

## Recommended Priority Order For Actual Implementation

If the redesign moves into build work, the order should be:

1. background system
2. hero preview
3. section 2 workout alignment
4. summary simplification
5. dashboard simplification
6. mobile unification
7. onboarding correction

This order keeps the most visible fidelity wins near the top while also addressing the underlying system mismatch early.

## Proposed Acceptance Checklist

The redesign is complete when all of the following are true:

- section number `2` is optically aligned with the heading and no longer undersized
- hero shows a workout preview, not an active logging screen
- hero has no CTA and no tabbar
- section 2 workout rows align like real app fields
- section 2 has no CTA and no tabbar
- section 3 summary matches the supplied render hierarchy
- section 3 has no CTA and no nav row
- section 4 dashboard matches the supplied render hierarchy
- section 4 has no CTA and no tabbar
- mobile uses the same screen concepts as desktop
- phone backgrounds use bottom-right faded imagery over mostly black screens
- onboarding no longer uses stale duration options

## Final Design Position

The right redesign is not "make the current mocks prettier."

The right redesign is:

- eliminate the dual desktop/mobile phone systems
- move the phones back toward the real app's spacing and background logic
- use your supplied screenshots as the target composition for the specific requested screens
- strip out CTA and tabbar clutter
- make the phones feel like actual product screens again

If that is done correctly, the landing page will stop feeling like a site about an app and start feeling like an extension of the app itself.
