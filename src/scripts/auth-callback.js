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

(function () {
  var DEEP_LINK = '{{authCallbackDeepLink}}';
  var TIMEOUT_MS = 3000;

  var card = document.getElementById('auth-card');
  var spinner = document.getElementById('spinner');
  var openAppButton = document.getElementById('open-app');
  var status = document.getElementById('status');
  var fallback = document.getElementById('fallback');

  // Parse auth params from hash fragment (Supabase default) or query string
  function getAuthParams() {
    var hash = window.location.hash.substring(1);
    var search = window.location.search.substring(1);
    var raw = hash || search;
    if (!raw) return null;

    var params = {};
    raw.split('&').forEach(function (pair) {
      var idx = pair.indexOf('=');
      if (idx !== -1) {
        params[decodeURIComponent(pair.slice(0, idx))] = decodeURIComponent(pair.slice(idx + 1));
      }
    });

    return Object.keys(params).length > 0 ? params : null;
  }

  // Build the deep link URL with auth params
  function buildDeepLink(params) {
    if (!params) return DEEP_LINK;

    var queryParts = [];
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
      }
    }

    var separator = DEEP_LINK.indexOf('?') !== -1 ? '&' : '?';
    return DEEP_LINK + separator + queryParts.join('&');
  }

  function showFallback() {
    spinner.style.display = 'none';
    status.textContent = 'Could not open app automatically';
    card.classList.add('auth-error');
    fallback.classList.add('visible');
  }

  function showSuccess() {
    spinner.style.display = 'none';
    status.textContent = 'Redirecting to app';
    card.classList.add('auth-success');
  }

  // Attempt the handoff
  var params = getAuthParams();
  var deepLink = buildDeepLink(params);

  if (openAppButton) {
    openAppButton.setAttribute('href', deepLink);
  }

  status.textContent = 'Opening app...';

  // Try to open the app
  var start = Date.now();
  window.location.href = deepLink;

  // If we're still here after timeout, show fallback
  setTimeout(function () {
    // If the page is still visible, the app didn't open
    if (!document.hidden) {
      showFallback();
    } else {
      showSuccess();
    }
  }, TIMEOUT_MS);

  // Listen for visibility change (app opened successfully)
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && Date.now() - start < TIMEOUT_MS + 500) {
      showSuccess();
    }
  });
})();
