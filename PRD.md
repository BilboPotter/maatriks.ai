# PRD: maatriks.ai Public Website

Last updated: 2026-04-07

## 1. Overview

This repository exists for the public website hosted on `maatriks.ai`.

Its job is not to be a full web app.

Its job is to provide the minimum public web surface needed to support:

1. the company/developer presence behind the mobile app
2. Google OAuth production readiness
3. Apple App Store and Google Play compliance surfaces
4. support and account-deletion flows
5. auth handoff pages that return users from browser flows back into the mobile app

The current mobile app working title is `KINETIC`, but the app name is expected to change.

Because of that, the website must be built so app-specific branding, copy, URLs, and deep-link scheme can be changed from a centralized configuration layer instead of requiring repo-wide edits.

## 2. Product Goal

Ship a thin, static, production-safe website on `maatriks.ai` that:

1. gives Google a real public homepage and privacy policy on a verified domain
2. gives Apple and Google Play the required privacy/support/deletion surfaces
3. supports the mobile app's email and OAuth browser handoff flows
4. is easy to rename and reuse if the app's public name changes
5. is simple to host on GitHub Pages initially

## 3. Non-Goals

This website is not responsible for:

1. being a full browser version of the product
2. authenticated user dashboards
3. checkout or subscription purchase flows
4. blog, CMS, or editorial tooling
5. complex animations or bespoke marketing interactions
6. app backend logic
7. admin tools

## 4. Primary Users

### Prospective users

People who arrive from:

- App Store or Play Store listing links
- Google OAuth verification review
- search results
- support links

They need to quickly understand what the app is and who operates it.

### Existing mobile users

People who need:

- privacy information
- support contact
- account deletion information
- browser-to-app auth handoff during login or password recovery

### Platform reviewers

People reviewing the app for:

- Google OAuth production verification
- App Store review
- Play Console policy review

They need clear public pages with no ambiguity about ownership, privacy, and support.

## 5. Product Principles

1. Keep it thin.
2. Keep it static-first.
3. Keep it rename-safe.
4. Keep app-support routes stable.
5. Keep legal and support pages public and easy to reach.
6. Prefer clarity over marketing excess.

## 6. Information Architecture

The site must support the following routes at launch:

1. `/`
2. `/privacy`
3. `/support`
4. `/delete-account`
5. `/auth/callback`
6. `/update-password`

Optional later routes may be added, but the launch implementation must not depend on them.

If the app is renamed later, these route paths should remain stable unless there is a compelling reason to change them.

## 7. Route Requirements

### 7.1 `/`

Purpose:

- public homepage for the app and/or Maatriks as the developer
- Google OAuth homepage URL

Must include:

1. clear statement of what the app does
2. clear statement of who operates it
3. visible links to:
   - privacy policy
   - support
   - account deletion
4. support email
5. app store links area, even if placeholders are used initially

Should avoid:

- vague holding-page copy with no explanation of the product
- generic company page that does not mention the app at all

Acceptance criteria:

1. a Google reviewer can understand what product this domain supports
2. a user can navigate to privacy and support in one click
3. the page remains valid if the app name changes

### 7.2 `/privacy`

Purpose:

- canonical public privacy policy URL

Must include:

1. operator identity
2. support contact email
3. what user data is collected
4. why data is collected
5. how authentication data is handled
6. how workout/product usage data is handled
7. whether analytics are used
8. whether third-party processors are used
9. how users can request deletion or contact support
10. last updated date

Acceptance criteria:

1. page is public without login
2. page is linkable from the homepage and app stores
3. content is written clearly enough for store review and user reference

### 7.3 `/support`

Purpose:

- canonical public support page

Must include:

1. support email
2. support scope:
   - login issues
   - password reset issues
   - account deletion questions
   - general app help
3. expected response framing, if you want one
4. link to privacy policy
5. link to deletion page

Acceptance criteria:

1. page is public
2. users can identify exactly how to contact support
3. support email is easy to copy

### 7.4 `/delete-account`

Purpose:

- public deletion information page required for Google Play compliance

Must include:

1. that users can initiate deletion in the mobile app
2. where in the app deletion lives
3. what happens when an account is deleted
4. whether any data is retained and why
5. support contact for deletion issues

This page does not need to perform deletion itself unless product requirements change.

Acceptance criteria:

1. page is public and direct-linkable
2. copy matches actual app behavior
3. page clearly explains how a user deletes their account

### 7.5 `/auth/callback`

Purpose:

- browser handoff page for auth flows that return from Supabase/Google into the browser before returning to the mobile app

This route is functional, not marketing.

Must do:

