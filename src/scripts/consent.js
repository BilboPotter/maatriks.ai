/**
 * Cookie consent — gates GTM behind user choice.
 *
 * - If no choice made: show banner, GTM does not load.
 * - If accepted: load GTM, hide banner.
 * - If declined: do not load GTM, hide banner.
 * - Choice stored in cookie for 365 days.
 */

(function () {
  var COOKIE_NAME = 'cookie_consent';
  var GTM_ID = 'GTM-MQZPT547';
  var gtmLoaded = false;

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    var secureFlag = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax' + secureFlag;
  }

  function loadGTM() {
    if (gtmLoaded) {
      return;
    }

    gtmLoaded = true;

    // Head script
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = document.getElementsByTagName('script')[0];
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    f.parentNode.insertBefore(j, f);

    // Noscript iframe (for completeness, though JS is clearly running)
    var ns = document.createElement('noscript');
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + GTM_ID;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  }

  function hideBanner() {
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'none';
  }

  function showBanner() {
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = 'block';
  }

  // Check existing choice
  var consent = getCookie(COOKIE_NAME);

  if (consent === 'accepted') {
    loadGTM();
    hideBanner();
  } else if (consent === 'declined') {
    hideBanner();
  } else {
    showBanner();
  }

  // Bind buttons
  var acceptBtn = document.getElementById('cookie-accept');
  var declineBtn = document.getElementById('cookie-decline');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'accepted', 365);
      loadGTM();
      hideBanner();
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', function () {
      setCookie(COOKIE_NAME, 'declined', 365);
      hideBanner();
    });
  }
})();
