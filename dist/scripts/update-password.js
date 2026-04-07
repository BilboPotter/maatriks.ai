/**
 * Password reset handoff — /update-password
 *
 * Parses recovery parameters from the URL and attempts to open
 * the mobile app via deep link for password update. Shows fallback
 * if the app doesn't open within a timeout.
 *
 * Config values (injected at build time):
 *   maatriks://update-password
 *   maatriks
 */

(function () {
  var DEEP_LINK = 'maatriks://update-password';
  var TIMEOUT_MS = 3000;

  var card = document.getElementById('auth-card');
  var spinner = document.getElementById('spinner');
  var status = document.getElementById('status');
  var fallback = document.getElementById('fallback');

  // Parse recovery params from hash fragment or query string
  function getRecoveryParams() {
    var hash = window.location.hash.substring(1);
    var search = window.location.search.substring(1);
    var raw = hash || search;
    if (!raw) return null;

    var params = {};
    raw.split('&').forEach(function (pair) {
      var parts = pair.split('=');
      if (parts.length === 2) {
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      }
    });

    return Object.keys(params).length > 0 ? params : null;
  }

  // Build the deep link URL with recovery params
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
  var params = getRecoveryParams();
  var deepLink = buildDeepLink(params);

  status.textContent = 'Opening app...';

  // Try to open the app
  var start = Date.now();
  window.location.href = deepLink;

  // If we're still here after timeout, show fallback
  setTimeout(function () {
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