1. parse browser auth parameters from the URL
2. attempt to open the mobile app through the configured deep-link callback
3. show a clear loading/status state while handoff is attempted
4. show fallback instructions if the app does not open automatically
5. preserve relevant auth parameters when handing off

Must not:

1. act like a full signed-in web session
2. require a backend just to complete the handoff

Acceptance criteria:

1. valid auth links can hand off cleanly to the installed mobile app
2. failed handoff produces user-readable fallback instructions
3. route is static-host compatible

### 7.6 `/update-password`

Purpose:

- password-recovery handoff page for returning users into the mobile app

Must do:

1. parse the recovery URL state
2. attempt to open the app using the configured deep-link recovery route
3. show clear fallback instructions if the deep link fails
4. explain briefly that password update continues inside the app

Acceptance criteria:

1. valid recovery links can hand off to the app
2. users are not left on a blank or ambiguous page
3. route is static-host compatible

## 8. Configuration Requirements

The site must be configurable from a small number of centralized values.

At minimum, these values must be easy to change from one place:

1. company/developer name
2. app display name
3. support email
4. base site URL
5. privacy URL
6. support URL
7. delete-account URL
8. iOS App Store URL
9. Google Play URL
10. mobile deep-link scheme
11. auth callback deep-link target
12. password reset deep-link target

The implementation must avoid scattering these values across many files.

## 9. Rename-Safe Requirement

The app name is expected to change.

Because of that:

1. the website must not hardcode the current app name in many places
2. app-specific content should be sourced from centralized config/content
3. the home page should still make sense if the app name changes late
4. deep-link targets should be configurable because the app scheme may change later

The website builder should optimize for low-friction rename, not for hardcoded launch copy.

## 10. Content Requirements

The implementation should support placeholder content where final legal copy is still pending, but the structure must exist.

Launch content requirements:

1. short product description
2. operator/developer identity
3. support email
4. privacy policy content
5. deletion-policy content
6. app store links or placeholders

The site should make it easy to replace placeholder copy later without reworking route structure.

## 11. Technical Requirements

### Hosting

1. must be deployable to GitHub Pages
2. must work on custom domain `maatriks.ai`
3. must not require server-side runtime for launch

### Architecture

1. static-site compatible
2. minimal client-side JavaScript where possible
3. auth handoff pages may use client-side logic because they need to parse URL state and open the app
4. no backend dependency required for standard public pages

### SEO / Metadata

Must support page-level metadata for:

1. homepage title and description
2. privacy page title
3. support page title
4. deletion page title

This is required for clarity and review, not for aggressive SEO work.

### Accessibility

Must meet normal baseline expectations:

1. semantic page structure
2. keyboard reachable links and actions
3. readable text hierarchy
4. no essential information hidden only in images

## 12. External Integration Requirements

### Google OAuth readiness

The website must provide:

1. a real public homepage on `maatriks.ai`
2. a real public privacy policy URL
3. clear operator identity
4. support contact

### Apple / App Store readiness

The website must provide:

1. a real public privacy policy URL
2. support contact page

### Google Play readiness

The website must provide:

1. a public deletion-information URL
2. support contact page

### Mobile app auth handoff

The website must support:

1. callback entry from browser auth flows
2. recovery entry from browser password-reset flows
3. configurable deep-link handoff back to the app

## 13. Out Of Scope For V1 Website Build

Do not spend time on these unless specifically requested later:

1. CMS integration
2. multi-language support
3. blog
4. press kit
5. admin dashboard
6. payment pages
7. subscription pages
8. investor/company pages beyond what is needed for trust and support
9. advanced analytics implementation
10. account portal

## 14. Delivery Requirements

The website build should produce:

1. a deployable static site
2. a clear place to edit configuration values
3. the launch routes listed in this PRD
4. a short deployment guide for GitHub Pages
5. a short list of DNS records/actions needed for custom domain hookup

## 15. Definition Of Done

The first website release is done when:

1. `maatriks.ai` serves the public homepage
2. `/privacy` is public
3. `/support` is public
4. `/delete-account` is public
5. `/auth/callback` exists and can hand off to the app
6. `/update-password` exists and can hand off to the app
7. all app/site identity values are editable from centralized config
8. the site can be deployed on GitHub Pages without server infrastructure

## 16. Open Inputs From Product Owner

These values may still be placeholders when the build starts:

1. final public app name
2. final short product description
3. final privacy policy text
4. final deletion/retention language
5. final App Store URL
6. final Google Play URL
7. final support email if it changes from `support@maatriks.ai`
8. final deep-link scheme if the mobile app is renamed

The implementation should be built so these can be updated late without restructuring the site.
