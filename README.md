# maatriks.ai

Public website for the `maatriks.ai` mobile app.

The site is deployed as Astro static output. The older `build.js` pipeline is still kept in the repo as a parity baseline until the Astro migration is fully retired.

## What This Repo Owns

- homepage
- blog index and blog posts
- privacy policy
- terms and conditions
- support page
- account deletion page
- password reset help page
- auth callback handoff page
- password update handoff page

## Route Surface

- `/`
- `/blog`
- `/privacy`
- `/terms`
- `/support`
- `/delete-account`
- `/forgot-password`
- `/auth/callback`
- `/update-password`

## Config

Runtime-facing values live in `site.config.json`.

Important keys:

- `companyName`
- `appName`
- `supportEmail`
- `siteUrl`
- `privacyUrl`
- `termsUrl`
- `supportUrl`
- `deleteAccountUrl`
- `forgotPasswordUrl`
- `authCallbackDeepLink`
- `passwordResetDeepLink`

## Local Development

Start the Astro dev server:

```bash
npm run astro:dev
```

Build the deployed Astro output:

```bash
npm run astro:build
```

Build the legacy parity baseline:

```bash
npm run build
```

Verify the legacy auth-handoff output:

```bash
npm run verify
```

Verify Astro output matches the legacy build:

```bash
npm run astro:verify
```

`astro:dev` and `astro:build` both generate `astro-public/` before running. Do not edit `astro-public/` directly.

## Output Directories

- `astro-dist/` — deployable Astro output
- `dist/` — legacy static baseline used for parity checks
- `astro-public/` — generated public asset mirror for Astro dev/build

## Blog Authoring

Blog posts live in `src/blog/`.

Start a new post by copying `src/blog/_template.html`.

Required metadata:

- `title`
- `slug`
- `date`
- `description`

Optional metadata:

- `category`

## Deployment

Deployment guidance lives in `DEPLOYMENT.md`.

## Product Docs

- `PRD.md` — current product and route requirements
- `ROADMAP.md` — current forward-looking priorities
