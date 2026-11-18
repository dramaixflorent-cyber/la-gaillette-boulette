/* Laboulette — cache hors ligne de l'appli. */
var CACHE = "laboulette-app-v4";
var ASSETS = [
  "./",
  "./index.html",
  "./installer.html",
  "./manifest.webmanifest",
  "./qr-install.svg",
  "./css/app.css",
  "./js/logic.js",
  "./js/app.js",
  "./js/install.js",
  "./fonts/lilita.woff2",
  "./fonts/bungee.woff2",
  "./icons/favicon.ico",
  "./icons/favicon.svg",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "../logo/couleur-fond-fonce/laboulette_horizontal_couleur-fond-fonce.svg",
  "../logo/couleur/laboulette_symbole_couleur.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS.map(function (path) { return new URL(path, self.location).href; }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req, {ignoreSearch: true}).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === "navigate") return caches.match("./index.html");
        return new Response("", {status: 504, statusText: "Hors ligne"});
      });
    })
  );
});
