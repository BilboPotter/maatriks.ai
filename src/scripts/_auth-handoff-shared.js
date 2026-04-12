(function () {
  var TIMEOUT_MS = 3000;
  var ALLOWED_PARAMS = {
    access_token: true,
    auth_state: true,
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

  function getAllowedParams() {
    var hash = window.location.hash.substring(1);
    var search = window.location.search.substring(1);
    var raw = hash || search;
    if (!raw) {
      return null;
    }

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

  function buildDeepLink(deepLink, params) {
    if (!params) {
      return deepLink;
    }

    var queryParts = Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    });
    var separator = deepLink.indexOf('?') !== -1 ? '&' : '?';

    return deepLink + separator + queryParts.join('&');
  }

  window.__maatriksInitAuthHandoff = function initAuthHandoff(config) {
    var card = document.getElementById('auth-card');
    var spinner = document.getElementById('spinner');
    var openAppButton = document.getElementById('open-app');
    var status = document.getElementById('status');
    var fallback = document.getElementById('fallback');
    var didResolve = false;

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

    var params = getAllowedParams();
    var deepLink = buildDeepLink(config.deepLink, params);

    if (openAppButton) {
      openAppButton.setAttribute('href', deepLink);
    }

    setStatus('Opening app...');
    clearSensitiveUrl();

    var start = Date.now();
    window.location.replace(deepLink);

    setTimeout(function () {
      if (!document.hidden) {
        showFallback();
      } else {
        showSuccess();
      }
    }, TIMEOUT_MS);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && Date.now() - start < TIMEOUT_MS + 500) {
        showSuccess();
      }
    });
  };
})();
