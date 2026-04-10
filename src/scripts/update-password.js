/**
 * Password reset handoff — /update-password
 *
 * Parses recovery parameters from the URL and attempts to open
 * the mobile app via deep link for password update. Shows fallback
 * if the app doesn't open within a timeout.
 *
 * Config values (injected at build time):
 *   {{passwordResetDeepLink}}
 */

{{> _auth-handoff-shared}}

window.__maatriksInitAuthHandoff({
  deepLink: '{{passwordResetDeepLink}}'
});
