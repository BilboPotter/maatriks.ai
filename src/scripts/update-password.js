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

(function () {
  var DEEP_LINK = '{{passwordResetDeepLink}}';
  var TIMEOUT_MS = 3000;
  var ALLOWED_PARAMS = {
    access_token: true,
    code: true,
    error: true,
    error_code: true,
    error_description: true,
    expires_at: true,
    expires_in: true,
    provider_refresh_token: true,
    provider_token: true,
    refresh_token: true,
    token_hash: true,
    token_type: true,
    type: true
  };

  var card = document.getElementById('auth-card');
  var spinner = document.getElementById('spinner');
  var openAppButton = document.getElementById('open-app');
  var status = document.getElementById('status');
  var fallback = document.getElementById('fallback');
  var didResolve = false;

  // Parse recovery params from hash fragment or query string
  function getRecoveryParams() {
    var hash = window.location.hash.substring(1);
    var search = window.location.search.substring(1);
    var raw = hash || search;
    if (!raw) return null;

    var params = {};
    var parsed = new URLSearchParams(raw);
    parsed.forEach(function (value, key) {
      if (ALLOWED_PARAMS[key]) {
        params[key] = value;
      }
    });

    return Object.keys(params).length > 0 ? params : null;
  }

  function clearSensitiveUrl() {
    if (!window.history || !window.history.replaceState) {
      return;
    }

    window.history.replaceState(null, document.title, window.location.pathname);
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

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function showFallback() {
    if (didResolve) {
      return;
    }

    didResolve = true;
    if (spinner) {
      spinner.style.display = 'none';
    }
    setStatus('Could not open app automatically');
    if (card) {
      card.classList.add('auth-error');
    }
    if (fallback) {
      fallback.classList.add('visible');
    }
  }

  function showSuccess() {
    if (didResolve) {
      return;
    }

    didResolve = true;
    if (spinner) {
      spinner.style.display = 'none';
    }
    setStatus('Redirecting to app');
    if (card) {
      card.classList.add('auth-success');
    }
  }

  // Attempt the handoff
  var params = getRecoveryParams();
  var deepLink = buildDeepLink(params);

  if (openAppButton) {
    openAppButton.setAttribute('href', deepLink);
  }

  setStatus('Opening app...');
  clearSensitiveUrl();

  // Try to open the app
  var start = Date.now();
  window.location.replace(deepLink);

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
