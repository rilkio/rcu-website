/* Premium-Kauf auf der RCU-Seite.
   Ablauf: angemeldet sein (dasselbe Konto wie in der App) -> Häkchen setzen -> weiter zum Shopify-Checkout.
   Die Konto-ID und die E-Mail gehen als Bestellattribute an Shopify. Nach der Zahlung meldet Shopify die
   Bestellung an den Supabase-Server (Webhook), der den Tarif auf "premium" setzt.
   Nur der öffentliche Schlüssel aus js/config.js wird benutzt. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.RCU_CONFIG || {};
  var btn = $('premium-btn'), agree = $('premium-agree'), msgEl = $('premium-msg');
  if (!btn) return;
  var shopUrl = String(cfg.SHOP_PREMIUM_URL || '').trim();
  var price = String(cfg.PREMIUM_PRICE || '').trim();
  var aktion = null; // was ein Klick auf den Button macht

  function zeige(text, art) {
    msgEl.textContent = text || '';
    msgEl.className = 'plan-msg' + (art ? ' ' + art : '');
    msgEl.hidden = !text;
  }

  // In der Vorschau (website-preview.html) wird nicht weitergeleitet, sondern nur angezeigt, wohin es ginge.
  function gehe(url, text) {
    if (cfg.PREVIEW) { zeige('Vorschau: ' + text + ' ' + url, 'ok'); return; }
    location.href = url;
  }

  function zustand(name, label, an) {
    btn.dataset.state = name;
    btn.textContent = label;
    btn.disabled = !an;
  }

  document.querySelectorAll('[data-premium-price]').forEach(function (el) { el.textContent = price || 'Preis folgt'; });
  document.querySelectorAll('[data-premium-price-sub]').forEach(function (el) {
    el.textContent = !shopUrl ? 'Bald verfügbar' : price ? 'gilt für dein RCU-Konto' : 'Den Preis siehst du im Checkout';
  });

  if (!shopUrl) { $('premium-consent').hidden = true; zustand('soon', 'Bald verfügbar', false); return; }

  agree.addEventListener('change', function () {
    if (btn.dataset.state === 'buy') btn.disabled = !agree.checked;
  });
  btn.addEventListener('click', function () { if (aktion) aktion(); });

  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) {
    zustand('error', 'Premium kaufen', false);
    zeige('Der Anmeldedienst konnte nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu.', 'bad');
    return;
  }

  zustand('loading', 'Lade …', false);
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  function abgemeldet() {
    agree.checked = false; agree.disabled = true;
    zustand('login', 'Premium kaufen', true);
    zeige('Zum Kaufen meldest du dich mit deinem RCU-Konto an. Danach kommst du hierher zurück.');
    aktion = function () { gehe('konto?next=premium', 'Weiter zur Anmeldung:'); };
  }

  function pruefen() { return sb.auth.getSession().then(async function (r) {
    var session = r.data && r.data.session;
    if (!session) return abgemeldet();
    document.getElementById('premium-consent').hidden = false;
    var user = session.user;
    var res = await sb.from('profiles').select('plan').eq('id', user.id).maybeSingle();
    if (res.error) {
      zustand('error', 'Premium kaufen', false);
      return zeige('Dein Konto konnte nicht geladen werden. Lade die Seite bitte neu.', 'bad');
    }
    if (res.data && res.data.plan === 'premium') {
      document.getElementById('premium-consent').hidden = true;
      zustand('premium', 'Du hast Premium', false);
      return zeige('Premium ist auf deinem Konto aktiv. Falls die App noch Free zeigt: einmal ab- und wieder anmelden.', 'ok');
    }
    agree.disabled = false;
    zustand('buy', 'Premium kaufen', agree.checked);
    zeige('Angemeldet als ' + (user.email || 'dein Konto') + '. Setz das Häkchen, dann geht es weiter zur Kasse.');
    aktion = function () {
      if (!agree.checked) return zeige('Bitte setz zuerst das Häkchen.', 'bad');
      var url = shopUrl + (shopUrl.indexOf('?') > -1 ? '&' : '?') +
        'checkout[email]=' + encodeURIComponent(user.email || '') +
        '&attributes[rcu_user_id]=' + encodeURIComponent(user.id);
      gehe(url, 'Weiter zum Shopify-Checkout:');
    };
  }, function () {
    zustand('error', 'Premium kaufen', false);
    zeige('Keine Verbindung zum Server. Prüfe deine Internetverbindung.', 'bad');
  }); }

  pruefen();
  // An- oder Abmeldung in einem anderen Tab: Button neu prüfen
  sb.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(pruefen, 0);
  });
})();
