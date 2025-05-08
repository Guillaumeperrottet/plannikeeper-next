// Cette fonction est appelée lors de l'installation du Service Worker
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("plannikeeper-v1").then(function (cache) {
      return cache.addAll([
        "/",
        "/dashboard",
        "/offline.html", // Page à afficher hors ligne
        "/manifest.json",
        "/logo.png",
        // Ajoutez ici d'autres ressources à mettre en cache
      ]);
    })
  );
});

// Répondre aux requêtes réseau d'abord, puis tomber sur le cache si le réseau échoue
self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request).then(function (response) {
        // Si l'élément est dans le cache, le retourner, sinon retourner la page offline
        return response || caches.match("/offline.html");
      });
    })
  );
});
