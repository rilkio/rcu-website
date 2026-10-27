/* Konto-Seite: Anmelden, Registrieren, Passwort vergessen, Abmelden.
   Nutzt dasselbe Supabase-Projekt wie die RCU-App. Nur der öffentliche Schlüssel aus js/config.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.RCU_CONFIG || {};
  var msgEl = $('msg');
  var startHash = location.hash;
  // Links aus E-Mails sollen auf genau diese Seite zurückführen (ohne #… und ?…)
  var selfUrl = location.href.split('#')[0].split('?')[0];
  // konto.html?next=premium: nach der Anmeldung zurück zum Premium-Kauf (nur dieses feste Ziel, keine fremden Adressen)
  // konto.html?next=bewertung: nach der Anmeldung zurück zu den Bewertungen
  var ziele = { premium: 'rcu.html#premium', bewertung: 'index.html#bewertungen' };
  var next = new URLSearchParams(location.search).get('next');
  var weiterZu = Object.prototype.hasOwnProperty.call(ziele, next) ? ziele[next] : '';

  function zeige(text, art) {
    msgEl.textContent = text;
    msgEl.className = 'msg' + (art ? ' msg-' + art : '');
    msgEl.hidden = !text;
  }

  function uebersetze(err) {
    var m = String((err && (err.message || err.error_description || err.msg)) || err || '');
    var l = m.toLowerCase();
    if (l.indexOf('invalid login credentials') > -1) return 'E-Mail oder Passwort stimmt nicht.';
    if (l.indexOf('email not confirmed') > -1) return 'Bitte bestätige zuerst deine E-Mail. Schau in dein Postfach (auch im Spam-Ordner).';
    if (l.indexOf('user already registered') > -1 || l.indexOf('already been registered') > -1) return 'Mit dieser E-Mail gibt es schon ein Konto. Melde dich an oder setze dein Passwort zurück.';
    if (l.indexOf('profiles_username_key') > -1 || (l.indexOf('duplicate') > -1 && l.indexOf('username') > -1)) return 'Dieser Benutzername ist schon vergeben.';
    if (l.indexOf('database error saving new user') > -1) return 'Konto konnte nicht erstellt werden. Vielleicht ist der Benutzername schon vergeben.';
    if (l.indexOf('password should be at least') > -1) return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
    if (l.indexOf('same password') > -1 || l.indexOf('different from the old') > -1) return 'Das neue Passwort muss sich vom alten unterscheiden.';
    if (l.indexOf('rate limit') > -1 || l.indexOf('too many') > -1 || l.indexOf('for security purposes') > -1) return 'Zu viele Versuche. Bitte warte kurz und versuche es dann noch einmal.';
    if (l.indexOf('unable to validate email') > -1 || l.indexOf('invalid email') > -1 || (l.indexOf('email address') > -1 && l.indexOf('invalid') > -1)) return 'Diese E-Mail-Adresse ist ungültig.';
    if (l.indexOf('expired') > -1 || l.indexOf('otp_expired') > -1) return 'Der Link ist abgelaufen oder wurde schon benutzt. Fordere bitte einen neuen an.';
    if (l.indexOf('failed to fetch') > -1 || l.indexOf('network') > -1) return 'Keine Verbindung zum Server. Prüfe deine Internetverbindung.';
    if (l.indexOf('signups not allowed') > -1) return 'Registrierungen sind gerade deaktiviert.';
    return 'Etwas ist schiefgelaufen' + (m ? ': ' + m : '.');
  }

  function ansicht(name) {
    $('loading').hidden = true;
    ['auth', 'neues-passwort', 'profil'].forEach(function (id) { $(id).hidden = id !== name; });
    $('konto-titel').textContent = name === 'profil' ? 'Dein Konto' : name === 'neues-passwort' ? 'Neues Passwort' : 'Anmelden';
    document.querySelectorAll('[data-konto-link]').forEach(function (a) { a.textContent = name === 'profil' ? 'Konto' : 'Anmelden'; });
  }

  function tab(name) {
    if (['anmelden', 'registrieren', 'passwort'].indexOf(name) < 0) name = 'anmelden';
    document.querySelectorAll('[data-tab]').forEach(function (t) {
      var aktiv = t.dataset.tab === name;
      t.setAttribute('aria-selected', aktiv ? 'true' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    var titel = { anmelden: 'Anmelden', registrieren: 'Registrieren', passwort: 'Passwort vergessen' }[name];
    if (!$('auth').hidden) $('konto-titel').textContent = titel;
  }

  function hashTab() { return location.hash.replace('#', ''); }
  window.addEventListener('hashchange', function () { zeige(''); tab(hashTab()); });
  // Den passenden Reiter sofort setzen, damit z. B. konto.html#registrieren direkt die Registrierung zeigt
  tab(hashTab());

  function laden(form, an) {
    form.querySelectorAll('button, input').forEach(function (el) { el.disabled = an; });
  }

  // Fehler aus einem E-Mail-Link (z. B. abgelaufen) stehen im Hash
  var hashParams = new URLSearchParams(startHash.replace(/^#/, ''));
  var linkFehler = hashParams.get('error_description') || hashParams.get('error_code');
  var istRecovery = hashParams.get('type') === 'recovery';
  var istBestaetigung = hashParams.get('type') === 'signup';

  if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) {
    ansicht('auth'); tab(hashTab());
    zeige('Der Anmeldedienst konnte nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu.', 'fehler');
    document.querySelectorAll('#auth button').forEach(function (b) { b.disabled = true; });
    return;
  }

  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function profilZeigen(user) {
    if (weiterZu && !istRecovery) { location.replace(weiterZu); return; }
    ansicht('profil');
    $('p-email').textContent = user.email || '–';
    var meta = user.user_metadata || {};
    $('p-username').textContent = meta.username || '–';
    var res = await sb.from('profiles').select('username, affiliate_code, plan').eq('id', user.id).maybeSingle();
    var p = res.data || {};
    if (res.error) console.warn('Profil konnte nicht geladen werden:', res.error.message);
    if (p.username) $('p-username').textContent = p.username;
    var premium = p.plan === 'premium';
    $('p-plan').textContent = premium ? 'Premium' : 'Free';
    $('p-plan').classList.toggle('badge-premium', premium);
    $('p-upgrade').hidden = premium;
    $('p-active').hidden = !premium;
    $('p-aff-row').hidden = !p.affiliate_code;
    $('p-aff').textContent = p.affiliate_code || '';
  }

  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'PASSWORD_RECOVERY') { istRecovery = true; ansicht('neues-passwort'); return; }
    if (event === 'SIGNED_OUT') { ansicht('auth'); tab('anmelden'); }
    if (event === 'SIGNED_IN' && session && !istRecovery) setTimeout(function () { profilZeigen(session.user); }, 0);
  });

  sb.auth.getSession().then(function (r) {
    var session = r.data && r.data.session;
    if (linkFehler) zeige(uebersetze(linkFehler), 'fehler');
    if (istRecovery && session) { ansicht('neues-passwort'); return; }
    if (session) {
      if (istBestaetigung) zeige('Deine E-Mail ist bestätigt. Willkommen!', 'ok');
      profilZeigen(session.user);
    } else {
      ansicht('auth');
      tab(hashTab());
      if (weiterZu && !linkFehler) zeige(weiterZu.indexOf('bewertung') > -1 ? 'Melde dich mit deinem RCU-Konto an, um eine Bewertung zu schreiben. Danach geht es direkt weiter.' : 'Melde dich mit deinem RCU-Konto an, um Premium zu kaufen. Danach geht es direkt weiter.');
    }
  });

  // Anmelden
  $('form-anmelden').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, email = f.email.value.trim(), pw = f.password.value;
    if (!email || !pw) return zeige('Bitte E-Mail und Passwort eingeben.', 'fehler');
    zeige(''); laden(f, true);
    var r = await sb.auth.signInWithPassword({ email: email, password: pw });
    laden(f, false);
    if (r.error) return zeige(uebersetze(r.error), 'fehler');
    f.reset();
    history.replaceState(null, '', selfUrl);
    profilZeigen(r.data.user);
  });

  // Registrieren
  $('form-registrieren').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, name = f.username.value.trim(), email = f.email.value.trim();
    if (name.length < 3 || name.length > 24) return zeige('Der Benutzername muss 3 bis 24 Zeichen lang sein.', 'fehler');
    if (!email || !f.email.checkValidity()) return zeige('Bitte gib eine gültige E-Mail-Adresse ein.', 'fehler');
    if (f.password.value.length < 6) return zeige('Das Passwort muss mindestens 6 Zeichen lang sein.', 'fehler');
    if (f.password.value !== f.password2.value) return zeige('Die Passwörter stimmen nicht überein.', 'fehler');
    zeige(''); laden(f, true);
    var r = await sb.auth.signUp({
      email: email,
      password: f.password.value,
      options: { data: { username: name }, emailRedirectTo: selfUrl }
    });
    laden(f, false);
    if (r.error) return zeige(uebersetze(r.error), 'fehler');
    // Supabase meldet bei schon registrierter E-Mail (mit Bestätigungspflicht) einen Nutzer ohne Identitäten
    if (r.data.user && Array.isArray(r.data.user.identities) && r.data.user.identities.length === 0) {
      return zeige(uebersetze('User already registered'), 'fehler');
    }
    f.reset();
    if (r.data.session) { profilZeigen(r.data.user); zeige('Dein Konto ist erstellt.', 'ok'); }
    else zeige('Fast geschafft! Wir haben dir eine E-Mail geschickt. Klicke auf den Link darin, um dein Konto zu bestätigen.', 'ok');
  });

  // Passwort vergessen
  $('form-passwort').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, email = f.email.value.trim();
    if (!email || !f.email.checkValidity()) return zeige('Bitte gib eine gültige E-Mail-Adresse ein.', 'fehler');
    zeige(''); laden(f, true);
    var r = await sb.auth.resetPasswordForEmail(email, { redirectTo: selfUrl });
    laden(f, false);
    if (r.error) return zeige(uebersetze(r.error), 'fehler');
    zeige('Wenn es ein Konto mit dieser E-Mail gibt, ist der Link jetzt unterwegs. Schau auch im Spam-Ordner nach.', 'ok');
  });

  // Neues Passwort nach Klick auf den Link
  $('form-neu').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.password.value.length < 6) return zeige('Das Passwort muss mindestens 6 Zeichen lang sein.', 'fehler');
    if (f.password.value !== f.password2.value) return zeige('Die Passwörter stimmen nicht überein.', 'fehler');
    zeige(''); laden(f, true);
    var r = await sb.auth.updateUser({ password: f.password.value });
    laden(f, false);
    if (r.error) return zeige(uebersetze(r.error), 'fehler');
    f.reset(); istRecovery = false;
    history.replaceState(null, '', selfUrl);
    zeige('Dein neues Passwort ist gespeichert.', 'ok');
    profilZeigen(r.data.user);
  });

  // Abmelden
  $('logout').addEventListener('click', async function () {
    var r = await sb.auth.signOut();
    if (r.error) return zeige(uebersetze(r.error), 'fehler');
    zeige('Du bist abgemeldet.', 'ok');
    ansicht('auth'); tab('anmelden');
  });
})();
