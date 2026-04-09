/**
 * maatriks.ai — Scroll reveal + nav toggle
 * Lightweight vanilla JS. No dependencies.
 */

(function () {
  // Scroll reveal via IntersectionObserver
  if ('IntersectionObserver' in window) {
    var reveals = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show everything immediately
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // Active nav highlighting
  var currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var href = link.getAttribute('href').replace(/\/+$/, '') || '/';
    if (currentPath === href || (href !== '/' && currentPath.indexOf(href) === 0)) {
      link.classList.add('active');
    }
  });

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var nav = document.querySelector('.nav-links');
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close nav on link click (mobile)
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.querySelector('.nav-links').classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();
