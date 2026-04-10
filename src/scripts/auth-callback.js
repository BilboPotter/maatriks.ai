/**
 * Auth callback handoff — /auth/callback
 *
 * Parses auth parameters from the URL (hash or query) and attempts
 * to open the mobile app via deep link. Shows fallback if the app
 * doesn't open within a timeout.
 *
 * Config values (injected at build time):
 *   {{authCallbackDeepLink}}
 */

{{> _auth-handoff-shared}}

window.__maatriksInitAuthHandoff({
  deepLink: '{{authCallbackDeepLink}}'
});
