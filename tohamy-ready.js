/* Tiny hydration gate shared by the custom layers.
   React owns the whole document on this mirrored Next.js page, so any node
   added while hydration is still running makes React throw away the tree.
   Layers ask this helper before they touch the DOM. */
(function () {
  "use strict";
  if (window.__thWhenHydrated) return;

  var waiters = [];
  var poll = 0;
  var forced = 0;

  function probe() {
    return document.querySelector(".gf-hit, .hero-technology-folder, .cv-shell");
  }
  function isReady() {
    var el = probe();
    if (!el) return false;
    if (el.classList && el.classList.contains("cv-shell")) return true;
    var keys = Object.keys(el);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf("__reactProps$") === 0 || keys[i].indexOf("__reactFiber$") === 0) return true;
    }
    return false;
  }
  function flush() {
    if (window.__thHydrated) return;
    window.__thHydrated = true;
    if (poll) { clearInterval(poll); poll = 0; }
    if (forced) { clearTimeout(forced); forced = 0; }
    var list = waiters.slice();
    waiters.length = 0;
    list.forEach(function (fn) {
      try { fn(); } catch (e) { setTimeout(function () { throw e; }, 0); }
    });
  }
  function startPolling() {
    if (poll) return;
    var tries = 0;
    poll = setInterval(function () {
      tries++;
      if (isReady() || tries > 150) flush();
    }, 80);
    forced = setTimeout(flush, 14000);
  }

  window.__thWhenHydrated = function (fn) {
    if (window.__thHydrated) {
      setTimeout(function () {
        try { fn(); } catch (e) { setTimeout(function () { throw e; }, 0); }
      }, 0);
      return;
    }
    waiters.push(fn);
    if (isReady()) setTimeout(flush, 0);
    else startPolling();
  };

  if (isReady()) setTimeout(flush, 0);
  else startPolling();
})();
