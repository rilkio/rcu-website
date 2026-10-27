/* Download-Button der RCU. Die Adresse kommt nur aus js/config.js (DOWNLOAD_URL). */
(function () {
  var url = (window.RCU_CONFIG && window.RCU_CONFIG.DOWNLOAD_URL || '').trim();
  document.querySelectorAll('[data-download]').forEach(function (btn) {
    var label = btn.querySelector('[data-download-label]') || btn;
    if (url) {
      btn.href = url;
      btn.removeAttribute('aria-disabled');
      btn.setAttribute('download', '');
      label.textContent = 'Für Windows herunterladen';
    } else {
      btn.removeAttribute('href');
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('role', 'link');
      btn.classList.add('is-disabled');
      label.textContent = 'Download bald verfügbar';
    }
  });
})();
