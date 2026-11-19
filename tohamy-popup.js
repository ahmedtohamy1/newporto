(function () {
  "use strict";
  var BASE = /^\/newporto(?:\/|$)/.test(location.pathname) ? '/newporto' : '';
  var path = location.pathname.slice(BASE.length) || '/';
  var EN = /^\/en(\/|$)/.test(path);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var css = `
.bp-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:22px;background:radial-gradient(120% 100% at 50% 0%,rgba(26,20,16,.52),rgba(6,4,3,.74));-webkit-backdrop-filter:blur(18px) saturate(1.15);backdrop-filter:blur(18px) saturate(1.15);opacity:0;transition:opacity .3s ease;touch-action:none}
.bp-overlay.bp-in{opacity:1}
.bp-dialog{position:relative;width:min(1040px,100%);max-height:min(88vh,880px);overflow:auto;overscroll-behavior:contain;border-radius:30px;padding:0;background:linear-gradient(165deg,#fffdfa,#f6f0e7 62%,#efe6d9);color:#1a1410;box-shadow:0 50px 140px rgba(0,0,0,.5),inset 0 1px 0 #fff;transform:translateY(26px) scale(.965);transition:transform .5s cubic-bezier(.22,1,.36,1);font-family:var(--font-thmanyah-sans,'Segoe UI',system-ui,sans-serif);scrollbar-width:thin;scrollbar-color:rgba(150,105,68,.5) transparent}
.bp-in .bp-dialog{transform:none}
.bp-dialog::-webkit-scrollbar{width:10px}
.bp-dialog::-webkit-scrollbar-thumb{border:3px solid transparent;border-radius:999px;background:rgba(150,105,68,.55);background-clip:padding-box}
.bp-handle{display:none;position:sticky;top:8px;z-index:7;width:44px;height:5px;margin:8px auto 0;border-radius:99px;background:rgba(26,20,16,.22)}
.bp-head{position:sticky;top:0;z-index:5;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:26px 28px 18px;background:linear-gradient(180deg,rgba(255,253,250,.98) 66%,rgba(255,253,250,0));-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.bp-eyebrow{display:flex;align-items:center;gap:8px;margin:0;color:#9a5a33;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.bp-eyebrow::before{content:"";width:7px;height:7px;flex:none;border-radius:50%;background:#e08a4e;box-shadow:0 0 10px rgba(224,138,78,.8)}
.bp-count{margin-inline-start:4px;padding:2px 8px;border-radius:999px;background:rgba(26,20,16,.07);color:#6b5a4d;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:none}
.bp-title{margin:9px 0 0;font-size:clamp(26px,3.4vw,38px);font-weight:700;line-height:1.12;letter-spacing:-.025em;text-wrap:balance}
.bp-meta{margin:7px 0 0;color:#6e655c;font-size:14px;line-height:1.5}
.bp-close{flex:none;display:grid;place-items:center;width:46px;height:46px;border:1px solid rgba(26,20,16,.12);border-radius:50%;background:rgba(255,255,255,.62);color:#1a1410;font:400 17px/1 system-ui,sans-serif;cursor:pointer;transition:transform .35s cubic-bezier(.34,1.4,.5,1),background .25s,color .25s,border-color .25s}
.bp-close:hover{transform:rotate(90deg) scale(1.05);background:#1a1410;border-color:#1a1410;color:#fff}
.bp-close:focus-visible{outline:2px solid #a95f32;outline-offset:3px}
.bp-body{padding:4px 28px 30px}
.bp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(218px,1fr));gap:16px}
.bp-card{display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(26,20,16,.08);border-radius:18px;background:#fff;color:inherit;text-decoration:none;opacity:0;transform:translateY(16px);animation:bp-up .6s cubic-bezier(.22,1,.36,1) forwards;box-shadow:0 1px 0 rgba(0,0,0,.03),0 14px 30px -20px rgba(26,20,16,.4);transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s,border-color .3s}
.bp-card:hover,.bp-card:focus-visible{transform:translateY(-6px);border-color:rgba(224,138,78,.5);box-shadow:0 28px 54px -28px rgba(26,20,16,.55);outline:none}
.bp-card:focus-visible{box-shadow:0 0 0 2px #a95f32,0 28px 54px -28px rgba(26,20,16,.55)}
.bp-thumb{position:relative;overflow:hidden;aspect-ratio:816/552;background:#e9e1d5}
.bp-thumb img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .75s cubic-bezier(.22,1,.36,1)}
.bp-card:hover .bp-thumb img,.bp-card:focus-visible .bp-thumb img{transform:scale(1.06)}
.bp-badge{position:absolute;top:10px;inset-inline-start:10px;padding:4px 9px;border-radius:999px;background:rgba(11,9,8,.72);color:#f5d2b4;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.bp-info{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px 15px}
.bp-name{font-size:15.5px;font-weight:700;line-height:1.25;letter-spacing:-.01em}
.bp-sub{margin-top:3px;color:#7a6f65;font-size:12.5px;line-height:1.45}
.bp-go{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#1a1410;color:#fff;font-size:14px;transition:transform .35s cubic-bezier(.34,1.4,.5,1),background .3s}
.bp-card:hover .bp-go,.bp-card:focus-visible .bp-go{background:#a95f32;transform:scale(1.1)}
@keyframes bp-up{to{opacity:1;transform:none}}
@media (max-width:640px){
  .bp-overlay{padding:0;align-items:flex-end;background:rgba(6,4,3,.6)}
  .bp-dialog{width:100%;max-height:92vh;border-radius:26px 26px 0 0;transform:translateY(100%)}
  .bp-in .bp-dialog{transform:none}
  .bp-handle{display:block}
  .bp-head{padding:16px 18px 14px;cursor:grab;touch-action:none}
  .bp-head:active{cursor:grabbing}
  .bp-title{font-size:26px}
  .bp-meta{font-size:12.5px}
  .bp-close{width:42px;height:42px}
  .bp-body{padding:0 16px calc(22px + env(safe-area-inset-bottom))}
  .bp-grid{grid-template-columns:1fr 1fr;gap:10px}
  .bp-info{padding:10px 11px 12px}
  .bp-name{font-size:13.5px}
  .bp-sub{font-size:11px}
  .bp-go{display:none}
  .bp-badge{top:7px;inset-inline-start:7px;font-size:8.5px;padding:3px 7px}
}
@media (prefers-reduced-motion:reduce){
  .bp-overlay,.bp-dialog,.bp-card,.bp-thumb img,.bp-go,.bp-close{transition:none;animation:none;opacity:1;transform:none}
}
`;
  function installStyles() {
    if (document.querySelector('style[data-th-popup]')) return;
    var st = document.createElement('style');
    st.setAttribute('data-th-popup', '');
    st.textContent = css;
    document.head.appendChild(st);
  }
  if (window.__thWhenHydrated) window.__thWhenHydrated(installStyles);
  else installStyles();

  var overlay = null;
  var lastFocus = null;
  var lastTrigger = null;
  var lockedScrollbar = 0;
  var prevOverflowX = "";
  var prevOverflowY = "";
  var inerted = [];

  function rememberTrigger(e) {
    var t = e.target && e.target.closest ? e.target.closest(".gf-hit") : null;
    if (t) lastTrigger = t;
  }
  document.addEventListener("pointerdown", rememberTrigger, true);
  document.addEventListener("click", rememberTrigger, true);

  function esc(t) {
    var d = document.createElement("div");
    d.textContent = t == null ? "" : t;
    return d.innerHTML;
  }

  function focusables() {
    if (!overlay) return [];
    return Array.prototype.slice.call(overlay.querySelectorAll('a[href],button:not([disabled])'));
  }

  function onKey(e) {
    if (!overlay) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      var f = focusables();
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === overlay)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function lock() {
    lockedScrollbar = window.innerWidth - document.documentElement.clientWidth;
    prevOverflowX = document.documentElement.style.overflowX;
    prevOverflowY = document.documentElement.style.overflowY;
    document.documentElement.style.overflow = "hidden";
    if (lockedScrollbar > 0) {
      document.body.style.paddingInlineEnd = lockedScrollbar + "px";
    }
  }

  function unlock() {
    document.documentElement.style.overflow = "";
    document.documentElement.style.overflowX = prevOverflowX;
    document.documentElement.style.overflowY = prevOverflowY;
    document.body.style.paddingInlineEnd = "";
  }

  function inertBackground(on) {
    if (on) {
      inerted = [];
      Array.prototype.forEach.call(document.body.children, function (child) {
        if (child === overlay || child.tagName === "SCRIPT") return;
        if (child.hasAttribute("inert")) return;
        child.setAttribute("inert", "");
        inerted.push(child);
      });
    } else {
      inerted.forEach(function (child) { child.removeAttribute("inert"); });
      inerted = [];
    }
  }

  function setTriggerExpanded(v) {
    if (lastFocus && lastFocus.getAttribute) {
      if (lastFocus.hasAttribute("aria-expanded")) {
        lastFocus.setAttribute("aria-expanded", v ? "true" : "false");
      }
    }
  }

  function close() {
    if (!overlay) return;
    var o = overlay;
    overlay = null;
    o.classList.remove("bp-in");
    document.removeEventListener("keydown", onKey, true);
    setTriggerExpanded(false);
    inertBackground(false);
    unlock();
    setTimeout(function () {
      if (o.parentNode) o.parentNode.removeChild(o);
    }, reduce ? 0 : 320);
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
  }

  function handleInternalLink(href) {
    close();
    setTimeout(function () {
      if (typeof window.__thScrollTo === "function") window.__thScrollTo(href);
      else {
        var target = document.getElementById(href.replace(/^#/, ""));
        if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    }, reduce ? 0 : 260);
  }

  window.addEventListener("tohamy:folder", function (ev) {
    installStyles();
    var d = ev.detail || {};
    if (overlay) close();

    lastFocus = lastTrigger || document.activeElement;
    setTriggerExpanded(true);

    var files = (d.files || []).slice().reverse();
    var o = document.createElement("div");
    o.className = "bp-overlay";
    o.dir = EN ? "ltr" : "rtl";

    var cards = files.map(function (f, i) {
      var internal = f.href && f.href.charAt(0) === "#";
      var tag = f.href ? "a" : "div";
      var attrs = "";
      if (f.href) {
        attrs = ' href="' + esc(f.href).replace(/"/g, "&quot;") + '"';
        if (!internal) attrs += ' target="_blank" rel="noopener noreferrer"';
        if (internal) attrs += ' data-internal="true"';
      }
      var badge = internal
        ? '<span class="bp-badge">' + (EN ? "Private" : "تفاصيل خاصة") + "</span>"
        : "";
      return (
        "<" + tag + ' class="bp-card" aria-label="' + esc(f.name || "") + '"' + attrs +
        ' style="animation-delay:' + (reduce ? 0 : 70 + i * 55) + 'ms">' +
        '<span class="bp-thumb">' +
        (f.image ? '<img src="' + esc(f.image) + '" alt="' + esc(f.name || "") + '" loading="lazy" decoding="async" draggable="false">' : "") +
        badge +
        "</span>" +
        '<span class="bp-info"><span><span class="bp-name">' + esc(f.name) + "</span>" +
        (f.meta ? '<span class="bp-sub" style="display:block">' + esc(f.meta) + "</span>" : "") +
        '</span><span class="bp-go" aria-hidden="true">' + (internal ? (EN ? "↙" : "↖") : EN ? "↗" : "↖") + "</span></span></" + tag + ">"
      );
    }).join("");

    o.innerHTML =
      '<div class="bp-dialog" role="dialog" aria-modal="true" aria-labelledby="bp-title">' +
      '<div class="bp-handle" aria-hidden="true"></div>' +
      '<div class="bp-head"><div>' +
      '<p class="bp-eyebrow">' + (EN ? "Selected work" : "أعمال مختارة") +
      '<span class="bp-count">' + files.length + (EN ? " files" : " ملفات") + "</span></p>" +
      '<h3 class="bp-title" id="bp-title">' + esc(d.title) + "</h3>" +
      (d.meta ? '<p class="bp-meta">' + esc(d.meta) + "</p>" : "") +
      "</div>" +
      '<button type="button" class="bp-close" aria-label="' + (EN ? "Close" : "إغلاق") + '">✕</button></div>' +
      '<div class="bp-body"><div class="bp-grid">' + cards + "</div></div></div>";

    o.addEventListener("mousedown", function (e) {
      if (e.target === o) close();
    });

    o.querySelector(".bp-close").addEventListener("click", close);

    Array.prototype.forEach.call(o.querySelectorAll(".bp-card[data-internal]"), function (card) {
      card.addEventListener("click", function (e) {
        e.preventDefault();
        handleInternalLink(card.getAttribute("href"));
      });
    });

    document.body.appendChild(o);
    overlay = o;
    lock();
    inertBackground(true);
    document.addEventListener("keydown", onKey, true);

    if (window.matchMedia("(max-width: 640px)").matches) {
      var head = o.querySelector(".bp-head");
      var dialog = o.querySelector(".bp-dialog");
      var startY = 0;
      var dy = 0;
      var dragging = false;
      head.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button")) return;
        dragging = true;
        startY = e.clientY;
        dy = 0;
        dialog.style.transition = "none";
        try { head.setPointerCapture(e.pointerId); } catch (err) {}
      });
      head.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        dy = Math.max(0, e.clientY - startY);
        dialog.style.transform = "translateY(" + dy + "px)";
      });
      function endDrag() {
        if (!dragging) return;
        dragging = false;
        dialog.style.transition = "";
        if (dy > 110) {
          dialog.style.transform = "";
          close();
        } else {
          dialog.style.transform = "";
        }
        dy = 0;
      }
      head.addEventListener("pointerup", endDrag);
      head.addEventListener("pointercancel", endDrag);
    }

    requestAnimationFrame(function () {
      o.classList.add("bp-in");
      var closeBtn = o.querySelector(".bp-close");
      if (closeBtn) closeBtn.focus();
    });
  });
})();
