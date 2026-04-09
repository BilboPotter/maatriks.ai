# maatriks.ai Website Roadmap

Last updated: 2026-04-09

This document covers what needs to happen to take the site from its current state (functional compliance surface) to a finished product that looks intentional and holds up under scrutiny.

Each phase is designed to be shippable on its own. Later phases don't undo earlier ones.

---

## Phase 1 — Cleanup

Fix things that are broken, redundant, or will cause problems if left alone. No visual changes. The site should work correctly after this phase, with no dead artifacts or conflicting deployments.

### 1.1 Remove conflicting GitHub Actions workflow

Two workflows trigger on push to `main`:
- `deploy-pages.yml` builds the site and deploys `dist/`
- `static.yml` deploys the raw repo root without building

They race each other. `static.yml` is a leftover from initial repo setup. Delete it.

### 1.2 Remove stale CNAME files

Three CNAME files exist:
- `/CNAME` — says `www.maatriks.ai`
- `/docs/CNAME` — says `maatriks.ai`
- `dist/CNAME` — generated correctly by build

The root `/CNAME` and `/docs/CNAME` are artifacts from earlier configurations. The build generates the correct one from `site.config.json`. Delete both stale files and the empty `docs/` directory.

### 1.3 Stop committing `dist/`

The deploy workflow builds from source. Committing `dist/` is redundant and can drift out of sync. Add `dist/` to `.gitignore`.

### 1.4 Fix URL parameter parsing in auth handoff scripts

Both `auth-callback.js` and `update-password.js` split URL parameters on `=`:

```js
var parts = pair.split('=');
if (parts.length === 2) { ... }
```

Base64 tokens from Supabase can contain `=` characters. This silently drops tokens that have padding. Fix: split on the first `=` only and join the rest.

### 1.5 Remove dead config key

`deepLinkScheme` in `site.config.json` is defined but never used in any template or script (it only appears in JS comments after interpolation). The actual deep links use `authCallbackDeepLink` and `passwordResetDeepLink` which contain the full scheme. Remove the dead key so it doesn't mislead future editors.

### 1.6 Fix footer brand inconsistency

The homepage and privacy page footers have the amber dot after the brand name. Support, delete-account, and forgot-password pages don't. Pick one and apply it everywhere.

---

## Phase 2 — Correctness

Things that aren't broken but are wrong or missing. After this phase the site should be correct from an SEO, accessibility, and standards perspective.

### 2.1 Add canonical URLs

Both `/privacy` and `/privacy.html` serve identical content. Same for every route with an alias. Add `<link rel="canonical">` to the layout template pointing to the clean URL version. This requires the build to know the canonical path for each route — add it to the route definition.

### 2.2 Add Open Graph and social meta tags

The layout has `<title>` and `<meta description>` but no OG tags. Add at minimum:
- `og:title`
- `og:description`
- `og:type` (website)
- `og:url` (canonical)

These can be derived from existing route metadata in the build. No new config values needed unless an OG image is added later.

### 2.3 Fix 404 page

The 404 currently renders the full homepage with a different `<title>`. A user who hits a dead URL has no idea they're on the wrong page. Replace it with a short "page not found" message and a link home. Create a dedicated `404.html` source page.

### 2.4 Fix accessibility gaps

**Color contrast:** `--muted-2: #4A4A5A` on `--black: #050505` is ~2.8:1, below WCAG AA (4.5:1 for normal text). This affects footer text, stat labels, nav links, and page meta text. Lighten `--muted-2` or use `--muted` where contrast matters.

