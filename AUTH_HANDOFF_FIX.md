# Auth Handoff Fix

Last updated: 2026-04-12

This file is the working checklist for the Google auth return-path fix.

## Goal

Make Google sign-in return to the mobile app reliably, even when the browser flow does not complete through the native callback on the first attempt.

## Confirmed failure modes

- [ ] Supabase hosted auth config must allow the exact runtime callback shapes we use.
  Why this matters:
  The app generates `maatriks://auth/callback?auth_state=<uuid>`. If Supabase only allow-lists the bare URL without query-bearing variants, the provider flow can fall back to `SITE_URL`, which sends the user to `https://maatriks.ai` instead of back into the app.

- [ ] The native app must accept hosted auth callback URLs on iOS and Android.
  Why this matters:
  Today native hydration is biased toward `maatriks://...`. If the flow lands on `https://maatriks.ai/auth/callback` and that URL later reaches the app, the app must treat it as a valid auth handoff, not as an unrelated web URL.

- [ ] Pending auth state must survive browser fallthrough and manual website fallback.
  Why this matters:
  If the auth session closes without a direct native callback, the user may still recover by tapping `Continue In App` on the hosted callback page. Clearing pending state too early breaks that rescue path.

- [ ] The website must preserve the full auth payload and expose a manual app-open path.
  Why this matters:
  The hosted callback page is part of the trust boundary. It needs to forward `access_token`, `refresh_token`, `token_hash`, `type`, and `auth_state`, and it must keep a manual path back into the app for Safari/browser cases.

- [ ] iOS app-link plumbing must exist for `maatriks.ai`.
  Why this matters:
  Without `associatedDomains` in the app and an `apple-app-site-association` file on the site, `https://maatriks.ai/...` is only a web URL. It cannot be promoted into an OS-level app handoff.

## Concrete fix path

1. Patch app auth hydration to accept both native and hosted callback URLs on native.
2. Stop clearing pending auth state immediately when the browser session does not report a direct success result.
3. Keep the hosted callback page forwarding the full auth payload, including `auth_state`.
4. Add iOS app-link metadata to the app and the website.
5. Patch hosted Supabase auth config so the allow list matches the runtime callback URLs, not a simplified approximation.
6. Verify direct native callback, hosted callback, and manual `Continue In App` recovery.

## Checkpoints

- [x] App code accepts `maatriks://auth/callback?...` and `https://maatriks.ai/auth/callback?...` on native.
- [x] App code accepts `maatriks://update-password?...` and `https://maatriks.ai/update-password?...` on native.
- [x] Pending auth state is still present if the user needs the website fallback page.
- [x] Website build emits `apple-app-site-association` at both `/.well-known/apple-app-site-association` and `/apple-app-site-association`.
- [x] Website build verification checks for the auth payload forwarding and the app-link asset.
- [x] Hosted Supabase auth config includes query-bearing callback patterns for both hosted and native URLs.
- [x] Local tests pass.
- [x] Hosted auth config diff shows the desired redirect values.

## Deployment caveat

This repo can add the AASA file, but production universal links still depend on how `maatriks.ai` is served. Apple expects the AASA file to be reachable without redirects and with a JSON-compatible content type. If the static host does not serve the file correctly, universal links will still fail even though the repo is correct.
