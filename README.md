# maatriks.ai

Static public website for the mobile app and launch support surface.

This repo owns:

- homepage
- blog index and blog posts
- privacy policy
- support page
- account deletion page
- auth callback handoff page
- password update handoff page
- password reset help page

It is designed to deploy to GitHub Pages with a custom domain.

## Config

Edit runtime-facing values in:

- `site.config.json`

Important values:

- `companyName` — legal operator name shown on policy/compliance surfaces
- `appName`
- `supportEmail`
- `siteUrl`
- `privacyUrl`
- `supportUrl`
- `deleteAccountUrl`
- `forgotPasswordUrl`
- `authCallbackDeepLink`
- `passwordResetDeepLink`

## Build

```bash
node build.js
```

Output goes to:

- `dist/`

## Blog Authoring

Blog posts live in:

- `src/blog/`

Start a new post by copying:

- `src/blog/_template.html`

Each post uses a small metadata block plus raw HTML content. Required fields are:

- `title`
- `slug`
- `date`
- `description`

Optional fields:

- `category`

The newest post is featured automatically on `/blog`, and the rest of the archive is generated from the same folder.

## Local Preview

After building, preview the generated site with any static server. Example:

```bash
python3 -m http.server 4321 -d dist
```

Then open:

- `http://localhost:4321`

## Deploy

Deployment guidance lives in:

- `DEPLOYMENT.md`