**Heading hierarchy:** The homepage goes `<h1>` to `<h3>` with no `<h2>` in the features section. Screen readers and SEO tools flag heading level skips. Add an `<h2>` before the feature cards (it can be visually hidden if the design doesn't want it visible).

**Skip link:** Add a "Skip to main content" link as the first focusable element. Hidden visually, visible on focus.

### 2.5 Placeholder store links

The App Store and Google Play buttons link to `#`, which scrolls to page top on click. Either:
- Disable them visually and mark as "Coming soon"
- Remove them until real URLs exist

Linking to `#` is worse than either option.

---

## Phase 3 — Build and performance

Improvements to the build pipeline and page load. After this phase the site should be fast, with no wasted bytes.

### 3.1 Trim font loading

The site loads 7 weights of Inter (300-900) and 4 weights of JetBrains Mono (400-700). Actual usage:
- Inter: 400 (body), 500 (few labels), 600 (strong, nav), 700 (buttons), 800 (logo, footer brand), 900 (headings)
- JetBrains Mono: 400 (email display), 500 (few labels), 600 (section labels, nav links), 700 (stat values)

Cut Inter 300 at minimum. Consider whether 800 and 900 can be collapsed to one weight, and whether JetBrains Mono 700 is pulling its weight.

Update the Google Fonts URL to only request what's used.

### 3.2 Add CSS and JS minification to build

The build currently copies CSS and JS as-is. Add a basic minification step — even a naive regex-based whitespace/comment strip would save 30-40% on the CSS. No need for a bundler. Keep it zero-dependency if possible (Node built-ins only), or accept a single dev dependency if the result is meaningfully better.

### 3.3 Add cache-busting to asset references

CSS and JS are served from static paths (`/styles/main.css`, `/scripts/main.js`). On redeploy, browsers with cached copies may serve stale versions. Add a content hash or build timestamp to asset filenames (e.g., `/styles/main.abc123.css`) and update the layout reference at build time.

### 3.4 Consider self-hosting fonts

Google Fonts adds two extra DNS lookups and connections (`fonts.googleapis.com`, `fonts.gstatic.com`). For a site that values fast first-paint, self-hosting the WOFF2 files in `dist/fonts/` eliminates that latency. Tradeoff: slightly larger repo, no CDN edge caching from Google. Worth it for a site this small.

---

## Phase 4 — Content

Review and fix the actual words on the site. After this phase every page should read like it was written by a person who uses the product, not generated to fill a template.

### 4.1 Audit homepage copy

Current problems:
- The stat strip ("3 Core Tabs", "AI Feedback", "iOS + Android Mobile First") says nothing useful. These read like placeholder values that were never replaced. Either make them real metrics/facts or remove the section.
- The marquee ticker ("AI-Powered Coaching", "Personalized Programs", etc.) is generic fitness-app keyword soup. If the marquee stays, the items should say something specific about this product.
- The hero description is good. The feature cards are decent. The issue is everything around them.

### 4.2 Audit support page copy

Current copy is functional and clear. No major issues. Minor: "We aim to respond within 48 hours on business days" — confirm this is a real commitment, not aspirational.

### 4.3 Audit delete-account page copy

Current instructions reference specific UI paths ("Settings > Account > Delete Account"). Confirm these match the actual app. If the app isn't built yet, flag these as placeholders that need updating before store submission.

### 4.4 Audit privacy policy

The privacy policy is thorough and well-structured. Specific things to verify:
- "Configured AI provider" — once a provider is locked in, name it explicitly. Vague processor references can draw questions from GDPR reviewers.
- Data retention period for backups ("up to 30 days") — confirm this matches actual Supabase backup retention.
- Children's privacy age threshold (16 / 13 in US) — confirm this matches app store age rating.

### 4.5 Review whether forgot-password page earns its existence

This page is not in the PRD. It was added as a convenience bridge between the support page and the password reset flow. It's 68 lines of source for a page that says "open the app and tap Forgot Password." If the support page already covers this adequately, consider removing it and linking directly to the support page's password section instead.

### 4.6 Add blog

The PRD listed blog as out of scope for the initial build. Adding it now for SEO — the site needs indexable content beyond legal and support pages.

**Route:** `/blog` for the index, `/blog/{slug}` for individual posts.

**Build changes:**
- Blog posts as standalone HTML or Markdown files in `src/blog/` (or `src/posts/`)
- Build script reads the directory, generates an index page and individual post pages
- Post metadata (title, date, description, slug) lives in each file — frontmatter if Markdown, or a comment/data block if plain HTML
- Index page lists posts in reverse chronological order

**What the blog is not:**
- Not a CMS. Posts are files in the repo, committed and deployed like everything else.
- Not a content farm. The purpose is a small number of genuine, useful articles about the product's domain (training programming, workout tracking, how the app works) — not keyword-stuffed SEO filler.

**Scope decisions:**
- Markdown support adds a dependency (or a lightweight parser in the build). Decide whether that tradeoff is worth it versus writing posts in HTML with the same template interpolation the rest of the site uses.
- RSS feed — cheap to generate at build time, meaningful for discoverability. Worth doing.
- Pagination — not needed until there are enough posts to warrant it. Start without it.

---

## Phase 5 — Redesign

Replace the current visual design. The current site has the structure and content it needs, but the visual layer looks like what it is: a generated dark-theme template with amber accents, glow orbs, dot grids, and marquee strips.

The goal is a site that looks like it was designed by a person with taste for a specific product, not assembled from a mood board of "dark tech startup" tropes.

TBD. Design direction has not been decided yet. This phase will be scoped once there is a clear picture of what the site should look and feel like.
