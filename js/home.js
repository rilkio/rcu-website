/* Startseite: Vorher/Nachher-Regler und die Reiter mit den App-Bildern. */
(function () {
  // Vorher/Nachher: der Regler verschiebt die Trennlinie
  var cmp = document.getElementById('compare');
  if (cmp) {
    var range = cmp.querySelector('.compare-range');
    var setzen = function () { cmp.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', setzen);
    setzen();
  }

  // Reiter im Bereich "Das steckt in der RCU" (mit Pfeiltasten bedienbar)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.show-tabs [role="tab"]'));
  function waehle(tab, fokus) {
    tabs.forEach(function (t) {
      var aktiv = t === tab;
      t.setAttribute('aria-selected', aktiv ? 'true' : 'false');
      t.tabIndex = aktiv ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !aktiv;
    });
    if (fokus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { waehle(t); });
    t.addEventListener('keydown', function (e) {
      var n = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (e.key === 'Home') n = -i; else if (e.key === 'End') n = tabs.length - 1 - i;
      if (n === undefined) return;
      e.preventDefault();
      waehle(tabs[(i + n + tabs.length) % tabs.length], true);
    });
  });
})();
