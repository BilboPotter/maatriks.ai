# Google OAuth Handoff Fix

Superseded by [AUTH_HANDOFF_FIX.md](./AUTH_HANDOFF_FIX.md), which tracks the broader fix path across Supabase redirect config, native callback handling, and iOS app links.

Last updated: 2026-04-12

This note documents the production auth-handoff bug where Google sign-in completed at Supabase, but the user did not reliably land back in the mobile app.

## Executive summary

The Google provider itself was working.

The failure was in the browser-to-app return path:

1. the app requested a native callback: `maatriks://auth/callback?auth_state=...`
2. Google and Supabase completed login successfully
3. the flow sometimes fell through to the hosted website callback page at `https://maatriks.ai/auth/callback`
4. the live website callback script dropped `auth_state`
5. the app's state-bound OAuth validation then rejected the returned session payload

Result:

- users could authenticate with Google
- Supabase would log a successful login
- but the app would not reliably hydrate the session and continue

## What was confirmed

### Hosted Supabase config

Hosted Auth config is not the problem.

Confirmed live values:

- `site_url = https://maatriks.ai`
- `uri_allow_list = https://maatriks.ai/auth/callback,https://maatriks.ai/update-password,maatriks://auth/callback,maatriks://update-password`
- Google provider enabled
- Google client ID present

This means:

- Supabase is allowed to redirect to both the hosted callback page and the native app deep link
- the Google provider is active and functioning

### Hosted auth logs

Real auth logs showed:

- `GET /authorize` for provider `google`
- `GET /callback` with `302`
- `Login` event for provider `google`

This proves:

- Google login itself succeeds
- the issue is downstream of provider authentication

### Mobile app behavior

The app implementation requests the native callback for Google OAuth:

- `maatriks://auth/callback?auth_state=...`

It does not intentionally use the website callback page for Google sign-in.

### Live public callback page

The live page at `https://maatriks.ai/auth/callback` exists and contains:

- the callback handoff UI
- the `Continue In App` button
- a script that attempts `window.location.replace("maatriks://auth/callback...")`

So the public page was present.

## Root cause

The live website callback script was stale.

Specifically:

- the deployed script allowed `access_token`, `refresh_token`, `token_hash`, `type`, and related params
- but it did **not** forward `auth_state`

That is the core bug.

If the OAuth browser flow returned via the hosted callback page instead of directly back into the app, the website would rebuild the app deep link without `auth_state`.

The app's OAuth flow stores a pending auth state locally and expects the returned callback to match it.

Without that state:

- session tokens can arrive
- but the callback still fails validation
- the app cannot confidently hydrate the session

## Why this bug matters

The app's state binding is correct security behavior.

The website callback page is part of the trust boundary. If it strips `auth_state`, it breaks a valid flow and makes the fallback path unreliable.

This is not just a UX issue. It is a browser-handoff correctness bug.

## Exact code issue

The shared callback handoff script in this repo now includes:

- `auth_state` in the allowed forwarded params

That is required for:

- `/auth/callback`
- `/update-password`

Before this fix, the deployed script omitted it.

## Fix implemented in this repo

Updated:

- `src/scripts/_auth-handoff-shared.js`

The script now forwards:

- `auth_state`

alongside the existing auth payload fields.

This ensures:

- if the user lands on the hosted callback page
- and that page reopens the mobile app
- the app receives the same pending state it originally generated

## Regression protection added

Updated:

- `verify-build.js`

The website build verifier now fails if a built auth handoff script does not contain:

- `auth_state`

That makes this regression detectable during local verification and CI.

## Current live mismatch

At the time of writing:

- repo source is fixed
- locally built output is fixed
- live `maatriks.ai` is still serving the older callback script

Observed live script:

- `/scripts/auth-callback.d48ea473.js`

Fixed local build script:

- `/scripts/auth-callback.052cde72.js`

This mismatch means the site still needs deployment.

## Required next step

Deploy the website so the live callback page serves the updated handoff script.

Minimum requirement:

1. build the site from the current source
2. publish the generated output
3. confirm the live callback script now contains `auth_state`

## Post-deploy verification

After deployment, verify all of the following:

1. `https://maatriks.ai/auth/callback` loads successfully
2. the page still shows `Continue In App`
3. the served callback script contains `auth_state`
4. Google sign-in on physical iPhone returns to the app
5. Google sign-in on physical Android returns to the app
6. password reset still returns to the app

## Recommended smoke test

On a real iPhone:

1. sign out fully
2. tap `Continue with Google`
3. complete the Google flow
4. if the browser lands on `maatriks.ai/auth/callback`, tap `Continue In App`
5. verify the app opens and the session is hydrated

Expected result after deployment:

- either the app resumes directly
- or the hosted page reopens the app correctly with a valid session

## Bottom line

The production issue was not "Google setup is broken."

It was:

- a browser-to-app fallback path
- combined with a stale hosted callback script
- that stripped `auth_state`

This repo now contains the correct fix and a build-time guard against regression.
