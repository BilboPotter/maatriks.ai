(function () {
  var TIMEOUT_MS = 3000;
  // F-001: this page forwards Supabase auth callback params to the maatriks:// deep link. It MUST NOT forward
  // raw session tokens — a maatriks:// custom-scheme URL is interceptable (another installed app can register
  // the scheme), so a forwarded access_token/refresh_token is an account-takeover vector. The allow-list is
  // therefore limited to values that are safe to hand off:
  //   - code       — the PKCE authorization code; useless without the code_verifier held only on the
  //                   device that initiated the flow.
  //   - token_hash + type — single-use email OTP, verified server-side (verifyOtp), never a session by itself.
  //   - auth_state — the app's own CSRF nonce.
  //   - error / error_code / error_description — so the app can show why a link failed.
  // Removed (deliberately): access_token, refresh_token, provider_token, provider_refresh_token, token_type,
  // expires_at, expires_in. The app (flowType: 'pkce') exchanges the code / verifies the OTP itself.
  var ALLOWED_PARAMS = {
    auth_state: true,
    code: true,
    error: true,
    error_code: true,
    error_description: true,
    token_hash: true,
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

  // v3: the query+fragment merge contract is unchanged, but the allow-list no longer forwards raw session
  // tokens (F-001). Bumped so a deployed page's security posture is identifiable and cache-bustable.
  window.__maatriksAuthHandoffContract = 'query-fragment-merge-v3';

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
