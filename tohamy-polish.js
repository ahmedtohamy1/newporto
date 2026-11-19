/* ------------------------------------------------------------------
   tohamy — polish layer (behaviour)
   Fast anchor scrolling, scroll-spy, auto-hiding header, utility dock,
   theme switch, toasts, copy-to-clipboard, form feedback, hover video,
   reveal-on-scroll and small accessibility fixes.

   Important: every DOM addition waits for React hydration to finish so
   the server-rendered tree is never disturbed mid-hydration.
   ------------------------------------------------------------------ */
(function () {
  "use strict";
  if (window.__thPolish) return;
  window.__thPolish = true;

  var docEl = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isCV = !!document.querySelector(".cv-shell");
  var isPortfolio = !!document.querySelector(".forge-hero");
  var isArabic = (docEl.getAttribute("lang") || "").toLowerCase().indexOf("ar") === 0;

  var T = {
    copy: isArabic ? "نسخ" : "Copy",
    copied: isArabic ? "اتنسخ الإيميل ✓" : "Email copied ✓",
    copyFail: isArabic ? "مقدرناش ننسخ — الإيميل متحدد، اضغط Ctrl+C" : "Couldn’t copy — email selected, press Ctrl+C",
    toTop: isArabic ? "لفوق" : "Back to top",
    contact: isArabic ? "تواصل معايا" : "Get in touch",
    dark: isArabic ? "الوضع الداكن" : "Dark mode",
    light: isArabic ? "الوضع الفاتح" : "Light mode",
    print: isArabic ? "اطبع السيرة" : "Print CV",
    tools: isArabic ? "أدوات سريعة" : "Quick actions",
    emailOpen: isArabic ? "بنجهّز رسالتك في تطبيق الإيميل…" : "Opening your mail app…",
    emailFallback: isArabic
      ? "لو مافتحش، انسخ الإيميل من فوق وابعتلي عليه."
      : "If nothing opened, copy the email above and send it there.",
    required: isArabic ? "الحقل ده مطلوب" : "This field is required",
    badEmail: isArabic ? "اكتب إيميل صحيح" : "Enter a valid email address"
  };

  var SVG = {
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    sun: '<svg class="th-ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    moon: '<svg class="th-ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>'
  };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  var bar = null;
  var header = document.querySelector(".site-header");
  var dock = null;
  var topBtn = null;
  var ringCircle = null;
  var ringLen = 135;
  var themeBtn = null;
  var toastHost = null;
  var spyLinks = [];
  var spyItems = [];
  var lastY = window.scrollY || 0;
  var forceHeaderUntil = 0;
  var animId = 0;
  var rafId = 0;
  var booted = false;

  /* ---------------- theme ---------------- */
  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function currentTheme() {
    var t = docEl.getAttribute("data-theme");
    return t === "dark" || t === "light" ? t : systemTheme();
  }
  function syncThemeButton() {
    if (!themeBtn) return;
    var dark = currentTheme() === "dark";
    var label = dark ? T.light : T.dark;
    themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
    themeBtn.setAttribute("aria-label", label);
    themeBtn.setAttribute("data-tip", label);
  }
  function setTheme(t) {
    docEl.setAttribute("data-theme", t);
    try { localStorage.setItem("tohamy-theme", t); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", t === "dark" ? "#050608" : "#faf9f6");
    syncThemeButton();
  }

  /* ---------------- progress ---------------- */
  function ensureBar() {
    if (bar && bar.isConnected) return bar;
    bar = document.querySelector(".bt-progress, .th-progress");
    if (bar) return bar;
    if (isPortfolio) return null;
    bar = el("div", "th-progress");
    docEl.appendChild(bar);
    return bar;
  }

  /* ---------------- geometry ---------------- */
  function absTop(node) {
    var y = 0;
    while (node) {
      y += node.offsetTop || 0;
      node = node.offsetParent;
    }
    return y;
  }
  function maxScroll() {
    return Math.max(0, docEl.scrollHeight - window.innerHeight);
  }
  function isContactHash(hash) {
    return hash === "#contact" || hash === "#why-wait";
  }

  /* ---------------- scroll spy ---------------- */
  function buildSpy() {
    spyLinks = Array.prototype.slice.call(
      document.querySelectorAll('.desktop-navigation a[href^="#"], header nav a[href^="#"]')
    );
    spyItems = [];
    var seen = {};
    for (var i = 0; i < spyLinks.length; i++) {
      var link = spyLinks[i];
      var href = link.getAttribute("href") || "";
      if (href.length < 2) continue;
      var id = href.slice(1);
      if (seen[id]) continue;
      var target = document.getElementById(id);
      if (!target) continue;
      seen[id] = true;
      spyItems.push({ id: id, y: absTop(target) });
    }
    spyItems.sort(function (a, b) { return a.y - b.y; });
  }
  function updateSpy(y) {
    if (!spyItems.length) return;
    var probe = y + Math.min(window.innerHeight * 0.34, 220);
    var active = spyItems[0];
    for (var i = 0; i < spyItems.length; i++) {
      if (spyItems[i].y - 8 <= probe) active = spyItems[i];
    }
    for (var j = 0; j < spyLinks.length; j++) {
      var link = spyLinks[j];
      if (link.getAttribute("href") === "#" + active.id) {
        link.setAttribute("data-th-active", "true");
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("data-th-active");
        link.removeAttribute("aria-current");
      }
    }
  }

  /* ---------------- smooth scrolling ---------------- */
  function animateTo(y, opts) {
    y = clamp(y, 0, maxScroll());
    if (opts && opts.forceHeader) forceHeaderUntil = performance.now() + 1400;
    if (reduceMotion) {
      window.scrollTo(0, y);
      return;
    }
    if (animId) cancelAnimationFrame(animId);
    var start = window.scrollY || docEl.scrollTop;
    var delta = y - start;
    if (Math.abs(delta) < 3) return;
    var dur = clamp(Math.abs(delta) * 0.28, 420, 900);
    var t0 = performance.now();
    function step(now) {
      var t = clamp((now - t0) / dur, 0, 1);
      var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, start + delta * e);
      if (t < 1) animId = requestAnimationFrame(step);
      else animId = 0;
    }
    animId = requestAnimationFrame(step);
  }
  function scrollToHash(hash, opts) {
    var id = String(hash || "").replace(/^#/, "");
    if (!id) return false;
    var target = document.getElementById(id);
    if (!target) return false;
    if (isContactHash("#" + id)) {
      jumpToContact();
      return true;
    }
    releaseLock();
    animateTo(absTop(target) - 76, opts);
    return true;
  }

  /* The template pins the "why wait" scene and briefly locks scrolling while
     its timeline plays. A direct contact intent should not be held hostage by
     that scene, so release the lock while we travel to the panel. */
  var contactUnlock = 0;
  function releaseLock() {
    try {
      window.dispatchEvent(new CustomEvent("wahba:scroll-lock", { detail: false }));
    } catch (e) {}
    docEl.style.overflowY = "";
  }
  var nativeScrollTo = null;
  function jumpToContact() {
    if (!nativeScrollTo) nativeScrollTo = window.scrollTo;
    if (!docEl.hasAttribute("data-th-jump")) {
      docEl.setAttribute("data-th-jump", "1");
      // The template's scroll controller pins the page while its final scene
      // plays. Silence that pin for the duration of the direct jump.
      try { window.scrollTo = function () {}; } catch (e) {}
      docEl.style.scrollBehavior = "auto";
      setTimeout(function () {
        try { window.scrollTo = nativeScrollTo; } catch (e) {}
        docEl.removeAttribute("data-th-jump");
        releaseLock();
      }, 1000);
    }
    releaseLock();
    var tries = 0;
    if (contactUnlock) clearInterval(contactUnlock);
    function contactEnd() {
      // Park at the last fully-pinned scroll position: the panel fills the
      // viewport and the footer stays below the fold. The template reveals the
      // panel up to "top 2.8*stage" of the "why wait" section, so make sure we
      // are at least past that point too. Scrolling to the document end
      // instead lets the footer push the panel's top off-screen (the sticky
      // stage is clamped), which clips the submit button.
      var stage = document.querySelector(".why-wait-stage");
      var section = document.querySelector(".why-wait");
      var end = maxScroll();
      if (stage && section) {
        var top = absTop(section);
        if (getComputedStyle(stage).position === "sticky") {
          var revealEnd = top + Math.ceil(stage.offsetHeight * 2.8) + 8;
          var pinEnd = top + section.offsetHeight - stage.offsetHeight;
          end = Math.min(end, Math.max(revealEnd, pinEnd));
        } else {
          // Reduced-motion layout: the scene is not pinned, so simply put the
          // panel's top at the top of the viewport.
          var panelEl = document.getElementById("contact");
          var target = panelEl ? absTop(panelEl) : top;
          end = Math.min(end, Math.max(target, 0));
        }
      } else {
        var panel = document.getElementById("contact");
        var anchor = stage || panel;
        if (anchor) {
          var y = absTop(anchor);
          if (y > 0) end = Math.min(end, y);
        }
      }
      return end;
    }
    function nudgeContactForm() {
      // Very short viewports cannot fit the whole panel; scroll its inner
      // area just enough for the submit button to sit above the fold.
      var panel = document.getElementById("contact");
      if (!panel || panel.inert) return;
      var submit = panel.querySelector('.contact-form button[type="submit"]');
      if (!submit) return;
      var room = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
      if (room <= 0) return;
      var hidden = submit.getBoundingClientRect().bottom - (panel.getBoundingClientRect().bottom - 8);
      if (hidden > 0) panel.scrollTop += Math.min(hidden, room);
    }
    function step() {
      releaseLock();
      var end = contactEnd();
      docEl.scrollTop = end;
      nudgeContactForm();
      if (++tries > 16) {
        clearInterval(contactUnlock);
        contactUnlock = 0;
        releaseLock();
        // The template's reveal tween clears `inert` asynchronously; retry
        // once it has settled so the inner form scroll can be corrected.
        setTimeout(nudgeContactForm, 1200);
        setTimeout(nudgeContactForm, 2200);
        setTimeout(nudgeContactForm, 3200);
      }
    }
    step();
    contactUnlock = setInterval(step, 60);
  }
  window.__thScrollTo = function (hash) {
    if (scrollToHash(hash, { forceHeader: true })) {
      try { history.replaceState(null, "", hash); } catch (e) {}
    }
  };

  /* ---------------- toasts ---------------- */
  function toast(message) {
    if (!toastHost || !toastHost.isConnected) {
      toastHost = el("div", "th-toast-host");
      body.appendChild(toastHost);
    }
    var box = el("div", "th-toast");
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.appendChild(el("span", "th-toast__dot", SVG.check));
    var txt = el("span", "", "");
    txt.textContent = message;
    box.appendChild(txt);
    toastHost.appendChild(box);
    requestAnimationFrame(function () { box.classList.add("is-in"); });
    setTimeout(function () {
      box.classList.remove("is-in");
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 420);
    }, 4200);
    while (toastHost.children.length > 3) toastHost.removeChild(toastHost.firstChild);
  }
  function copyText(text) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0";
      body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      body.removeChild(ta);
      if (ok) {
        toast(T.copied);
        return;
      }
      var email = document.querySelector(".contact-email");
      if (email) {
        try {
          var range = document.createRange();
          range.selectNodeContents(email);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          email.focus({ preventScroll: true });
        } catch (e) {}
      }
      toast(T.copyFail);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(T.copied); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------------- dock ---------------- */
  function mountDock() {
    dock = el("div", "th-dock");
    dock.setAttribute("role", "group");
    dock.setAttribute("aria-label", T.tools);

    topBtn = el("button", "th-dock-btn th-dock-btn--top", "");
    topBtn.type = "button";
    topBtn.setAttribute("aria-label", T.toTop);
    topBtn.setAttribute("data-tip", T.toTop);
    topBtn.innerHTML =
      '<svg class="th-ring" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="21.5"></circle></svg>' +
      SVG.up;
    ringCircle = topBtn.querySelector("circle");
    if (ringCircle) {
      ringLen = ringCircle.r.baseVal.value * 2 * Math.PI;
      ringCircle.style.strokeDasharray = ringLen;
      ringCircle.style.strokeDashoffset = ringLen;
    }
    topBtn.addEventListener("click", function () { animateTo(0, { forceHeader: true }); });
    dock.appendChild(topBtn);

    if (isPortfolio) {
      var contactBtn = el("button", "th-dock-btn th-dock-btn--accent", SVG.mail);
      contactBtn.type = "button";
      contactBtn.setAttribute("aria-label", T.contact);
      contactBtn.setAttribute("data-tip", T.contact);
      contactBtn.addEventListener("click", function () { jumpToContact(); });

      themeBtn = el("button", "th-dock-btn", SVG.sun + SVG.moon);
      themeBtn.type = "button";
      themeBtn.addEventListener("click", function () {
        setTheme(currentTheme() === "dark" ? "light" : "dark");
      });
      syncThemeButton();

      dock.insertBefore(contactBtn, topBtn);
      dock.insertBefore(themeBtn, contactBtn);
    }

    if (isCV) {
      var printBtn = el("button", "th-dock-btn", SVG.print);
      printBtn.type = "button";
      printBtn.setAttribute("aria-label", T.print);
      printBtn.setAttribute("data-tip", T.print);
      printBtn.addEventListener("click", function () { window.print(); });
      dock.insertBefore(printBtn, topBtn);
    }

    body.appendChild(dock);
  }

  /* ---------------- copy email ---------------- */
  function addCopyButton() {
    var email = document.querySelector(".contact-email");
    if (!email || !email.parentNode) return;
    if (email.parentNode.querySelector(".th-copy")) return;
    var addr = (email.textContent || "").trim();
    if (!addr) return;
    var btn = el("button", "th-copy", SVG.copy);
    btn.type = "button";
    btn.setAttribute("aria-label", T.copy + " — " + addr);
    btn.setAttribute("title", T.copy);
    btn.addEventListener("click", function () { copyText(addr); });
    email.parentNode.insertBefore(btn, email.nextSibling);
  }

  /* ---------------- contact form ---------------- */
  function formPolish() {
    var form = document.querySelector(".contact-form");
    if (!form) return;
    if (form.getAttribute("data-th-polished") === "1") return;
    form.setAttribute("data-th-polished", "1");
    var submit = form.querySelector('button[type="submit"]');
    var status = el("p", "th-form-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    if (submit && submit.parentNode) submit.parentNode.insertBefore(status, submit.nextSibling);

    var fields = Array.prototype.slice.call(form.querySelectorAll("input, textarea"));
    var firstInvalid = null;

    function clearField(field) {
      field.removeAttribute("aria-invalid");
      var label = field.closest("label");
      if (!label) return;
      label.classList.remove("th-invalid");
      var msg = label.querySelector(".th-field-msg");
      if (msg) msg.parentNode.removeChild(msg);
    }
    function showField(field) {
      var label = field.closest("label");
      if (!label) return;
      field.setAttribute("aria-invalid", "true");
      label.classList.add("th-invalid");
      if (!label.querySelector(".th-field-msg")) {
        var msg = el("span", "th-field-msg");
        var badEmail = field.type === "email" && field.value && field.validity && !field.validity.valid;
        msg.textContent = badEmail ? T.badEmail : T.required;
        label.appendChild(msg);
      }
      if (!firstInvalid) firstInvalid = field;
    }

    fields.forEach(function (field) {
      field.addEventListener("invalid", function (e) {
        e.preventDefault();
        showField(field);
        if (firstInvalid === field) {
          requestAnimationFrame(function () { field.focus({ preventScroll: false }); });
        }
      });
      field.addEventListener("input", function () { clearField(field); });
    });

    form.addEventListener("submit", function () {
      firstInvalid = null;
      fields.forEach(clearField);
      if (submit) {
        submit.setAttribute("aria-busy", "true");
        setTimeout(function () { submit.removeAttribute("aria-busy"); }, 1800);
      }
      status.textContent = T.emailOpen;
      toast(T.emailOpen);
      setTimeout(function () { status.textContent = T.emailFallback; }, 2100);
    }, true);

    var area = form.querySelector("textarea");
    if (area && area.maxLength > 0) {
      var label = area.closest("label");
      var counter = el("span", "th-counter");
      var paint = function () {
        var n = area.value.length;
        var a = n.toLocaleString(isArabic ? "ar-EG" : "en-US");
        var b = area.maxLength.toLocaleString(isArabic ? "ar-EG" : "en-US");
        counter.textContent = a + " / " + b;
        counter.classList.toggle("is-near", n > area.maxLength * 0.9);
      };
      area.addEventListener("input", paint);
      paint();
      if (label) label.appendChild(counter);
    }
  }

  /* ---------------- hover video previews ---------------- */
  function videoPreview() {
    if (reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var tiles = document.querySelectorAll(".brand-media-tile");
    Array.prototype.forEach.call(tiles, function (tile) {
      var video = tile.querySelector("video");
      if (!video) return;
      if (tile.getAttribute("data-th-video") === "1") return;
      tile.setAttribute("data-th-video", "1");
      function play() {
        try { video.preload = "auto"; } catch (e) {}
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      }
      function pause() {
        if (tile.getAttribute("aria-pressed") === "true") return;
        try { video.pause(); } catch (e) {}
      }
      tile.addEventListener("pointerenter", play);
      tile.addEventListener("focus", play);
      tile.addEventListener("pointerleave", pause);
      tile.addEventListener("blur", pause);
    });
  }

  /* ---------------- accessibility ---------------- */
  function a11y() {
    var ring = document.querySelector(".why-wait-phone-object");
    if (ring) ring.removeAttribute("tabindex");
    var ext = document.querySelectorAll('a[target="_blank"]');
    Array.prototype.forEach.call(ext, function (a) {
      var rel = (a.getAttribute("rel") || "").toLowerCase();
      if (rel.indexOf("noopener") === -1) {
        a.setAttribute("rel", (rel ? rel + " " : "") + "noopener noreferrer");
      }
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  function reveals() {
    if (reduceMotion) return;
    if (docEl.classList.contains("th-anim")) return;
    var selectors = isCV
      ? [".cv-hero > *", ".cv-sidebar > *", ".cv-main > *", ".cv-footer-inner"]
      : [".site-copyright > p"];
    var items = [];
    selectors.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (node) {
        if (items.indexOf(node) === -1) items.push(node);
      });
    });
    if (!items.length) return;
    docEl.classList.add("th-anim");
    items.forEach(function (node, i) {
      node.classList.add("th-reveal");
      node.style.setProperty("--th-delay", Math.min(i % 6, 6) * 45 + "ms");
    });
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("th-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("th-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    items.forEach(function (n) { io.observe(n); });
    setTimeout(function () {
      items.forEach(function (n) { n.classList.add("th-in"); });
    }, 2800);
  }

  /* ---------------- scroll loop ---------------- */
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      var y = window.scrollY || docEl.scrollTop;
      var max = maxScroll();
      var p = max > 0 ? clamp(y / max, 0, 1) : 0;

      var progress = ensureBar();
      if (progress) progress.style.transform = "scaleX(" + p + ")";

      if (ringCircle) ringCircle.style.strokeDashoffset = String(ringLen * (1 - p));
      if (topBtn) topBtn.classList.toggle("is-visible", y > 560);
      if (dock) {
        dock.classList.toggle("is-on", y > 120 || isCV);
        if (isPortfolio) dock.classList.toggle("is-contact", max > 0 && y > max - 160);
      }

      if (header) {
        header.classList.toggle("th-scrolled", y > 28);
        var now = performance.now();
        var goingDown = y > lastY + 5;
        var goingUp = y < lastY - 5;
        if (goingDown && y > 420 && now > forceHeaderUntil && !header.contains(document.activeElement)) {
          header.classList.add("th-header-hidden");
        } else if (goingUp || y < 170) {
          header.classList.remove("th-header-hidden");
        }
      }

      updateSpy(y);
      lastY = y;
    });
  }

  function attachListeners() {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      if (a.closest(".bp-overlay")) return;
      if (a.hasAttribute("download") || a.getAttribute("target") === "_blank") return;
      var href = a.getAttribute("href");
      if (!href || href === "#" || a.hasAttribute("data-th-ignore")) return;
      if (!document.getElementById(href.slice(1))) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!scrollToHash(href, { forceHeader: true })) return;
      if (!isContactHash(href)) {
        try { history.replaceState(null, "", href); } catch (err) {}
      }
    }, true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      if (header) header.classList.remove("th-header-hidden");
      buildSpy();
      onScroll();
    }, { passive: true });
    window.addEventListener("wheel", function () {
      if (header) header.classList.remove("th-header-hidden");
    }, { passive: true });
    window.addEventListener("touchstart", function () {
      if (header) header.classList.remove("th-header-hidden");
    }, { passive: true });
  }

  /* ---------------- boot ---------------- */
  function ensureDom() {
    if (!document.querySelector(".th-dock")) {
      dock = null;
      topBtn = null;
      ringCircle = null;
      themeBtn = null;
      mountDock();
      onScroll();
    }
    addCopyButton();
    formPolish();
    videoPreview();
    a11y();
  }

  function boot() {
    if (booted) return;
    booted = true;

    ensureBar();
    if (isPortfolio) {
      setTimeout(function () {
        if (!document.querySelector(".bt-progress, .th-progress")) {
          bar = el("div", "th-progress");
          docEl.appendChild(bar);
        }
      }, 4200);
    }

    ensureDom();
    reveals();
    buildSpy();
    attachListeners();
    onScroll();

    setTimeout(function () { ensureDom(); buildSpy(); onScroll(); }, 700);
    setTimeout(function () { ensureDom(); buildSpy(); onScroll(); }, 1800);
    setTimeout(function () { ensureDom(); buildSpy(); onScroll(); }, 3800);

    if (location.hash && !isCV) {
      setTimeout(function () { scrollToHash(location.hash); }, 420);
    }

    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    if (!meta.getAttribute("content")) {
      meta.setAttribute("content", currentTheme() === "dark" ? "#050608" : "#faf9f6");
    }
  }

  function isHydrated() {
    if (!isPortfolio) return true;
    var probe = document.querySelector(".gf-hit, .hero-technology-folder");
    if (!probe) return true;
    var keys = Object.keys(probe);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf("__reactProps$") === 0) return true;
    }
    return false;
  }

  function whenHydrated(fn) {
    if (window.__thWhenHydrated) {
      window.__thWhenHydrated(function () { setTimeout(fn, 160); });
      return;
    }
    if (isHydrated()) { setTimeout(fn, 160); return; }
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (isHydrated() || tries > 120) {
        clearInterval(timer);
        setTimeout(fn, 160);
      }
    }, 80);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { whenHydrated(boot); });
  } else {
    whenHydrated(boot);
  }
})();
