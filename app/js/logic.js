/* Logique du configurateur Laboulette.
   Reprend les règles de la démo (index.html) : formats, doses, limites, allergènes.
   Aucun prix, aucune commande. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LB = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var MAX_HERBS = 3, MAX_SPICES = 3, MAX_MEATS = 3, STEP = 50, CAL = 120;
  var LIMITS = {Particulier: {min: 250, max: 3000}, Professionnel: {min: 2400, max: 60000}};
  var MEATS = [
    {k: "Bœuf", c: "#b8321f"},
    {k: "Porc", c: "#f08c7a"},
    {k: "Veau", c: "#e0b48a"},
    {k: "Agneau", c: "#7a3b2b"},
    {k: "Volaille", c: "#ffc83d"}
  ];
  var VEGE = [{k: "Mélange végétal maison", c: "#5f9a3a"}];
  var OPTIONS = {
    audience: [{v: "Particulier", s: "sachets de 2, 4 ou 6"}, {v: "Professionnel", s: "lots de 20, 50 ou 100"}],
    base: [{v: "Viande", s: "bœuf, porc, veau, agneau, volaille"}, {v: "Végétale", s: "recette maison, sans œuf"}],
    preset: [{v: "Maison bœuf-porc", s: "60 / 40"}, {v: "100 % bœuf", s: "pur et dur"}, {v: "Trio maison", s: "bœuf, porc, volaille"}, {v: "Je dose moi-même", s: "page blanche"}],
    garnish: [{v: "Oignons"}, {v: "Échalotes"}, {v: "Persil"}, {v: "Chapelure", s: "gluten"}, {v: "Œufs", s: "œuf"}, {v: "Poivrons confits"}, {v: "Ail"}],
    herbs: [{v: "Ciboulette"}, {v: "Thym"}, {v: "Romarin"}, {v: "Coriandre fraîche"}, {v: "Basilic"}, {v: "Sauge"}, {v: "Origan"}, {v: "Estragon"}, {v: "Persil plat"}],
    spices: [{v: "Paprika"}, {v: "Cumin"}, {v: "Curcuma"}, {v: "Muscade"}, {v: "Poivre noir"}, {v: "Piment d'Espelette"}, {v: "Coriandre moulue"}, {v: "Quatre-épices"}],
    dose: [{v: "Léger", s: "pour mémé"}, {v: "Normal", s: "comme il faut"}, {v: "Costaud", s: "pour les gaillards"}],
    sauce: [{v: "Liégeoise", s: "oignons, sirop de Liège"}, {v: "Tomate façon mamma", s: "à l'italienne"}, {v: "Moutarde", s: "crémeuse"}, {v: "Forestière", s: "champignons"}, {v: "Brabançonne", s: "chicons, crème, lardons"}, {v: "Sans sauce", s: "t'es sûr ?"}],
    qtyParticulier: [{v: "2", s: "la signature"}, {v: "4", s: "en duo affamé"}, {v: "6", s: "pour la tablée"}],
    qtyProfessionnel: [{v: "20", s: "lot"}, {v: "50", s: "lot"}, {v: "100", s: "lot"}],
    pickup: [{v: "Livraison", s: "on te l'amène"}, {v: "Click-and-collect", s: "tu passes la chercher"}, {v: "En magasin", s: "notre enseigne partenaire (exclusivité)"}]
  };
  var SAUCE_COL = {"Liégeoise": "#6b3518", "Tomate façon mamma": "#d23a22", "Moutarde": "#e2ab2a", "Forestière": "#7a5236", "Brabançonne": "#efe1c4", "Sans sauce": null};
  var PRESETS = {"Maison bœuf-porc": {"Bœuf": 60, "Porc": 40}, "100 % bœuf": {"Bœuf": 100}, "Trio maison": {"Bœuf": 50, "Porc": 33, "Volaille": 17}, "Je dose moi-même": null};
  var SIGS = [
    {n: "La Terrilette", k: "La classique du dimanche", col: "#e8392a", base: "Viande", mix: {"Bœuf": 60, "Porc": 40}, garnish: ["Oignons", "Persil", "Chapelure", "Œufs"], herbs: [], spices: ["Poivre noir", "Muscade"], dose: "Normal", sauce: "Liégeoise", line: "Haute comme un terril, douce comme le sirop. La boulette de mémé, sans discussion."},
    {n: "La Gueule Noire", k: "Pour les costauds", col: "#161211", dark: true, base: "Viande", mix: {"Bœuf": 100}, garnish: ["Échalotes", "Ail", "Chapelure", "Œufs"], herbs: ["Thym"], spices: ["Poivre noir", "Paprika"], dose: "Costaud", sauce: "Forestière", line: "Noire de caractère, franche du collier. À manger après une grosse journée."},
    {n: "La Ducasse", k: "La festive", col: "#ff8a1f", base: "Viande", mix: {"Bœuf": 50, "Porc": 33, "Volaille": 17}, garnish: ["Oignons", "Poivrons confits", "Chapelure", "Œufs"], herbs: ["Origan"], spices: ["Paprika", "Piment d'Espelette"], dose: "Normal", sauce: "Tomate façon mamma", line: "Ça sent la fête foraine et les manèges. Trois viandes, un peu de piquant, beaucoup d'ambiance."},
    {n: "La Fieu", k: "La fine", col: "#ffc83d", dark: true, base: "Viande", mix: {"Veau": 50, "Porc": 50}, garnish: ["Échalotes", "Persil", "Chapelure", "Œufs"], herbs: ["Estragon"], spices: ["Muscade", "Poivre noir"], dose: "Léger", sauce: "Moutarde", line: "Veau, estragon, moutarde : la boulette qui a mis sa belle chemise. Mais elle reste du coin, hein."},
    {n: "La Chiconnette", k: "La gourmande", col: "#8a5a2b", base: "Viande", mix: {"Porc": 60, "Bœuf": 40}, garnish: ["Oignons", "Persil", "Chapelure", "Œufs"], herbs: ["Thym"], spices: ["Muscade"], dose: "Normal", sauce: "Brabançonne", line: "Chicons, crème, lardons : la sauce qui console. Régime ? Demain."},
    {n: "La Verte du Coron", k: "La végétale", col: "#3f7a3a", base: "Végétale", mix: {"Mélange végétal maison": 100}, garnish: ["Oignons", "Persil", "Chapelure"], herbs: ["Ciboulette", "Coriandre fraîche"], spices: ["Cumin", "Curcuma"], dose: "Normal", sauce: "Tomate façon mamma", line: "Sans viande, sans œuf, avec du caractère. Même ton beau-frère carnivore en a repris."}
  ];
  var BOX = {
    people: [{v: "2", s: "en amoureux"}, {v: "4", s: "la petite famille"}, {v: "6", s: "la grande tablée"}],
    recipes: [{v: "2", s: "recettes"}, {v: "3", s: "recettes"}, {v: "4", s: "recettes"}],
    rhythm: [{v: "Chaque semaine", s: "pour les accros"}, {v: "Toutes les 2 semaines", s: "le bon rythme"}, {v: "Chaque mois", s: "pour se faire plaisir"}, {v: "Une seule fois", s: "pour goûter"}]
  };
  var PICKUP_TIP = {
    "Livraison": "On te l'amène, bien au frais (ou au froid). Zones et délais à définir.",
    "Click-and-collect": "Tu composes, tu passes, tu repars. Points de retrait à définir.",
    "En magasin": "Au rayon de notre enseigne partenaire (exclusivité). En magasin, ce sera surtout nos signatures : le sur-mesure complet, c'est en ligne (à valider)."
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pro(state) { return state.audience === "Professionnel"; }
  function lim(state) { return LIMITS[state.audience] || LIMITS.Particulier; }
  function meatList(state) { return state.base === "Végétale" ? VEGE : MEATS; }
  function count(state) { return Number(state.qty) * state.packs; }
  function r50(x) { return Math.max(STEP, Math.round(x / STEP) * STEP); }
  function target(state) { return r50(count(state) * CAL); }
  function maxPacks(state) { return Math.max(1, Math.floor(lim(state).max / (Number(state.qty) * CAL))); }
  function fmt(g) {
    return g >= 1000 ? (g / 1000).toLocaleString("fr-BE", {maximumFractionDigits: 2}) + " kg" : g + " g";
  }
  function slug(name) {
    return String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function qtyOptions(state) { return pro(state) ? OPTIONS.qtyProfessionnel : OPTIONS.qtyParticulier; }
  function isOff(state, group, value) {
    if (group !== "garnish") return false;
    if (value === "Œufs" && (state.noEgg || state.base === "Végétale")) return true;
    if (value === "Chapelure" && state.noGluten) return true;
    return false;
  }
  function removeFrom(arr, v) {
    var i = arr.indexOf(v);
    if (i > -1) arr.splice(i, 1);
  }
  function clearSig(state) {
    if (state.sig && state.name === state.sig) state.name = "Ma boulette";
    state.sig = null;
  }
  function applyMix(state, ratio, total) {
    var keys = Object.keys(ratio).filter(function (k) { return ratio[k] > 0; });
    var sum = keys.reduce(function (s, k) { return s + ratio[k]; }, 0);
    var out = {}, acc = 0;
    keys.forEach(function (k, i) {
      var v = i === keys.length - 1 ? total - acc : Math.round(total * ratio[k] / sum / STEP) * STEP;
      v = Math.max(STEP, v);
      out[k] = v;
      acc += v;
    });
    state.grams = out;
  }
  function scaleToTarget(state) {
    var cur = state.grams || {}, sum = 0, k;
    for (k in cur) sum += cur[k];
    if (sum > 0) applyMix(state, cur, target(state));
    else if (state.base === "Végétale") applyMix(state, {"Mélange végétal maison": 1}, target(state));
    else applyMix(state, PRESETS["Maison bœuf-porc"], target(state));
  }
  function fresh() {
    var state = {
      audience: "Particulier", base: "Viande", preset: "Maison bœuf-porc", grams: {},
      garnish: ["Oignons", "Persil", "Chapelure", "Œufs"], herbs: [], spices: ["Poivre noir", "Muscade"],
      dose: "Normal", sauce: "Liégeoise", qty: "2", packs: 3, pickup: "Livraison",
      noEgg: false, noGluten: false, proSauce: true, local: false, sig: null, name: "Ma boulette"
    };
    applyMix(state, PRESETS["Maison bœuf-porc"], target(state));
    return state;
  }
  function freshBox() {
    return {people: "4", recipes: "3", rhythm: "Toutes les 2 semaines", picks: ["La Terrilette", "La Ducasse", "La Verte du Coron"], name: "Ma box"};
  }
  function enforceDiet(state) {
    if (state.noEgg || state.base === "Végétale") removeFrom(state.garnish, "Œufs");
    if (state.noGluten) removeFrom(state.garnish, "Chapelure");
    if (state.base === "Végétale" && state.local) state.local = false;
  }
  function setGram(state, key, raw) {
    var L = lim(state);
    var val = Math.max(0, Math.round((Number(raw) || 0) / STEP) * STEP);
    var toast = null;
    if (val > L.max) {
      val = L.max;
      toast = "Plus de " + fmt(L.max) + " d'une seule viande ? Même un mineur de fond n'en mange pas autant.";
    }
    if (!state.grams) state.grams = {};
    state.grams[key] = val;
    state.preset = "Je dose moi-même";
    clearSig(state);
    return {value: val, toast: toast};
  }
  function clampPacks(state) {
    var m = maxPacks(state);
    var toast = null;
    if (state.packs > m) {
      state.packs = m;
      toast = "On plafonne à " + m + (pro(state) ? " lots" : " sachets") + " : au-delà, ça dépasse " + fmt(lim(state).max) + " de haché.";
    }
    if (state.packs < 1 || !isFinite(state.packs)) state.packs = 1;
    state.packs = Math.round(state.packs);
    return toast;
  }
  function setPacks(state, raw) {
    state.packs = Math.max(1, Math.floor(Number(raw) || 1));
    var toast = clampPacks(state);
    scaleToTarget(state);
    return toast;
  }
  function setQty(state, value) {
    state.qty = value;
    var toast = clampPacks(state);
    scaleToTarget(state);
    return toast;
  }
  function setAudience(state, value) {
    if (state.audience === value) return null;
    state.audience = value;
    state.qty = pro(state) ? "50" : "2";
    state.packs = pro(state) ? 1 : 3;
    scaleToTarget(state);
    return pro(state)
      ? "Mode pro activé : lots, sauce à part, gros volumes."
      : "Retour en mode particulier. Les petits sachets, c'est mignon aussi.";
  }
  function setBase(state, value) {
    state.base = value;
    clearSig(state);
    if (value === "Végétale") {
      applyMix(state, {"Mélange végétal maison": 1}, target(state));
      removeFrom(state.garnish, "Œufs");
      state.local = false;
    } else {
      state.preset = "Maison bœuf-porc";
      applyMix(state, PRESETS["Maison bœuf-porc"], target(state));
    }
    return null;
  }
  function setPreset(state, value) {
    state.preset = value;
    clearSig(state);
    if (PRESETS[value]) {
      applyMix(state, PRESETS[value], target(state));
      return null;
    }
    return "Page blanche : à toi de doser, chef.";
  }
  function toggleMulti(state, group, value) {
    var arr = state[group];
    var i = arr.indexOf(value);
    if (i > -1) {
      arr.splice(i, 1);
      clearSig(state);
      return null;
    }
    if (isOff(state, group, value)) {
      if (value === "Œufs" && state.base === "Végétale") return "Des œufs dans une boulette végétale ? Fais pas le malin.";
      if (value === "Œufs") return "T'as coché « sans œuf ». Faudrait savoir, fieu.";
      return "T'as coché « sans gluten ». La chapelure reste au placard.";
    }
    if (group === "herbs" && arr.length >= MAX_HERBS) return "Trois herbes max. C'est une boulette, pas un potager.";
    if (group === "spices" && arr.length >= MAX_SPICES) return "Trois épices max. Tu veux goûter la viande ou juste transpirer ?";
    arr.push(value);
    clearSig(state);
    return null;
  }
  function setFlag(state, flag, on) {
    state[flag] = !!on;
    if (flag === "noEgg" || flag === "noGluten" || flag === "local") clearSig(state);
    enforceDiet(state);
    if (flag === "noEgg" && state.noEgg) return "Sans œuf, noté. On s'occupe du liant.";
    if (flag === "noGluten" && state.noGluten) return "Sans gluten, noté. La chapelure prend congé.";
    if (flag === "local" && state.local) return "Producteur local, bon choix. Le tarif ? À définir, fais pas le pressé.";
    return null;
  }
  function setSimple(state, group, value) {
    state[group] = value;
    if (group !== "pickup") clearSig(state);
    return null;
  }
  function loadSignature(state, index) {
    var s = SIGS[index];
    if (!s) return null;
    var aud = state.audience, qty = state.qty, packs = state.packs, pick = state.pickup;
    var next = fresh();
    next.audience = aud;
    next.qty = qty;
    next.packs = packs;
    next.pickup = pick;
    next.base = s.base;
    next.garnish = s.garnish.slice();
    next.herbs = s.herbs.slice();
    next.spices = s.spices.slice();
    next.dose = s.dose;
    next.sauce = s.sauce;
    next.preset = s.base === "Viande" ? "Je dose moi-même" : next.preset;
    next.noEgg = false;
    next.noGluten = false;
    next.proSauce = true;
    next.local = false;
    applyMix(next, s.mix, target(next));
    next.sig = s.n;
    next.name = s.n;
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.keys(next).forEach(function (k) { state[k] = next[k]; });
    enforceDiet(state);
    return s.n + " chargée. Tu peux encore bidouiller, va.";
  }
  function meatInfo(state) {
    enforceDiet(state);
    var L = lim(state);
    var c = meatList(state).map(function (m) {
      return {k: m.k, c: m.c, g: (state.grams && state.grams[m.k]) || 0};
    }).filter(function (x) { return x.g > 0; });
    var total = c.reduce(function (s, x) { return s + x.g; }, 0);
    c.forEach(function (x) { x.p = total ? Math.round(x.g * 1000 / total) / 10 : 0; });
    var msg, ok = false;
    if (total === 0) msg = "Zéro gramme ? C'est une boulette invisible, ça. Mets un peu de haché, fais pas le malin.";
    else if (c.length > MAX_MEATS) msg = c.length + " viandes ? C'est une boulette, pas un barbecue de ducasse. " + MAX_MEATS + " maximum.";
    else if (total < L.min) msg = "Total " + fmt(total) + " : il faut au moins " + fmt(L.min) + " par commande. On allume pas le four pour trois miettes.";
    else if (total > L.max) msg = "Total " + fmt(total) + " : on s'arrête à " + fmt(L.max) + " par commande" + (pro(state) ? ". Pour plus, on en parle entre pros." : ". Au-delà, t'es pro ou t'as invité tout le coron ?");
    else { ok = true; msg = "Mélange valide. Bien dosé, chef."; }
    return {c: c, total: total, ok: ok, msg: msg};
  }
  function liantAlt(state) {
    return state.base === "Végétale" || state.garnish.indexOf("Œufs") < 0;
  }
  function allergens(state) {
    var g = state.garnish, list = [], vege = state.base === "Végétale";
    if (g.indexOf("Chapelure") > -1) list.push("gluten (chapelure)");
    if (g.indexOf("Œufs") > -1) list.push("œuf");
    if (state.sauce === "Moutarde") list.push("moutarde, lait probable");
    if (state.sauce === "Brabançonne") list.push("lait (crème)");
    if (vege && state.sauce === "Brabançonne") list.push("sauce avec lardons, non végétale");
    return list;
  }
  function rows(state) {
    var mi = meatInfo(state);
    var g = state.garnish;
    var vege = state.base === "Végétale";
    var P = pro(state);
    var n = count(state);
    var hache = mi.c.length ? mi.c.map(function (x) { return x.k + " " + fmt(x.g) + " (" + x.p.toLocaleString("fr-BE") + " %)"; }).join(", ") : "rien du tout";
    var all = allergens(state);
    return [
      ["Client", state.audience],
      ["Recette", state.sig ? state.sig + " (signature)" : "Sur mesure"],
      ["Nom", state.name || "Ma boulette"],
      ["Base", state.base],
      ["Haché", hache],
      ["Total haché", fmt(mi.total)],
      ["Calibre", "unique, " + CAL + " g cru"],
      ["Producteur local", state.local ? "oui, supplément (tarif à définir)" : "non"],
      ["Dedans", g.length ? g.join(", ") : "rien (boulette nature)"],
      ["Liant", liantAlt(state) ? "alternatif" + (vege ? " végétal" : "") + " (à valider)" : "œufs" + (g.indexOf("Chapelure") > -1 ? " + chapelure" : "")],
      ["Herbes", state.herbs.length ? state.herbs.join(", ") : "aucune"],
      ["Épices", state.spices.length ? state.spices.join(", ") + " (dosage " + state.dose.toLowerCase() + ")" : "aucune"],
      ["Sauce", state.sauce + (P && state.sauce !== "Sans sauce" ? (state.proSauce ? ", en sachets séparés" : ", incluse") : "")],
      ["Quantité", state.qty + " boulettes par " + (P ? "lot" : "sachet") + " × " + state.packs + " = " + n + " boulettes"],
      ["Récupération", state.pickup === "En magasin" ? "en magasin, notre enseigne partenaire (exclusivité)" : state.pickup],
      ["Emballage", "sous vide + étui carton (frais ou surgelé, au choix de la maison)"],
      ["Régime", [state.noEgg || vege ? "sans œuf" : "", state.noGluten ? "sans gluten (à valider)" : ""].filter(Boolean).join(", ") || "standard"],
      ["Allergènes", (all.length ? all.join(", ") : "aucun repéré") + " (indicatif, à valider)"]
    ];
  }
  function recapText(state) {
    var mi = meatInfo(state);
    return rows(state).map(function (r) { return r[0] + " : " + r[1]; }).join("\n") + (mi.ok ? "" : "\nHaché à corriger");
  }
  function limitsLine(state) {
    var L = lim(state);
    return "Limites par commande (" + state.audience.toLowerCase() + ") : de " + fmt(L.min) + " à " + fmt(L.max) + " de haché. Base de calcul : " + CAL + " g cru par boulette, garnitures comprises (indicatif).";
  }
  function notes(state) {
    var mi = meatInfo(state);
    var g = state.garnish;
    var vege = state.base === "Végétale";
    var P = pro(state);
    var n = count(state);
    var tgt = target(state);
    var meat = [];
    if (mi.total > 0 && Math.abs(mi.total - tgt) >= CAL) {
      meat.push({
        type: "alert",
        text: "Ton haché fait " + fmt(mi.total) + ", mais " + n + " boulettes de " + CAL + " g demandent ≈ " + fmt(tgt) + ". " + (mi.total > tgt ? "T'en as trop, ça déborde du sachet." : "Il en manque, on fait pas des boulettes à trous."),
        action: "fit"
      });
    } else if (mi.total > 0) {
      meat.push({type: "tip", text: "≈ " + fmt(tgt) + " pour " + n + " boulettes de " + CAL + " g cru. Pile poil."});
    }
    var garnish = [];
    if (vege) garnish.push({type: "tip", text: "Recette végétale = sans œuf. On passe sur un liant végétal (nature à valider en production)."});
    else if (g.indexOf("Œufs") < 0) garnish.push({type: "tip", text: "Sans œuf, ta boulette risque de se faire la malle dans la poêle. On prévoit un liant alternatif (à valider)."});
    if (state.noGluten) garnish.push({type: "tip", text: "Sans gluten : pas de chapelure classique, une alternative est à valider. Pense aussi à la sauce, on vérifie tout avant lancement."});
    if (g.indexOf("Oignons") > -1 && g.indexOf("Échalotes") > -1) garnish.push({type: "tip", text: "Oignons ET échalotes ? T'aimes quand ça pleure, toi. Va pour les deux."});
    if (g.length === 0) garnish.push({type: "alert", text: "Rien dedans ? Une boulette toute nue… C'est permis, mais t'es sûr de toi ?"});
    if (g.indexOf("Chapelure") > -1 || g.indexOf("Œufs") > -1) {
      garnish.push({type: "note", text: "Allergènes : " + [g.indexOf("Chapelure") > -1 ? "chapelure = gluten" : "", g.indexOf("Œufs") > -1 ? "œufs = œuf" : ""].filter(Boolean).join(" • ") + ". Coche « sans œuf » ou « sans gluten » si besoin."});
    }
    var herbs = [];
    if (state.herbs.indexOf("Persil plat") > -1 && g.indexOf("Persil") > -1) herbs.push({type: "tip", text: "Persil ET persil plat ? T'es un vrai fan. On note, mais fais pas le malin."});
    if (state.herbs.length === MAX_HERBS) herbs.push({type: "tip", text: "C'est complet. Pour en changer une, décoche d'abord."});
    var spices = [];
    if (state.spices.length === MAX_SPICES) spices.push({type: "tip", text: "Trois épices, c'est le plafond. Décoche pour échanger."});
    if (state.spices.indexOf("Piment d'Espelette") > -1 && state.dose === "Costaud") spices.push({type: "alert", text: "Espelette + dosage costaud : prévois une bière à côté. Ou deux."});
    if (state.spices.length === 0) spices.push({type: "tip", text: "Zéro épice ? Même pas un tour de poivre ? Bon, c'est toi le patron."});
    var sauce = [];
    if (state.sauce === "Sans sauce") sauce.push({type: "tip", text: "Sans sauce ? Courageux. Ou t'as déjà ta propre sauce à la maison, on juge pas."});
    else if (vege && state.sauce === "Brabançonne") sauce.push({type: "alert", text: "Boulette végétale + Brabançonne (avec lardons) ? Fais pas le malin. Une version végétale de la sauce reste à valider."});
    var qty = [];
    if (!P && n >= 20) qty.push({type: "tip", text: n + " boulettes en particulier ? Soit c'est la fête, soit t'es pro et tu le dis pas."});
    return {
      meat: meat, garnish: garnish, herbs: herbs, spices: spices, sauce: sauce, qty: qty,
      pickup: [{type: "tip", text: PICKUP_TIP[state.pickup] || ""}]
    };
  }
  function canContinue(state, stepId) {
    if (stepId === "meat" || stepId === "check") return meatInfo(state).ok;
    return true;
  }
  function b64urlEncode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function b64urlDecode(s) {
    s = String(s).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function packState(state) {
    return {
      a: state.audience, b: state.base, p: state.preset, g: state.grams,
      n: state.garnish, h: state.herbs, s: state.spices, d: state.dose,
      u: state.sauce, q: state.qty, k: state.packs, r: state.pickup,
      e: state.noEgg ? 1 : 0, f: state.noGluten ? 1 : 0,
      z: state.proSauce ? 1 : 0, l: state.local ? 1 : 0,
      i: state.sig, m: state.name
    };
  }
  function encodeState(state) { return b64urlEncode(JSON.stringify(packState(state))); }
  function snapGrams(raw, base) {
    var allowed = {};
    (base === "Végétale" ? VEGE : MEATS).forEach(function (m) { allowed[m.k] = true; });
    var out = {};
    if (!raw || typeof raw !== "object") return out;
    Object.keys(raw).forEach(function (k) {
      if (!allowed[k]) return;
      var v = Math.max(0, Math.round((Number(raw[k]) || 0) / STEP) * STEP);
      if (v > 0 && v <= 60000) out[k] = v;
    });
    return out;
  }
  function decodeState(code) {
    if (!code || String(code).length > 12000) return null;
    try {
      var data = JSON.parse(b64urlDecode(code));
      var state = fresh();
      if (data.a === "Professionnel" || data.a === "Particulier") state.audience = data.a;
      if (data.b === "Végétale" || data.b === "Viande") state.base = data.b;
      state.preset = PRESETS[data.p] || data.p === "Je dose moi-même" ? data.p : state.preset;
      if (data.p === "Je dose moi-même" || PRESETS[data.p]) state.preset = data.p;
      state.grams = snapGrams(data.g, state.base);
      ["n", "h", "s"].forEach(function (key, idx) {
        var group = ["garnish", "herbs", "spices"][idx];
        var allowed = OPTIONS[group].map(function (o) { return o.v; });
        var max = group === "herbs" ? MAX_HERBS : group === "spices" ? MAX_SPICES : 99;
        if (Array.isArray(data[key])) {
          state[group] = data[key].filter(function (v) { return allowed.indexOf(v) > -1; }).slice(0, max);
        }
      });
      if (OPTIONS.dose.some(function (o) { return o.v === data.d; })) state.dose = data.d;
      if (OPTIONS.sauce.some(function (o) { return o.v === data.u; })) state.sauce = data.u;
      var qOk = qtyOptions(state).some(function (o) { return o.v === String(data.q); });
      state.qty = qOk ? String(data.q) : (pro(state) ? "50" : "2");
      state.packs = Math.max(1, Math.floor(Number(data.k) || 1));
      clampPacks(state);
      if (OPTIONS.pickup.some(function (o) { return o.v === data.r; })) state.pickup = data.r;
      state.noEgg = !!data.e;
      state.noGluten = !!data.f;
      state.proSauce = data.z !== 0;
      state.local = !!data.l && state.base !== "Végétale";
      state.sig = SIGS.some(function (s) { return s.n === data.i; }) ? data.i : null;
      state.name = String(data.m || state.sig || "Ma boulette").slice(0, 60);
      enforceDiet(state);
      return state;
    } catch (e) {
      return null;
    }
  }
  function sigBySlug(value) {
    var i = SIGS.findIndex(function (s) { return slug(s.n) === value || s.n === value; });
    return i;
  }
  function boxCountOk(box) { return box.picks.length >= Number(box.recipes); }
  function boxRows(box) {
    var need = Number(box.recipes), have = box.picks.length, per = Number(box.people) * 2;
    return [
      ["Nom", box.name || "Ma box"],
      ["Personnes", box.people],
      ["Recettes par box", String(need)],
      ["Rythme", box.rhythm],
      ["Signatures", have ? box.picks.join(", ") : "aucune"],
      ["Boulettes par recette", per + " × " + CAL + " g (indicatif)"],
      ["Total par box", (per * need) + " boulettes ≈ " + fmt(per * need * CAL)],
      ["Conditions d'abonnement", "à définir (démo)"]
    ];
  }
  function boxText(box) {
    return boxRows(box).map(function (r) { return r[0] + " : " + r[1]; }).join("\n");
  }
  function toggleBoxPick(box, name) {
    var i = box.picks.indexOf(name);
    if (i > -1) { box.picks.splice(i, 1); return null; }
    if (box.picks.length >= Number(box.recipes)) return "Ta box est pleine. Enlève une signature avant, gourmand.";
    box.picks.push(name);
    return null;
  }
  function setBoxField(box, key, value) {
    box[key] = value;
    if (key === "recipes" && box.picks.length > Number(value)) {
      box.picks = box.picks.slice(0, Number(value));
      return "On a retiré la dernière signature, ta box est plus petite.";
    }
    return null;
  }
  function encodeBox(box) { return b64urlEncode(JSON.stringify(box)); }
  function decodeBox(code) {
    if (!code || String(code).length > 4000) return null;
    try {
      var data = JSON.parse(b64urlDecode(code));
      var box = freshBox();
      if (BOX.people.some(function (o) { return o.v === String(data.people); })) box.people = String(data.people);
      if (BOX.recipes.some(function (o) { return o.v === String(data.recipes); })) box.recipes = String(data.recipes);
      if (BOX.rhythm.some(function (o) { return o.v === data.rhythm; })) box.rhythm = data.rhythm;
      var names = SIGS.map(function (s) { return s.n; });
      if (Array.isArray(data.picks)) {
        box.picks = data.picks.filter(function (n) { return names.indexOf(n) > -1; }).slice(0, Number(box.recipes));
      }
      box.name = String(data.name || "Ma box").slice(0, 60);
      return box;
    } catch (e) { return null; }
  }

  return {
    MAX_HERBS: MAX_HERBS, MAX_SPICES: MAX_SPICES, MAX_MEATS: MAX_MEATS, STEP: STEP, CAL: CAL,
    LIMITS: LIMITS, MEATS: MEATS, VEGE: VEGE, OPTIONS: OPTIONS, SAUCE_COL: SAUCE_COL,
    PRESETS: PRESETS, SIGS: SIGS, BOX: BOX,
    clone: clone, fresh: fresh, freshBox: freshBox, pro: pro, lim: lim, meatList: meatList,
    count: count, target: target, maxPacks: maxPacks, fmt: fmt, slug: slug, qtyOptions: qtyOptions,
    isOff: isOff, applyMix: applyMix, scaleToTarget: scaleToTarget, setGram: setGram, setPacks: setPacks,
    setQty: setQty, setAudience: setAudience, setBase: setBase, setPreset: setPreset, toggleMulti: toggleMulti,
    setFlag: setFlag, setSimple: setSimple, loadSignature: loadSignature, meatInfo: meatInfo,
    liantAlt: liantAlt, allergens: allergens, rows: rows, recapText: recapText, limitsLine: limitsLine,
    notes: notes, canContinue: canContinue, encodeState: encodeState, decodeState: decodeState,
    sigBySlug: sigBySlug, boxCountOk: boxCountOk, boxRows: boxRows, boxText: boxText,
    toggleBoxPick: toggleBoxPick, setBoxField: setBoxField, encodeBox: encodeBox, decodeBox: decodeBox,
    clearSig: clearSig, enforceDiet: enforceDiet
  };
});
