# maatriks.ai

Static public website for the mobile app and launch support surface.

This repo owns:

- homepage
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

- `companyName`
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
