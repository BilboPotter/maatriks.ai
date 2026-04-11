/**
 * maatriks.ai — landing interactions
 * Single scroll-driven animation loop, lightweight observers, no dependencies.
 */

(function () {
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setupRevealObserver() {
    var reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) {
      return;
    }

    if (!("IntersectionObserver" in window) || reducedMotion) {
      reveals.forEach(function (element) {
        element.classList.add("visible");
      });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -48px 0px"
    });

    reveals.forEach(function (element) {
      revealObserver.observe(element);
    });
  }

  function setupNavigation() {
    var currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".nav-links a").forEach(function (link) {
      var href = (link.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      if (currentPath === href || (href !== "/" && currentPath.indexOf(href) === 0)) {
        link.classList.add("active");
      }
    });

    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav-links");
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setupNewsletterFallback() {
    var form = document.querySelector("[data-newsletter-form]");
    var note = document.querySelector("[data-newsletter-note]");
    if (!form || !note) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var emailInput = form.querySelector("input[type='email']");
      var email = emailInput ? emailInput.value.trim() : "";
      if (!email) {
        note.textContent = "Enter an email address first.";
        note.classList.remove("is-success");
        return;
      }

      var subject = "Newsletter signup";
      var body = "Please add " + email + " to the maatriks.ai newsletter list.";
      note.textContent = "Opening your email client...";
      note.classList.add("is-success");
      window.location.href = "mailto:{{supportEmail}}?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  function setupCarousel() {
    var carousel = document.querySelector("[data-carousel]");
    if (!carousel) {
      return;
    }

    var track = carousel.querySelector("[data-carousel-track]");
    var prevButton = carousel.querySelector("[data-carousel-prev]");
    var nextButton = carousel.querySelector("[data-carousel-next]");
    var dotsRoot = carousel.querySelector("[data-carousel-dots]");
    var cards = Array.prototype.slice.call(track.children);
    var activeIndex = 0;
    var intervalId = null;
    var mobileQuery = window.matchMedia("(max-width: 767px)");

    if (!track || !cards.length || !dotsRoot) {
      return;
    }

    function createDots() {
      cards.forEach(function (_, index) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot" + (index === 0 ? " active" : "");
        dot.setAttribute("aria-label", "Go to review " + (index + 1));
        dot.addEventListener("click", function () {
          goTo(index);
        });
        dotsRoot.appendChild(dot);
      });
    }

    function updateDots(index) {
      dotsRoot.querySelectorAll(".carousel-dot").forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function goTo(index) {
      activeIndex = (index + cards.length) % cards.length;
      track.scrollTo({
        left: cards[activeIndex].offsetLeft,
        behavior: reducedMotion ? "auto" : "smooth"
      });
      updateDots(activeIndex);
    }

    function advance(direction) {
      goTo(activeIndex + direction);
    }

    function syncFromScroll() {
      var closestIndex = 0;
      var closestDistance = Number.POSITIVE_INFINITY;
      var scrollLeft = track.scrollLeft;

      cards.forEach(function (card, index) {
        var distance = Math.abs(card.offsetLeft - scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      activeIndex = closestIndex;
      updateDots(activeIndex);
    }

    function stopAutoPlay() {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }

    function startAutoPlay() {
      if (reducedMotion || intervalId || mobileQuery.matches) {
        return;
      }

      intervalId = window.setInterval(function () {
        advance(1);
      }, 4200);
    }

    createDots();
    startAutoPlay();

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        advance(-1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        advance(1);
      });
    }

    track.addEventListener("scroll", syncFromScroll, { passive: true });
    carousel.addEventListener("mouseenter", stopAutoPlay);
    carousel.addEventListener("mouseleave", startAutoPlay);
    carousel.addEventListener("focusin", stopAutoPlay);
    carousel.addEventListener("focusout", startAutoPlay);

    function syncAutoplayMode(event) {
      if (event.matches) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    }

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", syncAutoplayMode);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(syncAutoplayMode);
    }
  }

  function setupSnakeLine() {
    var shell = document.getElementById("story-shell");
    var svg = document.getElementById("snake-line");
    var bgPath = document.getElementById("snake-path-bg");
    var litPath = document.getElementById("snake-path-lit");
    if (!shell || !svg || !bgPath || !litPath) {
      return;
    }

    if (window.matchMedia("(max-width: 767px)").matches) {
      svg.style.display = "none";
      return;
    }

    var lastPath = "";
    var pathLength = 0;
    var frameRequested = false;

    function getAnchorPoints() {
      var shellRect = shell.getBoundingClientRect();
      var anchors = Array.prototype.slice.call(shell.querySelectorAll("[data-snake-anchor]"));

      return anchors.map(function (anchor) {
        var target = anchor.querySelector(".device") || anchor;
        var rect = target.getBoundingClientRect();
        return {
          x: rect.left - shellRect.left + rect.width / 2,
          y: rect.top - shellRect.top + rect.height / 2
        };
      });
    }

    function buildDesktopPath(points) {
      var path = "M " + points[0].x + " " + points[0].y;

      for (var index = 1; index < points.length; index += 1) {
        var previous = points[index - 1];
        var current = points[index];
        var midY = (previous.y + current.y) / 2;
        path += " C " + previous.x + " " + midY + ", " + current.x + " " + midY + ", " + current.x + " " + current.y;
      }

      return path;
    }

    function rebuildPath() {
      var points = getAnchorPoints();
      if (points.length < 2) {
        return;
      }

      var width = Math.max(shell.scrollWidth, shell.clientWidth);
      var height = shell.scrollHeight;
      var d = buildDesktopPath(points);

      if (d === lastPath) {
        return;
      }

      lastPath = d;
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      bgPath.setAttribute("d", d);
      litPath.setAttribute("d", d);
      pathLength = litPath.getTotalLength();
      litPath.style.strokeDasharray = String(pathLength);
      updateProgress();
    }

    function updateProgress() {
      if (!pathLength) {
        return;
      }

      var rect = shell.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      var progress = clamp((viewportHeight - rect.top) / (rect.height + viewportHeight * 0.4), 0, 1);
      litPath.style.strokeDashoffset = String(pathLength * (1 - progress));
    }

    function requestFrame() {
      if (frameRequested) {
        return;
      }

      frameRequested = true;
      window.requestAnimationFrame(function () {
        frameRequested = false;
        rebuildPath();
        updateProgress();
      });
    }

    requestFrame();
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    window.addEventListener("load", requestFrame);

    if ("ResizeObserver" in window) {
      var resizeObserver = new ResizeObserver(requestFrame);
      resizeObserver.observe(shell);
    }
  }

  setupRevealObserver();
  setupNavigation();
  setupNewsletterFallback();
  setupCarousel();
  setupSnakeLine();
})();
