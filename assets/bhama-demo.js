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

  var collectionCatalog = document.querySelector("[data-collection-list]");
  if (collectionCatalog) {
    var collectionSection = collectionCatalog.closest("section");
    var collectionGrid = collectionSection.querySelector(".collection-list-grid");
    var collectionCards = Array.prototype.slice.call(collectionSection.querySelectorAll("[data-collection-card]"));
    var collectionSearch = collectionSection.querySelector("[data-collection-search]");
    var collectionSort = collectionSection.querySelector("[data-collection-sort]");
    var collectionEmpty = collectionSection.querySelector("[data-collection-empty]");
    var activeCollectionFilter = "all";

    var collectionCategory = function (card) {
      var value = ((card.dataset.collectionCategory || "") + " " + (card.dataset.collectionName || "")).toLower();
      if (/jewel|bag|accessor|dupatta/.test(value)) return "accessories";
      if (/dress|western|coord|co-ord|modern|contemporary/.test(value)) return "contemporary";
      return "traditional";
    };

    var applyCollectionFilters = function () {
      var query = (collectionSearch.value || "").trim().toLower();
      var visibleCount = 0;

      collectionCards.forEach(function (card) {
        var name = (card.dataset.collectionName || "").toLower();
        var categoryMatches = activeCollectionFilter === "all" || collectionCategory(card) === activeCollectionFilter;
        var searchMatches = !query || name.indexOf(query) !== -1;
        var visible = categoryMatches && searchMatches;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      collectionEmpty.hidden = visibleCount !== 0;
    };

    collectionSection.querySelectorAll("[data-collection-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        activeCollectionFilter = button.dataset.collectionFilter;
        collectionSection.querySelectorAll("[data-collection-filter]").forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        applyCollectionFilters();
      });
    });

    collectionSearch.addEventListener("input", applyCollectionFilters);
    collectionSort.addEventListener("change", function () {
      var cards = Array.prototype.slice.call(collectionCards);
      cards.sort(function (a, b) {
        if (collectionSort.value === "name") {
          return (a.dataset.collectionName || "").localeCompare(b.dataset.collectionName || "");
        }
        if (collectionSort.value === "products-desc") {
          return Number(b.dataset.collectionProducts || 0) - Number(a.dataset.collectionProducts || 0);
        }
        return 0;
      });
      cards.forEach(function (card) { collectionGrid.appendChild(card); });
    });
  }


});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-price-range]').forEach((range) => {
    const minRange = range.querySelector('[data-min-range]');
    const maxRange = range.querySelector('[data-max-range]');
    const minInput = range.querySelector('[data-min-input]');
    const maxInput = range.querySelector('[data-max-input]');
    const minOutput = range.querySelector('[data-min-output]');
    const maxOutput = range.querySelector('[data-max-output]');
    const fill = range.querySelector('[data-price-fill]');
    if (!minRange || !maxRange || !minInput || !maxInput) return;

    const update = (changed) => {
      const step = Number(minRange.step) || 100;
      let minimum = Number(minRange.value);
      let maximum = Number(maxRange.value);
      if (maximum - minimum < step) {
        if (changed === minRange) minimum = maximum - step;
        else maximum = minimum + step;
      }

      minimum = Math.max(Number(minRange.min), minimum);
      maximum = Math.min(Number(maxRange.max), maximum);
      minRange.value = minimum;
      maxRange.value = maximum;
      minInput.value = minimum;
      maxInput.value = maximum;
      if (minOutput) minOutput.value = minimum.toLocaleString('en-IN');
      if (maxOutput) maxOutput.value = maximum.toLocaleString('en-IN');

      const low = Number(minRange.min);
      const high = Number(maxRange.max);
      const start = ((minimum - low) / (high - low)) * 100;
      const end = ((maximum - low) / (high - low)) * 100;
      fill.style.left = `${start}%`;
      fill.style.width = `${Math.max(0, end - start)}%`;
    };

    minRange.addEventListener('input', () => update(minRange));
    maxRange.addEventListener('input', () => update(maxRange));
    update();
  });
});
