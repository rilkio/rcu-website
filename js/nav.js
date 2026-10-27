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
