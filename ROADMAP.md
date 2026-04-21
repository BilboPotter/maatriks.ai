# Website Roadmap

Last updated: 2026-04-14

This roadmap only tracks work that is still relevant. Completed migration/fix checklists have been removed from the repo.

## Current Baseline

The site already has:

- Astro static deployment output
- homepage
- blog
- privacy policy
- terms and conditions
- support page
- account deletion page
- password reset help page
- auth handoff pages

## Next Priorities

### 1. Tighten homepage content and layout

Current homepage work should focus on:

- cleaner hero composition
- better desktop spacing and hierarchy
- sharper CTA presentation
- less duplicated messaging

### 2. Replace placeholder app store links

Current store badges still use placeholders.

Target outcome:

- real App Store URL
- real Google Play URL
- no dead CTA behavior

### 3. Keep legal/support pages aligned with product reality

Legal and support pages should stay synchronized with the live app.

Review whenever product behavior changes:

- sign-in methods
- deletion flow
- AI provider or AI feature behavior
- data retention details
- support commitments

### 4. Improve deployment confidence

Keep production deployment simple and auditable.

Potential improvements:

- stronger CI assertions around route coverage
- explicit checks for legal page presence
- explicit checks for auth handoff page behavior
- clearer release checklist around domain and Pages health

### 5. Content expansion through the blog

The blog is already live, but it should stay selective.

Focus areas:

- useful training-adjacent posts
- product-explainer content
- fewer but higher-quality articles

Avoid:

- filler SEO content
- generic AI-written fitness listicles

## Explicitly Not On The Roadmap

These are not active website priorities right now:

- turning the site into a web app
- browser-based account dashboards
- CMS adoption
- subscription checkout flows
- large-scale animation or interaction experiments
