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
    type: true,
  };

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function getAllowedParams() {
    var hash = window.location.hash.substring(1);
    var search = window.location.search.substring(1);
    var params = Object.create(null);
    var hasAllowedParam = false;
    var hasConflict = false;

    function merge(raw) {
      if (!raw || hasConflict) {
        return;
      }

      var parsed = new URLSearchParams(raw);
      parsed.forEach(function (value, key) {
        if (!hasOwn(ALLOWED_PARAMS, key) || hasConflict) {
          return;
        }

        if (hasOwn(params, key)) {
          if (params[key] !== value) {
            hasConflict = true;
          }
          return;
        }

        params[key] = value;
        hasAllowedParam = true;
      });
    }

    merge(search);
    merge(hash);

    if (hasConflict) {
      return { valid: false, params: null };
    }

    return { valid: true, params: hasAllowedParam ? params : null };
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

  window.__maatriksAuthHandoffContract = 'query-fragment-merge-v2';

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

    function showInvalid() {
      didResolve = true;
      if (spinner) {
        spinner.style.display = 'none';
      }
      setStatus('Invalid authentication link');
      if (card) {
        card.classList.add('auth-error');
      }
      if (fallback) {
        fallback.classList.add('visible');
      }
      if (openAppButton) {
        openAppButton.removeAttribute('href');
        openAppButton.setAttribute('aria-disabled', 'true');
      }
    }

    var parsedParams = getAllowedParams();
    if (!parsedParams.valid) {
      clearSensitiveUrl();
      showInvalid();
      return;
    }

    var deepLink = buildDeepLink(config.deepLink, parsedParams.params);

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
