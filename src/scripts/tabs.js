(function () {
  "use strict";

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var pill = document.querySelector(".tab-pill");
  var track = document.querySelector(".tabnav-track");
  var nav = document.querySelector(".tabnav");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var defaultTarget = "home";
  var validTargets = tabs.map(function (t) { return t.dataset.target; });

  function targetFromHash() {
    var hash = window.location.hash.replace(/^#/, "");
    return validTargets.indexOf(hash) !== -1 ? hash : defaultTarget;
  }

  // Show a soft fade on whichever edge of the tab strip has more tabs
  // hidden past it, so a narrow screen signals that the strip scrolls.
  function updateFades() {
    if (!nav) return;
    var max = nav.scrollWidth - nav.clientWidth;
    nav.classList.toggle("fade-start", nav.scrollLeft > 2);
    nav.classList.toggle("fade-end", nav.scrollLeft < max - 2);
  }

  // Keep the active tab inside the visible part of the scrolling strip.
  function ensureVisible(tab) {
    if (!nav || !tab) return;
    var navRect = nav.getBoundingClientRect();
    var tabRect = tab.getBoundingClientRect();
    var pad = 16;
    var delta = 0;

    if (tabRect.left < navRect.left + pad) {
      delta = tabRect.left - navRect.left - pad;
    } else if (tabRect.right > navRect.right - pad) {
      delta = tabRect.right - navRect.right + pad;
    }

    if (delta) {
      nav.scrollBy({ left: delta, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function movePill(tab, animate) {
    if (!pill || !tab) return;

    var trackRect = track.getBoundingClientRect();
    var tabRect = tab.getBoundingClientRect();
    var x = tabRect.left - trackRect.left + track.scrollLeft;
    var width = tabRect.width;

    if (!animate) {
      var prevTransition = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = "translateX(" + x + "px)";
      pill.style.width = width + "px";
      // Force reflow so the transition is disabled only for this update.
      void pill.offsetWidth;
      pill.style.transition = prevTransition;
    } else {
      pill.style.transform = "translateX(" + x + "px)";
      pill.style.width = width + "px";
    }
  }

  function activate(target, opts) {
    opts = opts || {};
    var activeTab = null;

    tabs.forEach(function (tab) {
      var isActive = tab.dataset.target === target;
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive) activeTab = tab;
    });

    panels.forEach(function (panel) {
      var isActive = panel.id === "panel-" + target;
      panel.hidden = !isActive;
    });

    if (activeTab) {
      ensureVisible(activeTab);
      movePill(activeTab, !opts.skipAnimation);
      if (opts.focusTab) activeTab.focus();
      if (opts.scrollToPanel) {
        var panel = document.getElementById("panel-" + target);
        if (panel) panel.focus({ preventScroll: true });
      }
    }
  }

  function goTo(target, opts) {
    if (window.location.hash.replace(/^#/, "") === target) {
      activate(target, opts);
      return;
    }
    // Setting the hash pushes a history entry and fires "hashchange",
    // which keeps back/forward navigation in sync automatically.
    window.location.hash = target;
  }

  // Tab clicks
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      goTo(tab.dataset.target, {});
    });
  });

  // In-page links that jump to a tab (hero buttons, brand mark, etc.)
  document.querySelectorAll("[data-tab-link]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      goTo(link.dataset.tabLink, { scrollToPanel: true });
    });
  });

  // Keyboard navigation across the tablist (Left/Right/Home/End)
  track.addEventListener("keydown", function (event) {
    var currentIndex = tabs.findIndex(function (t) { return t.tabIndex === 0; });
    var nextIndex = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    goTo(tabs[nextIndex].dataset.target, { focusTab: true });
  });

  window.addEventListener("hashchange", function () {
    activate(targetFromHash(), {});
  });

  window.addEventListener("resize", function () {
    var activeTab = tabs.find(function (t) { return t.getAttribute("aria-selected") === "true"; });
    movePill(activeTab, false);
    updateFades();
  });

  if (nav) {
    nav.addEventListener("scroll", updateFades, { passive: true });
  }

  // Initial state — snap the pill in place with no animation on first paint.
  activate(targetFromHash(), { skipAnimation: true });
  updateFades();

  // Contact form — no backend, just a friendly confirmation.
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      status.textContent = "Thanks — your message has been noted. I'll reply soon.";
      form.reset();
    });
  }
})();
