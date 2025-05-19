// Service Worker - Version améliorée
// public/service-worker.js

// Configuration du cache
const CACHE_NAME = "plannikeeper-cache-v1";
const OFFLINE_URL = "/offline";
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/favicon.ico",
  "/manifest.json",
  "/images/logo.png",
];

// Installation du Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Ouverture du cache et préchargement des ressources");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Forcer l'activation immédiate
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener("activate", (event) => {
  // Nettoyer les anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log("Suppression de l'ancien cache", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
});

// Stratégie de mise en cache : Network First, fallback to cache
self.addEventListener("fetch", (event) => {
  // Ne pas intercepter les requêtes non GET ou les requêtes d'API
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("chrome-extension") ||
    event.request.url.startsWith("chrome-extension")
  ) {
    return;
  }

  // Stratégie pour les requêtes de navigation (HTML)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Copier la réponse pour la mettre en cache
          const clonedResponse = response.clone();

          // Mise en cache asynchrone sans attendre
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });

          return response;
        })
        .catch(() => {
          // En cas d'échec de la requête réseau, essayer le cache
          return caches.match(event.request).then((cachedResponse) => {
            // Si c'est dans le cache, on le renvoie
            if (cachedResponse) {
              return cachedResponse;
            }
            // Sinon, on renvoie la page offline
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Stratégie pour les autres ressources (CSS, JS, images, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Vérifier si la réponse est valide
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Copier la réponse, car elle ne peut être consommée qu'une fois
        const responseToCache = response.clone();

        // Mise en cache sans bloquer
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Si la requête réseau échoue, on essaie le cache
        return caches.match(event.request);
      })
  );
});

// Gestion des messages de l'application
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Gestion des notifications push
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.message || "Nouvelle notification",
      icon: "/images/logo.png",
      badge: "/images/badge.png",
      data: {
        url: data.url || "/",
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "PlanniKeeper", options)
    );
  }
});

// Gestion du clic sur les notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // Si une fenêtre est déjà ouverte, la focaliser et naviguer
      for (const client of windowClients) {
        if (client.url && "focus" in client) {
          client.focus();
          if (event.notification.data && event.notification.data.url) {
            client.navigate(event.notification.data.url);
          }
          return;
        }
      }

      // Sinon, ouvrir une nouvelle fenêtre
      if (event.notification.data && event.notification.data.url) {
        clients.openWindow(event.notification.data.url);
      } else {
        clients.openWindow("/");
      }
    })
  );
});
