// Service Worker pour PlanniKeeper
// Ce service worker gère la mise en cache des ressources statiques,
// la synchronisation en arrière-plan et les notifications push.
// Il est conçu pour fonctionner avec une application web progressive (PWA).

const CACHE_VERSION = "1.0.0";
const CACHE_NAME = `plannikeeper-cache-v${CACHE_VERSION}`;

// Ressources à mettre en cache lors de l'installation
const STATIC_CACHE_URLS = [
  "/",
  "/dashboard",
  "/offline", // Créez une page offline pour une meilleure expérience
  // CSS, JS, images et autres ressources statiques
  "/images/logo.png",
];

// Installation du service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installation en cours");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Mise en cache des ressources statiques");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Force l'activation immédiate du service worker
        return self.skipWaiting();
      })
  );
});

// Activation: nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activation en cours");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Supprimer les anciens caches
              return (
                cacheName.startsWith("plannikeeper-cache-") &&
                cacheName !== CACHE_NAME
              );
            })
            .map((cacheName) => {
              console.log(
                "Service Worker: Suppression de l'ancien cache",
                cacheName
              );
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Prendre le contrôle immédiatement des clients
        return self.clients.claim();
      })
  );
});

// Stratégie de mise en cache: Network First pour les API, Cache First pour les ressources statiques
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les requêtes pour les API qui ne doivent pas être mises en cache
  if (url.pathname.startsWith("/api/")) {
    // Laisser le navigateur gérer normalement ces requêtes
    // On pourrait aussi implémenter une stratégie network-first spécifique ici
    return;
  }

  // Stratégie Cache First pour les ressources statiques
  if (
    event.request.method === "GET" &&
    (url.pathname.startsWith("/images/") ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/" ||
      url.pathname === "/favicon.ico")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Retourner la réponse du cache
          return cachedResponse;
        }

        // Sinon, faire la requête réseau et mettre en cache
        return fetch(event.request)
          .then((networkResponse) => {
            // Vérifier que la requête a réussi
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {
              return networkResponse;
            }

            // Mise en cache de la nouvelle ressource
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // En cas d'erreur réseau, retourner une page offline
            if (event.request.mode === "navigate") {
              return caches.match("/offline");
            }

            // Ou une image par défaut pour les requêtes d'images
            if (event.request.destination === "image") {
              return caches.match("/images/offline-image.png");
            }

            // Sinon, propager l'erreur
            return new Response("Connexion perdue", {
              status: 503,
              statusText: "Service Unavailable",
              headers: new Headers({
                "Content-Type": "text/plain",
              }),
            });
          });
      })
    );
    return;
  }

  // Pour les autres requêtes: stratégie network first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si on navigue vers une page et qu'elle n'est pas en cache
        if (event.request.mode === "navigate") {
          return caches.match("/offline");
        }

        // Sinon, propager l'erreur
        throw new Error(
          "Pas de connexion réseau et ressource non disponible dans le cache"
        );
      });
    })
  );
});

// Gérer les mises à jour des ressources en cache (background sync)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-updates") {
    event.waitUntil(syncUpdates());
  }
});

// Fonction pour synchroniser les mises à jour en attente
async function syncUpdates() {
  try {
    // Récupérer les mises à jour en attente depuis IndexedDB ou localStorage
    const pendingUpdates = await getPendingUpdates();

    // Traiter chaque mise à jour
    for (const update of pendingUpdates) {
      await processUpdate(update);
    }

    // Nettoyer les mises à jour traitées
    await clearProcessedUpdates(pendingUpdates);

    return true;
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
    return false;
  }
}

// Ces fonctions seraient à implémenter selon votre système de stockage
function getPendingUpdates() {
  // Récupérer depuis IndexedDB ou localStorage
  return Promise.resolve([]);
}

function processUpdate() {
  // Traiter la mise à jour (requête fetch vers votre API)
  return Promise.resolve();
}

function clearProcessedUpdates() {
  // Nettoyer les mises à jour traitées
  return Promise.resolve();
}

// Gérer les notifications push
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.message,
    icon: "/images/notification-icon.png",
    badge: "/images/badge-icon.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Gérer le clic sur les notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url));
});
