/* Laboulette — parcours de composition.
   Mobile d'abord, récap persistant, étapes numérotées. Prototype : pas de commande. */
(function () {
  "use strict";
  var STEPS = [
    {id: "audience", title: "Pour qui ?", tease: "Particulier ou pro : on adapte les formats, pas la qualité."},
    {id: "base", title: "Ta base", tease: "Viande ou végétale. Les deux sont bonnes, fais pas le malin."},
    {id: "meat", title: "Ton haché, au gramme près", tease: ""},
    {id: "garnish", title: "Ce que tu mets dedans", tease: "Coche ce que tu veux, décoche ce que tu boudes."},
    {id: "herbs", title: "Tes herbes", tease: "Jusqu'à 3. Au-delà, c'est plus une boulette, c'est une pelouse."},
    {id: "spices", title: "Tes épices", tease: "Jusqu'à 3. On veut du caractère, pas un feu de cheminée."},
    {id: "sauce", title: "La sauce", tease: "Mijotée maison. Ou sans, si t'es du genre à manger tes frites sans mayo."},
    {id: "qty", title: "Combien ?", tease: ""},
    {id: "pickup", title: "Comment tu la récupères ?", tease: "Chez toi, à emporter ou au rayon. Mais tu la récupères, hein, on la garde pas pour nous."},
    {id: "check", title: "On vérifie", tease: "Relis ton récap. Si c'est bon, on la fête. Sinon, fais pas le malin et corrige."}
  ];
  var BOX_STEPS = [
    {id: "people", title: "Pour combien de personnes ?", tease: "2, 4 ou 6. On compte 2 boulettes de 120 g par personne et par recette (indicatif)."},
    {id: "recipes", title: "Combien de recettes par box ?", tease: "2 à 4 signatures. Tu t'ennuies ? C'est que t'as pas tout goûté."},
    {id: "rhythm", title: "Quel rythme ?", tease: "Chaque semaine, toutes les deux semaines, chaque mois, ou une seule fois pour goûter."},
    {id: "picks", title: "Quelles signatures ?", tease: "Autant de recettes que tu as choisi. Pas une de plus, gourmand."},
    {id: "check", title: "Ta box", tease: "Concept de démo : aucun abonnement, aucun paiement, aucun prix."}
  ];
  var KEY = "laboulette.boulettes";
  var BOXKEY = "laboulette.boxes";

  var state = LB.fresh();
  var box = LB.freshBox();
  var view = "home";
  var step = 0;
  var boxStep = 0;
  var dir = 1;
  var savedId = null;
  var savedBoxId = null;
  var celebrateOnLoad = false;
  var shownG = 0, shownC = 0, rafG = 0, rafC = 0;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) document.documentElement.classList.add("reduce");

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function loadItems(key) {
    try { var v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function storeItems(key, items) { localStorage.setItem(key, JSON.stringify(items)); }
  var toastTimer, lastToast = "", lastToastAt = 0;
  function showToast(msg) {
    if (!msg) return;
    var now = Date.now();
    if (msg === lastToast && now - lastToastAt < 1400) return;
    lastToast = msg; lastToastAt = now;
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2800);
  }
  var armed = false;
  function arm() { armed = true; }
  document.addEventListener("pointerdown", arm, {passive: true});
  document.addEventListener("keydown", arm);
  function buzz(kind) {
    if (!armed || !navigator.vibrate) return;
    try {
      if (kind === "no") navigator.vibrate([18, 30, 18]);
      else if (kind === "win" && !reduce) navigator.vibrate([12, 36, 12, 36, 24]);
      else navigator.vibrate(10);
    } catch (e) {}
  }
  function teaseFor(id) {
    if (id === "meat") return state.base === "Végétale"
      ? "Une recette végétale maison. Tu doses la quantité, nous la recette. Même ton tonton l'a mangée."
      : "Par pas de 50 g, 3 viandes max. On calcule les pourcentages, toi tu salives.";
    if (id === "qty") return LB.pro(state)
      ? "Lots de 20, 50 ou 100 boulettes. La sauce voyage à part, en sachets séparés."
      : "Le sachet de 2, c'est notre signature. 4 ou 6 si t'as du monde (ou un gros appétit).";
    var found = STEPS.filter(function (s) { return s.id === id; })[0];
    return found ? found.tease : "";
  }
  function notesHTML(list) {
    return (list || []).map(function (n) {
      var btn = n.action === "fit" ? ' <button type="button" class="btn small" data-action="fit">Ajuster à ma quantité</button>' : "";
      return '<div class="' + n.type + '">' + esc(n.text) + btn + "</div>";
    }).join("");
  }
  function choiceBtn(group, o, selected, off) {
    return '<button type="button" class="choice' + (selected ? " selected" : "") + (off ? " off" : "") + '" data-choice data-group="' + esc(group) + '" data-value="' + esc(o.v) + '" aria-pressed="' + (selected ? "true" : "false") + '"' + (off ? ' aria-disabled="true"' : "") + ">" +
      esc(o.v) + (selected ? '<span class="tick" aria-hidden="true">✓</span>' : "") +
      (o.s ? "<small>" + esc(o.s) + "</small>" : "") + "</button>";
  }
  function choices(group, list, current, multi) {
    return '<div class="choices' + (list.length > 4 ? " chips" : "") + '">' + list.map(function (o) {
      var sel = multi ? current.indexOf(o.v) > -1 : current === o.v;
      return choiceBtn(group, o, sel, LB.isOff(state, group, o.v));
    }).join("") + "</div>";
  }
  function previewSVG() {
    var mi = LB.meatInfo(state);
    var sc = LB.SAUCE_COL[state.sauce];
    var veg = state.base === "Végétale";
    var s = '<svg viewBox="0 0 400 250" role="img"><title>Aperçu de ta boulette</title>';
    s += '<ellipse cx="200" cy="214" rx="150" ry="22" fill="#2a211e"/>';
    if (sc) s += '<path class="sauce" d="M92 196 Q110 168 162 174 Q210 160 258 174 Q312 168 308 198 Q298 226 200 224 Q104 226 92 196Z" fill="' + sc + '"/>';
    s += '<g class="ball"><circle cx="208" cy="132" r="72" fill="#ff8a1f"/><circle cx="200" cy="124" r="72" fill="' + (veg ? "#22301a" : "#161211") + '"/>';
    s += '<path d="M146 108 Q158 76 196 68 Q166 88 160 114 Q152 118 146 108Z" fill="' + (veg ? "#3c5230" : "#4a3c37") + '"/>';
    var rnd = function (i) { return (Math.sin(i * 12.9898 + 7) * 43758.5453) % 1; };
    state.herbs.forEach(function (h, j) {
      for (var i = 0; i < 5; i++) {
        var a = Math.abs(rnd(j * 10 + i)), b = Math.abs(rnd(j * 10 + i + 50));
        s += '<ellipse cx="' + (156 + a * 96).toFixed(0) + '" cy="' + (92 + b * 78).toFixed(0) + '" rx="5" ry="2.4" fill="#6fbf4a" transform="rotate(' + (a * 180).toFixed(0) + " " + (156 + a * 96).toFixed(0) + " " + (92 + b * 78).toFixed(0) + ')"/>';
      }
    });
    state.spices.forEach(function (h, j) {
      for (var i = 0; i < 5; i++) {
        var a = Math.abs(rnd(j * 7 + i + 99)), b = Math.abs(rnd(j * 7 + i + 199));
        s += '<circle cx="' + (154 + a * 98).toFixed(0) + '" cy="' + (88 + b * 82).toFixed(0) + '" r="2.3" fill="#ffc83d"/>';
      }
    });
    s += '<g transform="rotate(-14 200 124)"><circle cx="178" cy="116" r="11" fill="#fff3e0"/><path d="M210 102 L234 112 L210 123 L215 112Z" fill="#fff3e0"/><path d="M166 138 Q169 134 174 135 Q204 144 236 130 Q242 129 242 134 Q236 172 200 172 Q168 170 166 138Z" fill="#fff3e0"/><path d="M186 164 Q200 152 214 161 Q210 172 200 172 Q191 171 186 164Z" fill="#e8392a"/></g></g>';
    s += '<path d="M332 28 Q336 46 354 50 Q336 54 332 72 Q328 54 310 50 Q328 46 332 28Z" fill="#ffc83d"/>';
    s += '<text x="18" y="36" font-family="Bungee, system-ui, sans-serif" font-size="22" fill="#ffc83d">×' + LB.count(state) + "</text>";
    if (state.local) s += '<g><rect x="18" y="46" rx="8" width="128" height="22" fill="#ffc83d"/><text x="82" y="61" font-family="Bungee, system-ui, sans-serif" font-size="10" fill="#161211" text-anchor="middle">PRODUCTEUR LOCAL</text></g>';
    if (!mi.ok) s += '<text x="200" y="244" font-family="Bungee, system-ui, sans-serif" font-size="12" fill="#ff8a1f" text-anchor="middle">HACHÉ À CORRIGER</text>';
    return s + "</svg>";
  }
  function statHTML() {
    var mi = LB.meatInfo(state);
    return '<div class="statline"><div class="stat"><b id="statCount">' + LB.count(state) + '</b><span>boulettes</span></div><div class="stat"><b id="statGrams">' + LB.fmt(mi.total) + '</b><span>de haché</span></div><div class="stat"><b>' + esc(state.sauce) + '</b><span>sauce</span></div></div>';
  }
  function kvHTML() {
    return LB.rows(state).map(function (r) {
      return "<li><b>" + esc(r[0]) + "</b><span>" + esc(r[1]) + "</span></li>";
    }).join("");
  }
  function recapPanel(compact) {
    var mi = LB.meatInfo(state);
    var title = mi.ok ? (state.sig || state.name || "Ta boulette sur mesure") : "Euh… on y est presque.";
    return '<aside class="recap' + (compact ? " collapsed" : "") + '" id="recap" aria-label="Ta composition">' +
      '<button type="button" class="recap-toggle" id="dockToggle" aria-expanded="false">Récap · ' + esc(state.sig || state.name || "Sur mesure") + "</button>" +
      '<div class="viz" id="viz">' + previewSVG() + "</div>" +
      "<h3 id=\"recapTitle\">" + esc(title) + "</h3>" +
      '<div class="sub" id="recapSub">' + LB.count(state) + " boulettes • " + esc(state.sauce) + " • " + esc(state.pickup) + "</div>" +
      statHTML() +
      '<ul class="kv" id="kv">' + kvHTML() + "</ul>" +
      '<div class="extra" id="recapWarn">' + (mi.ok ? "" : '<div class="alert">' + esc(mi.msg) + "</div>") + "</div>" +
      '<p class="small extra">Prototype : aucune commande ni paiement. Prix et disponibilités non définis. Compositions et allergènes indicatifs, à valider en production.</p></aside>';
  }
  function progress(list, index) {
    var pct = Math.round((index / (list.length - 1)) * 100);
    return '<div class="progress-wrap"><div class="progress-meta"><span>Étape ' + (index + 1) + " / " + list.length + '</span><span>' + pct + ' %</span></div><div class="track" aria-hidden="true"><span style="width:' + pct + '%"></span></div><div class="dots" role="tablist">' +
      list.map(function (s, i) {
        var cls = i === index ? "on" : i < index ? "done" : "";
        return '<button type="button" class="' + cls + '" data-dot="' + i + '" role="tab" aria-selected="' + (i === index) + '" aria-label="Étape ' + (i + 1) + " " + esc(s.title) + '">' + (i + 1) + "</button>";
      }).join("") + "</div></div>";
  }
  function stepHead(list, index) {
    var s = list[index];
    var tease = list === STEPS ? teaseFor(s.id) : s.tease;
    return '<div class="stage' + (dir < 0 ? " back" : "") + '"><div class="step-kicker" aria-hidden="true">' + (index + 1) + '</div><h2 id="stepTitle" tabindex="-1">' + esc(s.title) + '</h2><p class="tease">' + esc(tease) + "</p>";
  }
  function navRow(backLabel, nextLabel, nextDisabled) {
    return '<div class="nav-row"><button type="button" class="btn ghost" data-back>' + esc(backLabel) + '</button><button type="button" class="btn" data-next' + (nextDisabled ? " disabled" : "") + ">" + esc(nextLabel) + "</button></div>";
  }
  function meatBlock() {
    var mi = LB.meatInfo(state);
    var L = LB.lim(state);
    var P = LB.pro(state);
    var meats = LB.meatList(state).map(function (m) {
      var v = (state.grams && state.grams[m.k]) || 0;
      var part = mi.c.filter(function (x) { return x.k === m.k; })[0];
      var lab = m.k === "Mélange végétal maison" ? "Végétal" : m.k;
      return '<div class="meat"><label>' + esc(lab) + '</label><input type="range" data-gram="' + esc(m.k) + '" min="0" max="' + Math.max(L.max / (P ? 2 : 1), v) + '" step="' + LB.STEP + '" value="' + v + '" aria-label="' + esc(lab) + ' en grammes"><input type="number" data-gram="' + esc(m.k) + '" data-live="1" min="0" max="' + L.max + '" step="' + LB.STEP + '" value="' + v + '" inputmode="numeric" aria-label="' + esc(lab) + ' en grammes, chiffre"><span class="pct" data-pct="' + esc(m.k) + '">' + (part ? part.p.toLocaleString("fr-BE") + " %" : "—") + "</span></div>";
    }).join("");
    var bar = '<div class="bar" id="bar" aria-hidden="true">' + mi.c.map(function (x) {
      return '<i title="' + esc(x.k) + '" style="width:' + x.p + "%;background:" + x.c + '"></i>';
    }).join("") + "</div>";
    var presets = state.base === "Végétale" ? "" : choices("preset", LB.OPTIONS.preset, state.preset, false);
    var local = state.base === "Végétale" ? "" : '<label class="local"><input type="checkbox" data-flag="local"' + (state.local ? " checked" : "") + '><span><b>Producteur local</b><span class="badge">supplément</span><br><span class="small">Des viandes issues de fermes du coin, pour une boulette qui connaît son terroir. Producteurs en cours de sélection. <b>Tarif à définir.</b></span></span></label>';
    return presets + meats + bar +
      '<p id="meatTotal" class="' + (mi.ok ? "ok" : "ko") + '" aria-live="polite"><b>Total : ' + LB.fmt(mi.total) + "</b> — " + esc(mi.msg) + "</p>" +
      '<div id="meatNotes">' + notesHTML(LB.notes(state).meat) + "</div>" +
      '<p class="small">' + esc(LB.limitsLine(state)) + "</p>" + local +
      '<div class="note">Gamme halal : envisagée, mais non disponible ni certifiée dans cette démonstration. Compositions indicatives, à valider en production.</div>' +
      '<div class="single-cal"><div><b>Un seul calibre : la vraie, la traditionnelle.</b><br><span class="small" style="color:#e9d6bd">120 g cru, taille ration normale, comme chez mémé. Petite, grosse, XXL ? Fais pas le malin : elle a la bonne taille depuis toujours.</span></div></div>';
  }
  function wizardBody() {
    var id = STEPS[step].id;
    var n = LB.notes(state);
    var html = "";
    if (id === "audience") html = choices("audience", LB.OPTIONS.audience, state.audience, false);
    else if (id === "base") html = choices("base", LB.OPTIONS.base, state.base, false);
    else if (id === "meat") html = meatBlock();
    else if (id === "garnish") {
      html = '<div class="toggles"><label><input type="checkbox" data-flag="noEgg"' + (state.noEgg ? " checked" : "") + "> Sans œuf</label><label><input type=\"checkbox\" data-flag=\"noGluten\"" + (state.noGluten ? " checked" : "") + "> Sans gluten</label></div>" +
        choices("garnish", LB.OPTIONS.garnish, state.garnish, true) + '<div id="stepNotes">' + notesHTML(n.garnish) + "</div>";
    } else if (id === "herbs") {
      html = '<div class="sub-h"><span>Herbes</span><span class="counter">' + state.herbs.length + " / " + LB.MAX_HERBS + "</span></div>" +
        choices("herbs", LB.OPTIONS.herbs, state.herbs, true) +
        '<p class="small">Le persil classique est à l\'étape d\'avant. Ici, c\'est le persil plat, pour les puristes.</p>' +
        notesHTML(n.herbs);
    } else if (id === "spices") {
      html = '<div class="sub-h"><span>Épices</span><span class="counter">' + state.spices.length + " / " + LB.MAX_SPICES + "</span></div>" +
        choices("spices", LB.OPTIONS.spices, state.spices, true) +
        '<div class="sub-h"><span>Dosage</span></div>' + choices("dose", LB.OPTIONS.dose, state.dose, false) + notesHTML(n.spices);
    } else if (id === "sauce") html = choices("sauce", LB.OPTIONS.sauce, state.sauce, false) + notesHTML(n.sauce);
    else if (id === "qty") {
      var P = LB.pro(state);
      html = choices("qty", LB.qtyOptions(state), state.qty, false) +
        '<div class="qty-row"><label>Nombre de ' + (P ? "lots" : "sachets") + ' (max ' + LB.maxPacks(state) + ')<input id="packs" data-live="1" type="number" min="1" max="' + LB.maxPacks(state) + '" value="' + state.packs + '" inputmode="numeric"></label>' +
        ((P && state.sauce !== "Sans sauce") ? '<label class="check"><input type="checkbox" data-flag="proSauce"' + (state.proSauce ? " checked" : "") + "> Sauce en sachets séparés</label>" : "<span></span>") +
        "</div>" + notesHTML(n.qty);
    } else if (id === "pickup") html = choices("pickup", LB.OPTIONS.pickup, state.pickup, false) + notesHTML(n.pickup);
    else {
      html = '<p>Relis le récap à côté. Tu peux encore revenir en arrière.</p>' +
        '<div class="actions"><button type="button" class="btn ghost small" data-action="reset">Tout remettre à zéro</button><button type="button" class="btn ghost small" data-action="classic">La suggestion du chef</button></div>';
    }
    var last = step === STEPS.length - 1;
    var nextLabel = last ? "Ma boulette est prête" : "Continuer";
    var disabled = !LB.canContinue(state, id);
    return progress(STEPS, step) + stepHead(STEPS, step) + html + navRow(step === 0 ? "Accueil" : "Retour", nextLabel, disabled) + "</div>";
  }
  function homeHTML() {
    var items = loadItems(KEY);
    var boxes = loadItems(BOXKEY);
    var sigs = LB.SIGS.map(function (s, i) {
      var tot = 0, k; for (k in s.mix) tot += s.mix[k];
      var mix = Object.keys(s.mix).map(function (key) { return key + " " + Math.round(s.mix[key] * 100 / tot) + " %"; }).join(", ");
      return '<article class="sig"><div class="head" style="background:' + s.col + (s.dark ? ";color:#161211" : "") + '"><span class="kind">' + esc(s.k) + "</span><h3>" + esc(s.n) + '</h3></div><div class="body"><p><i>' + esc(s.line) + "</i></p><p class=\"small\">" + esc(mix) + " · " + esc(s.sauce) + '</p><button type="button" class="btn small" data-sig="' + i + '">Composer celle-ci</button></div></article>';
    }).join("");
    var lib = items.length ? '<div class="grid g2">' + items.map(function (it) {
      return '<article class="card lib-card"><h3>' + esc(it.name) + '</h3><p class="small">' + esc(it.state.base) + " · " + esc(it.state.sauce) + " · " + (it.state.qty || "") + " × " + (it.state.packs || "") + '</p><div class="lib-actions"><button type="button" class="btn small" data-open="' + esc(it.id) + '">Ouvrir</button><button type="button" class="btn small alt" data-dup="' + esc(it.id) + '">Dupliquer</button><button type="button" class="btn small ghost" data-rename="' + esc(it.id) + '" data-kind="boulette">Renommer</button><button type="button" class="btn small ghost" data-share-id="' + esc(it.id) + '">Partager</button><button type="button" class="btn small ghost" data-del="' + esc(it.id) + '">Supprimer</button></div></article>';
    }).join("") + "</div>" : '<div class="empty">T\'as pas encore de boulette à toi. Fais pas le timide : compose-en une, elle reste dans cet appareil.</div>';
    var boxLib = boxes.length ? '<div class="grid g2">' + boxes.map(function (it) {
      return '<article class="card lib-card"><h3>' + esc(it.name) + '</h3><p class="small">' + esc((it.box.picks || []).join(", ") || "vide") + '</p><div class="lib-actions"><button type="button" class="btn small" data-open-box="' + esc(it.id) + '">Ouvrir</button><button type="button" class="btn small alt" data-dup-box="' + esc(it.id) + '">Dupliquer</button><button type="button" class="btn small ghost" data-rename="' + esc(it.id) + '" data-kind="box">Renommer</button><button type="button" class="btn small ghost" data-del-box="' + esc(it.id) + '">Supprimer</button></div></article>';
    }).join("") + "</div>" : "";
    return '<section class="hero-app"><span class="eyebrow" style="color:var(--yellow)">Boulettes boraines · Démo</span><h1>Fais pas l\'boulet.<br><em>Choisis-le.</em></h1><p>Ton haché au gramme près. Ce que tu mets dedans. Ta sauce. Ta boulette, roulée comme chez nous. Chez Laboulette, on rigole beaucoup… mais jamais avec le goût.</p><div class="row"><button type="button" class="btn" data-go="wizard">Je compose la mienne</button><button type="button" class="btn alt" data-go="box">La Box</button><a class="btn ghost" href="installer.html">Installer l\'appli</a></div></section>' +
      '<div class="section-h"><h2>Recettes signatures</h2></div><p class="muted">Pas envie de réfléchir ? Pars d\'une signature et bidouille. On ne le dira à personne.</p><div class="grid g3" style="margin-top:12px">' + sigs + '</div><p class="small">Compositions indicatives, à valider en production. Les noms sont des recettes maison de la démo.</p>' +
      '<div class="section-h" id="mes"><h2>Mes boulettes</h2></div>' + lib +
      (boxLib ? '<div class="section-h"><h2>Mes boxes</h2></div>' + boxLib : "") +
      '<div class="section-h"><h2>Installer</h2></div><div id="installGuide"></div>' +
      '<div class="proto">Démo conceptuelle non commerciale. Aucun prix, aucune commande, aucun paiement, aucun abonnement. Recettes, compositions, allergènes, conservation, partenariats, producteurs et certifications (dont halal, non certifiée) à valider avant lancement.</div>';
  }
  function readyHTML() {
    var mi = LB.meatInfo(state);
    var rows = LB.rows(state).map(function (r) {
      return "<tr><th scope=\"row\">" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>";
    }).join("");
    return '<div class="ready-hero"><div class="viz">' + previewSVG() + '</div><div><span class="eyebrow">C\'est prêt</span><h2>Ma boulette est prête</h2><p class="tease">' + (mi.ok ? "Elle a du caractère. Garde-la, partage-la, imprime la fiche. On ne la commande pas : c'est une démo." : "Le haché n'est pas encore bon. Reviens le corriger, fais pas le malin.") + '</p></div></div>' +
      '<div class="fiche" id="fiche"><div class="name-row"><label class="small" for="bouletteName">Son petit nom</label></div><div class="name-row"><input id="bouletteName" data-live="1" maxlength="60" value="' + esc(state.name || "") + '" aria-label="Nom de la boulette"></div><table>' + rows + "</table>" +
      '<div class="proto">Prototype Laboulette. Aucune commande, aucun paiement, aucun prix. Compositions et allergènes indicatifs, à valider en production. Producteur local : tarif à définir. Aucune enseigne ni certification n\'est promise.</div></div>' +
      '<div class="actions no-print"><button type="button" class="btn" data-action="save">Enregistrer</button><button type="button" class="btn alt" data-action="share">Partager le lien</button><button type="button" class="btn ghost" data-action="print">Imprimer la fiche</button><button type="button" class="btn ghost" data-action="export">Exporter</button><button type="button" class="btn ghost" data-action="dup-current">Dupliquer</button><button type="button" class="btn ghost" data-go="wizard">Modifier</button><button type="button" class="btn ghost" data-go="home">Accueil</button></div>';
  }
  function boxBody() {
    var s = BOX_STEPS[boxStep];
    var html = "";
    if (s.id === "people") html = choices("box-people", LB.BOX.people, box.people, false);
    else if (s.id === "recipes") html = choices("box-recipes", LB.BOX.recipes, box.recipes, false);
    else if (s.id === "rhythm") html = choices("box-rhythm", LB.BOX.rhythm, box.rhythm, false);
    else if (s.id === "picks") {
      var need = Number(box.recipes);
      html = '<div class="sub-h"><span>Signatures</span><span class="counter">' + box.picks.length + " / " + need + "</span></div>" +
        '<div class="choices">' + LB.SIGS.map(function (sig) {
          var sel = box.picks.indexOf(sig.n) > -1;
          return choiceBtn("box-pick", {v: sig.n, s: sig.k}, sel, false);
        }).join("") + "</div>" +
        (box.picks.length < need ? '<div class="alert">Encore ' + (need - box.picks.length) + " signature" + (need - box.picks.length > 1 ? "s" : "") + " à choisir. Fais pas ton difficile.</div>" : '<div class="tip">Box complète. T\'as bon goût, fieu.</div>');
    } else {
      html = '<div class="fiche"><h2>' + esc(box.name || "Ma box") + '</h2><table>' + LB.boxRows(box).map(function (r) {
        return "<tr><th scope=\"row\">" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>";
      }).join("") + '</table><div class="proto">Concept de démonstration : aucun abonnement réel, aucun paiement, aucun prix. Base de calcul indicative : 2 boulettes de 120 g par personne et par recette (à valider).</div></div>';
    }
    var last = boxStep === BOX_STEPS.length - 1;
    var blocked = (s.id === "picks" || s.id === "check") && !LB.boxCountOk(box);
    return progress(BOX_STEPS, boxStep) + stepHead(BOX_STEPS, boxStep) + html +
      navRow(boxStep === 0 ? "Accueil" : "Retour", last ? "Accueil" : "Continuer", !last && blocked) + "</div>";
  }
  function render() {
    var root = $("view");
    var active = document.activeElement;
    var keep = active && active.dataset && active.dataset.live === "1" ? active.id : "";
    var val = keep ? active.value : null;
    var sel = keep && active.selectionStart != null ? active.selectionStart : null;
    dir = dir || 1;
    var html = "";
    if (view === "home") html = homeHTML();
    else if (view === "wizard") html = '<div class="wizard"><div>' + wizardBody() + "</div>" + recapPanel(true) + "</div>";
    else if (view === "ready") html = readyHTML();
    else if (view === "box") html = '<div class="wizard"><div>' + boxBody() + '</div><aside class="recap"><h3>La Box Laboulette</h3><ul class="kv">' + LB.boxRows(box).map(function (r) { return "<li><b>" + esc(r[0]) + "</b><span>" + esc(r[1]) + "</span></li>"; }).join("") + '</ul><p class="small">Démo : pas d\'abonnement.</p></aside></div>';
    root.innerHTML = html;
    root.className = "view-enter";
    document.body.classList.toggle("has-dock", view === "wizard");
    if (keep) {
      var again = $(keep);
      if (again) {
        if (val != null && again.value !== val) again.value = val;
        again.focus();
        if (sel != null && again.setSelectionRange) { try { again.setSelectionRange(sel, sel); } catch (e) {} }
      }
    } else {
      var h = $("stepTitle");
      if (h) h.focus();
    }
    paintCounters(true);
    if (view === "home" && window.LBInstall) window.LBInstall.mount($("installGuide"));
  }
  function paintCounters(jump) {
    var mi = LB.meatInfo(state);
    var gEl = $("statGrams"), cEl = $("statCount");
    tween(cEl, shownC, LB.count(state), function (n) { return String(n); }, "c", jump);
    tween(gEl, shownG, mi.total, function (n) { return LB.fmt(n); }, "g", jump);
    shownC = LB.count(state);
    shownG = mi.total;
  }
  function tween(el, from, to, format, slot, jump) {
    if (!el) return;
    if (reduce || jump && from === 0) { el.textContent = format(to); return; }
    var t0 = performance.now();
    var handle = slot === "g" ? function (id) { if (id) rafG = id; return rafG; } : function (id) { if (id) rafC = id; return rafC; };
    cancelAnimationFrame(slot === "g" ? rafG : rafC);
    function frame(t) {
      var k = Math.min(1, (t - t0) / 420);
      var e = 1 - Math.pow(1 - k, 3);
      var v = Math.round(from + (to - from) * e);
      el.textContent = format(v);
      if (k < 1) {
        var id = requestAnimationFrame(frame);
        if (slot === "g") rafG = id; else rafC = id;
      }
    }
    handle(requestAnimationFrame(frame));
  }
  function patchDerived() {
    var mi = LB.meatInfo(state);
    LB.meatList(state).forEach(function (m) {
      var el = null;
      document.querySelectorAll("[data-pct]").forEach(function (node) { if (node.getAttribute("data-pct") === m.k) el = node; });
      var part = mi.c.filter(function (x) { return x.k === m.k; })[0];
      if (el) el.textContent = part ? part.p.toLocaleString("fr-BE") + " %" : "—";
    });
    var bar = $("bar");
    if (bar) bar.innerHTML = mi.c.map(function (x) { return '<i style="width:' + x.p + "%;background:" + x.c + '"></i>'; }).join("");
    var total = $("meatTotal");
    if (total) {
      total.className = mi.ok ? "ok" : "ko";
      total.innerHTML = "<b>Total : " + LB.fmt(mi.total) + "</b> — " + esc(mi.msg);
    }
    var notes = $("meatNotes");
    if (notes) notes.innerHTML = notesHTML(LB.notes(state).meat);
    var kv = $("kv");
    if (kv) kv.innerHTML = kvHTML();
    var warn = $("recapWarn");
    if (warn) warn.innerHTML = mi.ok ? "" : '<div class="alert">' + esc(mi.msg) + "</div>";
    var title = $("recapTitle");
    if (title) title.textContent = mi.ok ? (state.sig || state.name || "Ta boulette sur mesure") : "Euh… on y est presque.";
    var sub = $("recapSub");
    if (sub) sub.textContent = LB.count(state) + " boulettes • " + state.sauce + " • " + state.pickup;
    var next = document.querySelector("[data-next]");
    if (next && view === "wizard") next.disabled = !LB.canContinue(state, STEPS[step].id);
    paintCounters(false);
  }
  function goStep(n) {
    if (n < 0) { view = "home"; render(); return; }
    if (n >= STEPS.length) { finish(); return; }
    if (n > step) {
      if (!LB.canContinue(state, STEPS[step].id)) { showToast(LB.meatInfo(state).msg); buzz("no"); return; }
      var meatAt = STEPS.findIndex(function (s) { return s.id === "meat"; });
      if (n > meatAt && !LB.meatInfo(state).ok) { dir = -1; step = meatAt; showToast(LB.meatInfo(state).msg); buzz("no"); render(); return; }
    }
    dir = n > step ? 1 : -1;
    step = n;
    render();
  }
  function finish() {
    if (!LB.canContinue(state, "check")) { showToast(LB.meatInfo(state).msg); buzz("no"); return; }
    view = "ready";
    dir = 1;
    render();
    celebrate();
  }
  function goBox(n) {
    if (n < 0) { view = "home"; render(); return; }
    if (n >= BOX_STEPS.length) { view = "home"; render(); return; }
    if (n > boxStep && (BOX_STEPS[boxStep].id === "picks") && !LB.boxCountOk(box)) {
      showToast("Encore des signatures à choisir. Fais pas ton difficile.");
      buzz("no");
      return;
    }
    dir = n > boxStep ? 1 : -1;
    boxStep = n;
    render();
  }
  function celebrate() {
    buzz("win");
    if (reduce) return;
    var c = $("confetti");
    var ctx = c.getContext("2d");
    var w = c.width = innerWidth, h = c.height = innerHeight;
    var colors = ["#e8392a", "#ff8a1f", "#ffc83d", "#fff3e0", "#161211"];
    var bits = [];
    for (var i = 0; i < 90; i++) bits.push({x: w / 2, y: h * 0.3, vx: (Math.random() - 0.5) * 11, vy: Math.random() * -12 - 2, g: 0.28 + Math.random() * 0.12, s: 5 + Math.random() * 6, c: colors[i % colors.length], r: Math.random() * 6});
    var start = performance.now();
    function frame(t) {
      var k = (t - start) / 1600;
      ctx.clearRect(0, 0, w, h);
      bits.forEach(function (b) {
        b.vy += b.g; b.x += b.vx; b.y += b.vy; b.r += 0.2;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s * 0.55); ctx.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else ctx.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(frame);
  }
  function shareLinkFor(st) {
    var u = new URL(location.href);
    u.hash = ""; u.search = "";
    u.searchParams.set("b", LB.encodeState(st));
    return u.toString();
  }
  function copyText(text, ok) {
    function fallback() { window.prompt("Copie le lien :", text); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { showToast(ok); }, fallback);
    else fallback();
  }
  function saveCurrent() {
    var items = loadItems(KEY);
    if (!savedId) savedId = uid();
    state.name = (state.name || "Ma boulette").slice(0, 60);
    var item = {id: savedId, name: state.name, savedAt: Date.now(), state: LB.clone(state)};
    var i = items.findIndex(function (x) { return x.id === savedId; });
    if (i > -1) items[i] = item; else items.unshift(item);
    storeItems(KEY, items);
    showToast("Enregistrée dans Mes boulettes. Elle reste ici, même après rechargement.");
    buzz("pick");
  }
  function saveBox() {
    var items = loadItems(BOXKEY);
    if (!savedBoxId) savedBoxId = uid();
    var item = {id: savedBoxId, name: box.name || "Ma box", savedAt: Date.now(), box: LB.clone(box)};
    var i = items.findIndex(function (x) { return x.id === savedBoxId; });
    if (i > -1) items[i] = item; else items.unshift(item);
    storeItems(BOXKEY, items);
    showToast("Box enregistrée. Toujours une démo, hein.");
  }
  function openRename(id, kind) {
    var dlg = $("renameDlg");
    var input = $("renameInput");
    var items = loadItems(kind === "box" ? BOXKEY : KEY);
    var it = items.filter(function (x) { return x.id === id; })[0];
    if (!it || !dlg) return;
    input.value = it.name;
    dlg.returnValue = "";
    dlg.showModal();
    dlg.onclose = function () {
      if (dlg.returnValue !== "ok") return;
      var name = input.value.trim().slice(0, 60);
      if (!name) return;
      it.name = name;
      if (kind === "box") it.box.name = name; else it.state.name = name;
      storeItems(kind === "box" ? BOXKEY : KEY, items);
      if (kind !== "box" && savedId === id) state.name = name;
      if (kind === "box" && savedBoxId === id) box.name = name;
      showToast("Nouveau nom noté.");
      render();
    };
  }
  function applyChoice(group, value) {
    var toast = null;
    if (group === "audience") toast = LB.setAudience(state, value);
    else if (group === "base") toast = LB.setBase(state, value);
    else if (group === "preset") toast = LB.setPreset(state, value);
    else if (group === "garnish" || group === "herbs" || group === "spices") toast = LB.toggleMulti(state, group, value);
    else if (group === "dose" || group === "sauce" || group === "pickup") toast = LB.setSimple(state, group, value);
    else if (group === "qty") toast = LB.setQty(state, value);
    else if (group === "box-people") toast = LB.setBoxField(box, "people", value);
    else if (group === "box-recipes") toast = LB.setBoxField(box, "recipes", value);
    else if (group === "box-rhythm") toast = LB.setBoxField(box, "rhythm", value);
    else if (group === "box-pick") toast = LB.toggleBoxPick(box, value);
    if (toast) { showToast(toast); if (/max|malin|placard|savoir/.test(toast)) buzz("no"); else buzz("pick"); }
    else buzz("pick");
    render();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t) return;
    if (t.hasAttribute("data-choice")) { applyChoice(t.dataset.group, t.dataset.value); return; }
    if (t.dataset.go) {
      view = t.dataset.go === "wizard" ? "wizard" : t.dataset.go === "box" ? "box" : t.dataset.go === "home" ? "home" : t.dataset.go === "library" ? "home" : view;
      if (t.dataset.go === "wizard") { step = 0; dir = 1; }
      if (t.dataset.go === "box") { boxStep = 0; dir = 1; }
      if (t.dataset.go === "home") view = "home";
      render();
      if (view === "home") { var mes = $("mes"); if (t.dataset.go === "library" && mes) mes.scrollIntoView(); }
      return;
    }
    if (t.dataset.sig != null) {
      LB.loadSignature(state, Number(t.dataset.sig));
      savedId = null; view = "wizard"; step = 0; dir = 1;
      showToast(state.sig + " chargée. Tu peux encore bidouiller, va.");
      render(); return;
    }
    if (t.hasAttribute("data-next")) {
      if (view === "box") {
        if (boxStep === BOX_STEPS.length - 1) { saveBox(); view = "home"; render(); }
        else goBox(boxStep + 1);
      } else if (step === STEPS.length - 1) finish();
      else goStep(step + 1);
      return;
    }
    if (t.hasAttribute("data-back")) { if (view === "box") goBox(boxStep - 1); else goStep(step - 1); return; }
    if (t.dataset.dot != null) { var n = Number(t.dataset.dot); if (view === "box") goBox(n); else goStep(n); return; }
    if (t.dataset.action === "fit") { LB.scaleToTarget(state); showToast("Haché ajusté, proportions gardées. Malin."); render(); return; }
    if (t.dataset.action === "reset") {
      var aud = state.audience; state = LB.fresh(); savedId = null;
      if (aud === "Professionnel") { state.audience = "Professionnel"; state.qty = "50"; state.packs = 1; LB.scaleToTarget(state); }
      showToast("On efface tout et on recommence. Sans rancune."); step = 0; render(); return;
    }
    if (t.dataset.action === "classic") { LB.loadSignature(state, 0); savedId = null; step = 0; showToast("La suggestion du chef : La Terrilette. Tu peux toujours bidouiller, va."); render(); return; }
    if (t.dataset.action === "save") { saveCurrent(); return; }
    if (t.dataset.action === "share") {
      var link = shareLinkFor(state);
      if (navigator.share) navigator.share({title: "Laboulette", text: state.name || "Ma boulette", url: link}).catch(function () { copyText(link, "Lien copié. Envoie-le, la composition est dedans."); });
      else copyText(link, "Lien copié. Envoie-le, la composition est dedans.");
      return;
    }
    if (t.dataset.action === "print") { window.print(); return; }
    if (t.dataset.action === "export") {
      var blob = new Blob(["LABOULETTE — Ma composition (démo, sans commande)\n" + LB.recapText(state) + "\n"], {type: "text/plain"});
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "laboulette-" + LB.slug(state.name || "ma-boulette") + ".txt"; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
      showToast("Fiche exportée. Toujours pas une commande.");
      return;
    }
    if (t.dataset.action === "dup-current") {
      savedId = null; state.name = (state.name || "Ma boulette") + " (copie)"; saveCurrent(); render(); return;
    }
    if (t.id === "dockToggle") {
      var rec = $("recap"); rec.classList.toggle("collapsed");
      t.setAttribute("aria-expanded", rec.classList.contains("collapsed") ? "false" : "true");
      return;
    }
    if (t.dataset.open) {
      var it = loadItems(KEY).filter(function (x) { return x.id === t.dataset.open; })[0];
      if (!it) return;
      state = LB.clone(it.state); savedId = it.id; view = "ready"; render(); return;
    }
    if (t.dataset.dup) {
      var src = loadItems(KEY).filter(function (x) { return x.id === t.dataset.dup; })[0];
      if (!src) return;
      var copy = {id: uid(), name: src.name + " (copie)", savedAt: Date.now(), state: LB.clone(src.state)};
      copy.state.name = copy.name;
      var all = loadItems(KEY); all.unshift(copy); storeItems(KEY, all);
      showToast("Copie prête. Même recette, autre nom."); render(); return;
    }
    if (t.dataset.shareId) {
      var src2 = loadItems(KEY).filter(function (x) { return x.id === t.dataset.shareId; })[0];
      if (src2) copyText(shareLinkFor(src2.state), "Lien copié.");
      return;
    }
    if (t.dataset.del) {
      if (t.dataset.sure !== "1") { t.dataset.sure = "1"; t.textContent = "Oui, supprimer"; showToast("T'es sûr ? On jette pas une boulette comme ça."); return; }
      var left = loadItems(KEY).filter(function (x) { return x.id !== t.dataset.del; });
      storeItems(KEY, left); if (savedId === t.dataset.del) savedId = null; render(); return;
    }
    if (t.dataset.rename) { openRename(t.dataset.rename, t.dataset.kind || "boulette"); return; }
    if (t.dataset.openBox) {
      var b = loadItems(BOXKEY).filter(function (x) { return x.id === t.dataset.openBox; })[0];
      if (!b) return;
      box = LB.clone(b.box); savedBoxId = b.id; view = "box"; boxStep = BOX_STEPS.length - 1; render(); return;
    }
    if (t.dataset.dupBox) {
      var sb = loadItems(BOXKEY).filter(function (x) { return x.id === t.dataset.dupBox; })[0];
      if (!sb) return;
      var cb = {id: uid(), name: sb.name + " (copie)", savedAt: Date.now(), box: LB.clone(sb.box)};
      cb.box.name = cb.name;
      var bs = loadItems(BOXKEY); bs.unshift(cb); storeItems(BOXKEY, bs); render(); return;
    }
    if (t.dataset.delBox) {
      if (t.dataset.sure !== "1") { t.dataset.sure = "1"; t.textContent = "Oui, supprimer"; return; }
      storeItems(BOXKEY, loadItems(BOXKEY).filter(function (x) { return x.id !== t.dataset.delBox; }));
      render(); return;
    }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.gram) {
      if (t.type === "number" && t.value === "") return;
      var res = LB.setGram(state, t.dataset.gram, t.value);
      var row = t.closest(".meat");
      if (row) {
        row.querySelectorAll("[data-gram]").forEach(function (inp) {
          if (inp !== t) {
            if (inp.type === "range" && Number(res.value) > Number(inp.max)) inp.max = res.value;
            inp.value = res.value;
          }
        });
      }
      if (res.toast) showToast(res.toast);
      patchDerived();
      return;
    }
    if (t.id === "bouletteName") {
      state.name = t.value.slice(0, 60);
      var h = document.querySelector(".fiche h2");
      if (h && view === "ready") { /* le titre de fête reste fixe */ }
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "packs") {
      var toast = LB.setPacks(state, t.value);
      if (toast) showToast(toast);
      render();
      return;
    }
    if (t.dataset && t.dataset.flag) {
      var msg = LB.setFlag(state, t.dataset.flag, t.checked);
      if (msg) showToast(msg);
      buzz("pick");
      render();
    }
  });
  var touch = null;
  function swipeBy(dx, dy) {
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy)) return;
    armed = true;
    if (view === "wizard") { if (dx < 0) goStep(step + 1); else goStep(step - 1); }
    else if (view === "box") { if (dx < 0) goBox(boxStep + 1); else goBox(boxStep - 1); }
  }
  document.addEventListener("touchstart", function (e) {
    if (e.target.closest("input, textarea, select, button, a")) return;
    var p = e.changedTouches[0];
    touch = {x: p.clientX, y: p.clientY};
  }, {passive: true});
  document.addEventListener("touchend", function (e) {
    if (!touch) return;
    var p = e.changedTouches[0];
    var dx = p.clientX - touch.x, dy = p.clientY - touch.y;
    touch = null;
    swipeBy(dx, dy);
  }, {passive: true});
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch") return;
    if (e.target.closest("input, textarea, select, button, a")) return;
    touch = {x: e.clientX, y: e.clientY, pointer: e.pointerId};
  });
  document.addEventListener("pointerup", function (e) {
    if (!touch || touch.pointer == null || e.pointerId !== touch.pointer) return;
    var dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    touch = null;
    swipeBy(dx, dy);
  });
  document.addEventListener("keydown", function (e) {
    if (e.target && e.target.matches && e.target.matches("input, textarea, select")) return;
    if (e.key === "ArrowRight") { if (view === "wizard") goStep(step + 1); if (view === "box") goBox(boxStep + 1); }
    if (e.key === "ArrowLeft") { if (view === "wizard") goStep(step - 1); if (view === "box") goBox(boxStep - 1); }
  });

  var params = new URLSearchParams(location.search);
  if (params.get("b")) {
    var decoded = LB.decodeState(params.get("b"));
    if (decoded) { state = decoded; view = "ready"; celebrateOnLoad = true; }
    else showToast("Ce lien est illisible. On repart de la maison, fais pas le malin.");
  } else if (params.get("recette")) {
    var idx = LB.sigBySlug(params.get("recette"));
    if (idx > -1) { LB.loadSignature(state, idx); view = "wizard"; step = 0; }
  } else if (params.get("pour") === "pro") {
    LB.setAudience(state, "Professionnel");
    view = "wizard"; step = 0;
  } else if (params.get("parcours") === "box" || params.get("box")) {
    if (params.get("box")) { var bx = LB.decodeBox(params.get("box")); if (bx) box = bx; }
    view = "box"; boxStep = params.get("box") ? BOX_STEPS.length - 1 : 0;
  }

  var splash = $("splash");
  function endSplash() {
    splash.classList.add("out");
    try { sessionStorage.setItem("laboulette.splash", "1"); } catch (e) {}
    setTimeout(function () { splash.classList.add("gone"); }, reduce ? 0 : 480);
    if (celebrateOnLoad) celebrate();
  }
  var seen = false;
  try { seen = sessionStorage.getItem("laboulette.splash") === "1"; } catch (e) {}
  if (seen) { splash.classList.add("out"); if (celebrateOnLoad) setTimeout(celebrate, 60); }
  else setTimeout(endSplash, reduce || celebrateOnLoad ? 320 : 1450);
  splash.addEventListener("click", endSplash);

  render();
  window.LBApp = {state: function () { return state; }, box: function () { return box; }};
})();
