/* Installation PWA : beforeinstallprompt, guide iPhone, Mac et PC. */
(function () {
  "use strict";
  var deferred = null;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    paint();
  });
  window.addEventListener("appinstalled", function () {
    deferred = null;
    standalone = true;
    paint();
  });

  function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function isMac() { return /mac/i.test(navigator.platform || "") && !isIos(); }
  function isAndroid() { return /android/i.test(navigator.userAgent); }

  function guideHTML() {
    if (standalone) return '<div class="install-card"><b>L\'appli est installée.</b><p class="small">Tu l\'ouvres comme les autres, depuis l\'écran d\'accueil ou le menu des applications.</p></div>';
    return '<div class="install-card" id="installHelp"><span class="eyebrow">Installer Laboulette</span>' +
      '<p>Une démo à poser sur ton téléphone ou ton ordinateur. Rien à télécharger sur un store.</p>' +
      '<ol>' +
      '<li><b>Android, Chrome et Edge.</b> Touche « Installer l\'appli ». Si rien ne se passe, ouvre le menu du navigateur et choisis « Installer l\'application ».</li>' +
      '<li><b>iPhone et iPad.</b> Touche Partager (le carré avec la flèche), puis « Sur l\'écran d\'accueil ».</li>' +
      '<li><b>Mac.</b> Dans Safari : menu Fichier, puis « Ajouter au Dock ». Dans Chrome : l\'icône d\'installation dans la barre d\'adresse.</li>' +
      '<li><b>PC.</b> Dans Chrome ou Edge : menu du navigateur, puis « Installer Laboulette », ou l\'icône à droite de la barre d\'adresse.</li>' +
      '</ol>' +
      (isIos() ? '<p class="tip">Sur cet iPhone : Partager, puis Sur l\'écran d\'accueil.</p>' : '') +
      (isMac() ? '<p class="tip">Sur ce Mac : Safari, Fichier, Ajouter au Dock. Ou l\'icône dans Chrome.</p>' : '') +
      (!isIos() && !isAndroid() && !isMac() ? '<p class="tip">Sur ce PC : Chrome ou Edge, menu, Installer Laboulette.</p>' : '') +
      '</div>';
  }

  function paint() {
    document.querySelectorAll("[data-install]").forEach(function (btn) {
      if (standalone) { btn.hidden = true; return; }
      btn.hidden = false;
      btn.textContent = deferred ? "Installer l'appli" : "Installer l'appli";
    });
    var slot = document.getElementById("installGuide");
    if (slot && slot.dataset.filled !== "manual") slot.innerHTML = guideHTML();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-install]");
    if (!btn) return;
    e.preventDefault();
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; paint(); });
      return;
    }
    var help = document.getElementById("installHelp") || document.getElementById("installGuide");
    if (help) help.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  });

  window.LBInstall = {mount: function (el) { if (el) el.innerHTML = guideHTML(); }, guideHTML: guideHTML};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
