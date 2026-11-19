/* Adds CV links to the contact row after hydration, outside React's tree. */
(function () {
  var BASE = /^\/newporto(?:\/|$)/.test(location.pathname) ? '/newporto' : '';
  var path = location.pathname.slice(BASE.length) || '/';
  var EN = /^\/en(\/|$)/.test(path);
  var base = BASE + (EN ? '/en' : '');
  var cvHref = base + '/cv/';

  function addContactLinks() {
    var socials = document.querySelector('.contact-socials');
    if (!socials || socials.querySelector('.th-cv-link')) return;

    var cv = document.createElement('a');
    cv.className = 'th-cv-link';
    cv.href = cvHref;
    cv.textContent = EN ? 'CV ↗' : 'السيرة الذاتية ↗';

    var pdf = document.createElement('a');
    pdf.className = 'th-cv-link th-cv-pdf';
    pdf.href = BASE + '/resume.pdf';
    pdf.target = '_blank';
    pdf.rel = 'noopener';
    pdf.textContent = EN ? 'PDF ↓' : 'تحميل PDF ↓';

    socials.insertBefore(cv, socials.firstChild);
    cv.insertAdjacentElement('afterend', pdf);
  }

  function boot() {
    addContactLinks();
  }

  function run() {
    var start = function () { setTimeout(boot, 200); };
    if (window.__thWhenHydrated) window.__thWhenHydrated(start);
    else start();
  }

  if (window.__thHydrated) {
    run();
  } else if (document.readyState === "complete") {
    setTimeout(run, 300);
  } else {
    addEventListener("load", function () { setTimeout(run, 300); });
  }
})();
