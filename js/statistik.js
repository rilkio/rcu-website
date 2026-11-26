/* Statistik-Seite für Admins: liest admin_stats() aus Supabase (prüft serverseitig, ob du Admin bist). */
(function () {
  var cfg = window.RCU_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var num = function (n) { return Number(n || 0).toLocaleString('de-DE'); };
  var de = function (d, o) { return new Date(d).toLocaleDateString('de-DE', o); };
  function msg(t) { var m = $('#st-msg'); m.innerHTML = t; m.hidden = !t; }
  if (!window.supabase) { msg('Konnte nicht laden.'); return; }
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

  function tile(label, value, sub) {
    return '<div class="stats-tile"><span>' + esc(label) + '</span><b>' + value + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
  }
  async function load() {
    msg('');
    var s = await sb.auth.getSession();
    if (!s.data.session) { $('#st-sub').textContent = 'Bitte zuerst anmelden.'; msg('<a class="btn btn-primary" href="konto?next=statistik">Anmelden</a>'); return; }
    var r = await sb.rpc('admin_stats');
    if (r.error) { msg(/Admin/i.test(r.error.message) ? 'Dieses Konto ist kein Admin.' : esc(r.error.message)); return; }
    var d = r.data || {};
    $('#st-sub').textContent = 'Stand ' + new Date().toLocaleString('de-DE');
    $('#st-reload').hidden = false; $('#st-body').hidden = false;
    var eur = Number(d.revenue || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
    $('#st-tiles').innerHTML = [
      tile('Installiert (PCs)', num(Math.max(d.installs, d.devices)), '+' + num(d.installs7) + ' in 7 Tagen · ' + num(d.active7) + ' aktiv'),
      tile('Konten', num(d.accounts), '+' + num(d.accounts7) + ' in 7 Tagen'),
      tile('Premium', num(d.premium), 'Umsatz ' + eur),
      tile('Website heute', num(d.visitsToday), num(d.visits7) + ' in 7 Tagen'),
      tile('Website 30 Tage', num(d.visits30), 'gesamt ' + num(d.visitsAll) + (d.trackingSince ? ' seit ' + de(d.trackingSince) : '')),
      tile('Download-Klicks', num(d.downloads30), 'Besucher in 30 Tagen')
    ].join('');
    var days = d.days || [], max = 1;
    days.forEach(function (x) { max = Math.max(max, x.visits, x.installs); });
    $('#st-chart').innerHTML = days.map(function (x) {
      return '<div class="sc-day" title="' + esc(de(x.day)) + ': ' + x.visits + ' Besucher, ' + x.installs + ' Installationen"><div class="sc-bars"><i class="v" style="height:' + (x.visits / max * 100) + '%"></i><i class="i" style="height:' + (x.installs / max * 100) + '%"></i></div><small>' + esc(de(x.day, { day: '2-digit', month: '2-digit' })) + '</small></div>';
    }).join('') + '<p class="sc-legend"><span><i class="v"></i>Besucher</span><span><i class="i"></i>Installationen</span></p>';
    var p = d.purchases || [];
    $('#st-buys').innerHTML = p.length ? '<table><thead><tr><th>Datum</th><th>E-Mail</th><th>Betrag</th><th>Status</th></tr></thead><tbody>' + p.map(function (x) {
      return '<tr><td>' + esc(de(x.at)) + '</td><td>' + esc(x.email || '–') + '</td><td>' + esc(x.amount) + ' ' + esc(x.currency || '') + '</td><td class="' + (x.status === 'bezahlt' ? 'ok' : 'warn') + '">' + esc(x.status) + '</td></tr>';
    }).join('') + '</tbody></table>' : '<p>Noch keine Käufe.</p>';
  }
  $('#st-reload').addEventListener('click', load);
  load();
})();
