/* Einführungspreis: bis PROMO_UNTIL gilt PREMIUM_PRICE, danach stellt die Seite selbst auf PRICE_AFTER um.
   Muss vor premium.js geladen werden. Der Shopify-Preis wird am Stichtag separat umgestellt. */
(function () {
  var cfg = window.RCU_CONFIG || {};
  var end = cfg.PROMO_UNTIL ? new Date(cfg.PROMO_UNTIL) : null;
  if (!end || isNaN(end) || !cfg.PRICE_AFTER) return;
  var aktiv = Date.now() <= end.getTime();
  if (!aktiv) { cfg.PREMIUM_PRICE = cfg.PRICE_AFTER; }
  var datum = end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' });
  var tage = Math.ceil((end.getTime() - Date.now()) / 86400000);
  var noch = tage <= 1 ? 'nur noch heute' : 'noch ' + tage + ' Tage';
  function setze(sel, text) {
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = text; el.hidden = !text; });
  }
  function los() {
    setze('[data-promo-text]', aktiv ? cfg.PREMIUM_PRICE + ' (Einführungspreis bis ' + datum + ', danach ' + cfg.PRICE_AFTER + ')' : cfg.PRICE_AFTER);
    if (!aktiv) return setze('[data-promo-badge], [data-promo-after], [data-promo-line]', '');
    setze('[data-promo-badge]', 'Einführungspreis · ' + noch);
    setze('[data-promo-after]', 'Nur bis ' + datum + '. Ab dann kostet Premium ' + cfg.PRICE_AFTER + '.');
    var kurz = end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' });
    setze('[data-promo-line]', 'Premium nur bis ' + kurz + ' für ' + cfg.PREMIUM_PRICE + ' (danach ' + cfg.PRICE_AFTER + ') →');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
