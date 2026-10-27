/* Zeigt im Menü "Konto" statt "Anmelden", wenn in diesem Browser eine Anmeldung gespeichert ist.
   Liest nur den lokalen Speicher, es wird nichts an einen Server geschickt. */
(function () {
  try {
    var angemeldet = Object.keys(localStorage).some(function (k) {
      return /^sb-.*-auth-token$/.test(k) && localStorage.getItem(k);
    });
    if (angemeldet) document.querySelectorAll('[data-konto-link]').forEach(function (a) { a.textContent = 'Konto'; });
  } catch (e) { /* kein Zugriff auf localStorage: Standardtext bleibt */ }
})();

/* Startseite: Menüpunkte springen zum Abschnitt, ohne #… in der Adresszeile,
   und das Menü markiert immer den Abschnitt, in dem man gerade ist. */
(function () {
  var bereiche = [['bewertungen', 'bewertungen'], ['rilkio', 'rilkio'], ['kanaele', 'rilkio'], ['faq', '']];
  if (!document.getElementById('bewertungen')) return;
  var links = {};
  document.querySelectorAll('.nav .nav-btn').forEach(function (a) {
    var h = a.getAttribute('href');
    links[h === './' ? '' : h.replace('./#', '')] = a;
  });

  function sauber() { if (location.hash) history.replaceState(null, '', location.pathname + location.search); }

  function markiere() {
    var aktiv = '';
    bereiche.forEach(function (b) {
      var el = document.getElementById(b[0]);
      if (el && el.getBoundingClientRect().top <= 140) aktiv = b[1];
    });
    Object.keys(links).forEach(function (k) {
      if (k === aktiv) links[k].setAttribute('aria-current', 'page'); else links[k].removeAttribute('aria-current');
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="./#"], a[href="./"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var id = a.getAttribute('href').replace('./', '').replace('#', '');
    var ziel = id ? document.getElementById(id) : document.body;
    if (!ziel) return;
    e.preventDefault();
    if (id) ziel.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'smooth' });
    sauber();
  });

  // Von einer anderen Seite gekommen (z. B. rilkio.de/#bewertungen): hinspringen, dann #… ausblenden
  window.addEventListener('load', function () { setTimeout(sauber, 300); });
  window.addEventListener('scroll', markiere, { passive: true });
  markiere();
})();
