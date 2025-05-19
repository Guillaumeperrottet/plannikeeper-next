const CACHE_VERSION = "1.1.1"; // Augmenté pour forcer l'actualisation
const CACHE_NAME = `plannikeeper-cache-v${CACHE_VERSION}`;
const DATA_CACHE_NAME = `plannikeeper-data-v${CACHE_VERSION}`;

// Ressources à mettre en cache lors de l'installation
const STATIC_CACHE_URLS = [
  "/",
  "/offline",
  "/images/logo.png",
  "/manifest.json",
  "/icons/icon-96x96.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Installation du service worker avec gestion d'erreur améliorée
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Mise en cache individuelle pour mieux gérer les erreurs
        return Promise.allSettled(
          STATIC_CACHE_URLS.map((url) =>
            cache
              .add(url)
              .catch((err) =>
                console.warn(`Impossible de mettre en cache: ${url}`, err)
              )
          )
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error(
          "Erreur lors de l'installation du service worker:",
          error
        );
      })
  );
});

// Activation: nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                (cacheName.startsWith("plannikeeper-cache-") &&
                  cacheName !== CACHE_NAME) ||
                (cacheName.startsWith("plannikeeper-data-") &&
                  cacheName !== DATA_CACHE_NAME)
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
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("Erreur lors de l'activation du service worker:", error);
      })
  );
});

// UN SEUL gestionnaire fetch avec gestion d'erreur améliorée
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Éviter de traiter les requêtes de navigateur non nécessaires
  if (
    event.request.cache === "only-if-cached" &&
    event.request.mode !== "same-origin"
  ) {
    return;
  }

  try {
    // Pour les requêtes API, utiliser Network First, Store in Cache
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(networkFirstWithBackup(event.request));
      return;
    }

    // Pour les ressources statiques, utiliser Cache First
    if (
      event.request.method === "GET" &&
      (url.pathname.startsWith("/images/") ||
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff2)$/) ||
        url.pathname === "/" ||
        url.pathname === "/favicon.ico")
    ) {
      event.respondWith(cacheFirst(event.request));
      return;
    }

    // Pour toute autre requête, utiliser Network First
    event.respondWith(networkFirst(event.request));
  } catch (error) {
    console.error("Erreur dans le gestionnaire fetch:", error);
  }
});

// Stratégie Cache First avec fallback sur réseau
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si non trouvé dans le cache, essayer le réseau
    const networkResponse = await fetch(request);
    // Mettre à jour le cache avec la nouvelle réponse
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.warn(`Erreur dans cacheFirst pour ${request.url}:`, error);

    // En cas d'erreur réseau, essayer de retourner une page offline
    if (request.mode === "navigate") {
      const cache = await caches.open(CACHE_NAME);
      const offlineResponse = await cache.match("/offline");
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // Si tout échoue, renvoyer une réponse d'erreur
    return new Response("Erreur réseau, contenu non disponible", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Stratégie Network First avec stockage en cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Mettre à jour le cache avec la nouvelle réponse
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // En cas d'erreur réseau, essayer le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si pas en cache et mode navigation, retourner la page offline
    if (request.mode === "navigate") {
      const cache = await caches.open(CACHE_NAME);
      return cache.match("/offline");
    }

    throw error;
  }
}

