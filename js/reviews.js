/* Bewertungen auf der Startseite.
   Lesen: alle freigegebenen Bewertungen (Tabelle public.reviews, siehe supabase/005-bewertungen.sql).
   Schreiben: nur angemeldet, eine Bewertung pro Konto. Neue oder geänderte Bewertungen sind erst sichtbar,
   wenn Rilkio sie im Supabase-Dashboard freigibt (approved = true). Nur der öffentliche Schlüssel aus js/config.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.RCU_CONFIG || {};
  var list = $('rev-list');
  if (!list) return;
  var msgEl = $('rev-msg'), form = $('rev-form');
  var eigene = null, nutzer = null;

  function zeige(text, art) {
    msgEl.textContent = text || '';
    msgEl.className = 'msg' + (art ? ' msg-' + art : '');
    msgEl.hidden = !text;
  }

  function sterne(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

  function datum(iso) {
    try { return new Date(iso).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }); } catch (e) { return ''; }
  }

  function karte(r) {
    var li = document.createElement('li');
    li.className = 'review';
    var top = document.createElement('div'); top.className = 'review-top';
    var st = document.createElement('span'); st.className = 'stars'; st.textContent = sterne(r.rating);
    st.setAttribute('aria-label', r.rating + ' von 5 Sternen');
    var d = document.createElement('span'); d.className = 'review-date'; d.textContent = datum(r.created_at);
    top.append(st, d);
    var p = document.createElement('p'); p.textContent = r.text;
    var who = document.createElement('div'); who.className = 'review-who';
    var av = document.createElement('span'); av.className = 'avatar'; av.setAttribute('aria-hidden', 'true');
    av.textContent = (r.name || '?').trim().charAt(0).toUpperCase();
    var nm = document.createElement('b'); nm.textContent = r.name;
    who.append(av, nm);
    li.append(top, p, who);
    return li;
  }

  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) {
    $('rev-login').textContent = 'Bewertungen konnten nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu.';
    return;
  }
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  async function laden() {
    var res = await sb.from('reviews').select('id, name, rating, text, created_at')
      .eq('approved', true).order('created_at', { ascending: false }).limit(60);
    if (res.error) { console.warn('Bewertungen:', res.error.message); return; }
    var rows = res.data || [];
    list.replaceChildren.apply(list, rows.map(karte));
    $('rev-empty').hidden = rows.length > 0;
    $('rev-summary').hidden = rows.length === 0;
    if (rows.length) {
      var avg = rows.reduce(function (s, r) { return s + r.rating; }, 0) / rows.length;
      $('rev-avg').textContent = avg.toFixed(1).replace('.', ',');
      $('rev-avg-stars').textContent = sterne(Math.round(avg));
      $('rev-count').textContent = rows.length === 1 ? '1 Bewertung' : rows.length + ' Bewertungen';
    }
  }

  function statusText() {
    if (!eigene) return '';
    return eigene.approved
      ? 'Deine Bewertung ist online. Du kannst sie hier ändern.'
      : 'Deine Bewertung ist gespeichert und wartet auf Freigabe.';
  }

  async function konto() {
    var r = await sb.auth.getSession();
    var session = r.data && r.data.session;
    nutzer = session ? session.user : null;
    $('rev-login').hidden = !!nutzer;
    form.hidden = !nutzer;
    if (!nutzer) return;
    var own = await sb.from('reviews').select('id, name, rating, text, approved').eq('user_id', nutzer.id).maybeSingle();
    eigene = own.data || null;
    if (eigene) {
      form.name.value = eigene.name;
      form.text.value = eigene.text;
      var radio = form.querySelector('input[name="rating"][value="' + eigene.rating + '"]');
      if (radio) radio.checked = true;
      zeige(statusText(), eigene.approved ? 'ok' : '');
    } else {
      var prof = await sb.from('profiles').select('username').eq('id', nutzer.id).maybeSingle();
      form.name.value = (prof.data && prof.data.username) || (nutzer.user_metadata && nutzer.user_metadata.username) || '';
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!nutzer) return;
    var name = form.name.value.trim(), text = form.text.value.trim();
    var rating = Number((form.querySelector('input[name="rating"]:checked') || {}).value || 5);
    if (name.length < 2 || name.length > 24) return zeige('Der Name muss 2 bis 24 Zeichen lang sein.', 'fehler');
    if (text.length < 10 || text.length > 600) return zeige('Die Bewertung muss 10 bis 600 Zeichen lang sein.', 'fehler');
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; zeige('');
    var daten = { name: name, rating: rating, text: text };
    var res = eigene
      ? await sb.from('reviews').update(daten).eq('id', eigene.id).select('id, name, rating, text, approved').single()
      : await sb.from('reviews').insert(daten).select('id, name, rating, text, approved').single();
    btn.disabled = false;
    if (res.error) {
      console.warn('Bewertung speichern:', res.error.message);
      return zeige('Deine Bewertung konnte nicht gespeichert werden. Versuch es bitte später noch einmal.', 'fehler');
    }
    eigene = res.data;
    zeige('Danke! Deine Bewertung ist gespeichert und erscheint, sobald ich sie freigegeben habe.', 'ok');
    laden();
  });

  laden();
  konto();
})();
