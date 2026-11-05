$(function () {
  var revealItems = document.querySelectorAll(".section, .page-hero, .hero-copy, .hero-panel, .product-card, .collection-card, .mood-card, .teaser, .trust-strip article, .why-card, .contact-card, .policy-card");

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach(function (item, index) {
      item.classList.add("reveal");
      item.style.setProperty("--delay", Math.min(index % 8, 7) * 55 + "ms");
      observer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sticky header: shrink on scroll
  var siteHeader = document.getElementById("siteHeader");
  if (siteHeader) {
    var onScroll = function () {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Rotating announcement bar
  var announceSpans = Array.prototype.slice.call(document.querySelectorAll("#announceTrack span"));
  if (announceSpans.length > 1) {
    var announceIndex = Math.max(0, announceSpans.findIndex(function (span) {
      return span.classList.contains("is-active");
    }));
    var announceTimer;

    var showAnnounce = function (nextIndex) {
      announceSpans[announceIndex].classList.remove("is-active");
      announceIndex = (nextIndex + announceSpans.length) % announceSpans.length;
      announceSpans[announceIndex].classList.add("is-active");
    };

    var startAnnounce = function () {
      window.clearInterval(announceTimer);
      if (!prefersReducedMotion) {
        announceTimer = window.setInterval(function () {
          showAnnounce(announceIndex + 1);
        }, 4500);
      }
    };

    var announcePrev = document.getElementById("announcePrev");
    var announceNext = document.getElementById("announceNext");

    if (announcePrev) {
      announcePrev.addEventListener("click", function () {
        showAnnounce(announceIndex - 1);
        startAnnounce();
      });
    }

    if (announceNext) {
      announceNext.addEventListener("click", function () {
        showAnnounce(announceIndex + 1);
        startAnnounce();
      });
    }

    startAnnounce();
  }


});