// Stratégie spécifique pour les API: Network First, mais avec invalidation automatique
async function networkFirstWithBackup(request) {
  const url = new URL(request.url);

  try {
    // Essayer d'abord le réseau
    const networkResponse = await fetch(request);

    // Ne mettre en cache que les GET (pas les mutations)
    if (request.method === "GET") {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());

      // Si la réponse est une mise à jour de données, notifier les clients
      if (networkResponse.ok) {
        notifyClientsOfDataChange(url.pathname);
      }
    } else if (
      request.method === "POST" ||
      request.method === "PUT" ||
      request.method === "DELETE"
    ) {
      // Pour les mutations, invalider les caches correspondants
      invalidateRelatedCaches(url.pathname);
    }

    return networkResponse;
  } catch (error) {
    console.warn("Network request failed, falling back to cache", error);

    // En cas d'erreur réseau, essayer le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Aucune donnée disponible
    return new Response(
      JSON.stringify({ error: "Network error, no cached data available" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Invalider les caches liés à une ressource modifiée
async function invalidateRelatedCaches(pathname) {
  // Extraire le type de ressource du chemin d'accès
  const matches = {
    task: pathname.includes("/tasks/"),
    article: pathname.includes("/articles/"),
    object: pathname.includes("/objet/"),
    sector: pathname.includes("/sectors/"),
  };

  const cache = await caches.open(DATA_CACHE_NAME);
  const keys = await cache.keys();

  // Invalider les caches correspondants
  const keysToDelete = keys.filter((request) => {
    const url = new URL(request.url);

    // Invalider les listes de tâches si une tâche est modifiée
    if (matches.task && url.pathname.includes("/api/tasks")) {
      return true;
    }

    // Invalider les listes d'articles si un article est modifié
    if (matches.article && url.pathname.includes("/api/articles")) {
      return true;
    }

    // Invalider les données d'objet si un objet est modifié
    if (matches.object && url.pathname.includes("/api/objet")) {
      return true;
    }

    // Invalider les données de secteur si un secteur est modifié
    if (matches.sector && url.pathname.includes("/api/sectors")) {
      return true;
    }

    return false;
  });

  // Supprimer les entrées de cache
  await Promise.all(keysToDelete.map((key) => cache.delete(key)));

  // Notifier les clients du changement
  notifyClientsOfDataChange(pathname);
}

// Notifier tous les clients qu'un changement de données a eu lieu
async function notifyClientsOfDataChange(pathname) {
  const clients = await self.clients.matchAll({ type: "window" });

  // Déterminer le type d'événement en fonction du chemin
  let eventType = "data-change";

  if (pathname.includes("/tasks/")) {
    eventType = "task-change";
  } else if (pathname.includes("/articles/")) {
    eventType = "article-change";
  } else if (pathname.includes("/objet/")) {
    eventType = "object-change";
  } else if (pathname.includes("/sectors/")) {
    eventType = "sector-change";
  }

  clients.forEach((client) => {
    client.postMessage({
      type: eventType,
      path: pathname,
      timestamp: Date.now(),
    });
  });
}

// Gestion des messages avec promesses correctement résolues
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.action === "clearCache") {
    event.waitUntil(
      clearAllCaches()
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ result: "success" });
          }
        })
        .catch((error) => {
          console.error("Erreur lors du nettoyage du cache:", error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              result: "error",
              error: error.message,
            });
          }
        })
    );
    return;
  }

  if (event.data && event.data.action === "invalidateCache") {
    const { pathname } = event.data;
    event.waitUntil(
      invalidateRelatedCaches(pathname)
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ result: "success" });
          }
        })
        .catch((error) => {
          console.error("Erreur lors de l'invalidation du cache:", error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              result: "error",
              error: error.message,
            });
          }
        })
    );
    return;
  }
});

// Utilitaire pour effacer tous les caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames
      .filter((name) => name.startsWith("plannikeeper-"))
      .map((name) => caches.delete(name))
  );
}

// Gérer les notifications push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    // Options de notification
    const options = {
      body: data.message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-icon.png",
      data: {
        url: data.url || "/",
        actionType: data.actionType,
      },
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("Erreur lors du traitement de la notification push:", error);
  }
});

// Gérer le clic sur les notifications
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Identifier l'action cliquée ou utiliser l'URL par défaut
  const url =
    event.action === "viewDetails" && event.notification.data.detailsUrl
      ? event.notification.data.detailsUrl
      : event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Si une fenêtre existe déjà, la focaliser et y naviguer
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }

      // Sinon, ouvrir une nouvelle fenêtre
      return clients.openWindow(url);
    })
  );
});

// Gérer la synchronisation en arrière-plan
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-actions") {
    event.waitUntil(syncPendingActions());
  }
});

// Fonction pour synchroniser les actions en attente
async function syncPendingActions() {
  // Cette fonction serait implémentée pour traiter les données en IndexedDB
  // et effectuer les requêtes API en attente
  console.log("Synchronisation des actions en attente");
  // Voir lib/offline-sync.ts pour l'implémentation
}

// Stratégie de cache améliorée dans public/sw.js
self.addEventListener("fetch", function (event) {
  // Stratégie cache-first pour les assets statiques
  if (event.request.url.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        return (
          response ||
          fetch(event.request).then(function (fetchResponse) {
            return caches.open("plannikeeper-static-v1").then(function (cache) {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          })
        );
      })
    );
  } else {
    // Stratégie network-first pour les API
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(event.request);
      })
    );
  }
});
