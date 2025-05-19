// src/hooks/useData.tsx
import useSWR from "swr";
import { Notification, NotificationsResponse } from "@/types/index";

class FetchError extends Error {
  info?: unknown;
  status?: number;

  constructor(message: string, status?: number, info?: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.info = info;
  }
}

// Fetcher amélioré qui respecte les en-têtes de cache
const fetcher = async (url: string) => {
  // Vérifier si nous avons des données en cache local pour ce URL
  const cachedData = getCachedData(url);

  // Si nous avons des données en cache et un ETag, l'utiliser
  const headers: HeadersInit = {};
  if (cachedData && cachedData.etag) {
    headers["If-None-Match"] = cachedData.etag;
  }

  // Effectuer la requête avec les en-têtes appropriés
  const response = await fetch(url, { headers });

  // Si le serveur répond 304 Not Modified, utiliser les données en cache
  if (response.status === 304 && cachedData) {
    return cachedData.data;
  }

  // En cas d'erreur autre que 304
  if (!response.ok) {
    const info = await response.json().catch(() => null);
    throw new FetchError(
      `Erreur ${response.status}: ${response.statusText}`,
      response.status,
      info
    );
  }

  // Récupérer les données
  const data = await response.json();

  // Obtenir l'ETag s'il existe
  const etag = response.headers.get("ETag");

  // Mettre en cache les données avec l'ETag
  if (etag) {
    setCachedData(url, data, etag);
  }

  return data;
};

// Stockage local pour les données mises en cache
function setCachedData(key: string, data: unknown, etag: string): void {
  try {
    localStorage.setItem(
      `pk_cache_${key}`,
      JSON.stringify({
        data,
        etag,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn("Erreur lors de la mise en cache local:", e);
  }
}

function getCachedData(
  key: string,
  maxAge = 3600000
): { data: unknown; etag: string } | null {
  try {
    const item = localStorage.getItem(`pk_cache_${key}`);
    if (!item) return null;

    const { data, etag, timestamp } = JSON.parse(item);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      localStorage.removeItem(`pk_cache_${key}`);
      return null;
    }

    return { data, etag };
  } catch {
    return null;
  }
}

// Cache persistant pour des données importantes
const persistCache = (key: string, data: unknown) => {
  try {
    localStorage.setItem(
      `pk_cache_${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn("Erreur lors de la mise en cache persistant:", e);
  }
};

const getPersistedCache = (key: string, maxAge = 3600000) => {
  try {
    const item = localStorage.getItem(`pk_cache_${key}`);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      localStorage.removeItem(`pk_cache_${key}`);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

// Hook pour les objets immobiliers - Configuration SWR améliorée
export function useObjects() {
  return useSWR("/api/objet", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 300000, // 5 minutes
    dedupingInterval: 60000, // 1 minute - éviter les requêtes dupliquées
    onSuccess: (data) => persistCache("objects", data),
    fallbackData: getPersistedCache("objects"),
    // Ces deux options respectent les directives du cache HTTP
    revalidateIfStale: true,
    revalidateOnMount: true,
  });
}

// Hook pour un objet spécifique - avec mise à jour optimisée
export function useObject(id: string | null) {
  return useSWR(id ? `/api/objet/${id}` : null, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 0, // Pas de rafraîchissement automatique
    dedupingInterval: 30000, // 30 secondes
    onSuccess: (data) => persistCache(`object_${id}`, data),
    fallbackData: getPersistedCache(`object_${id}`),
    // Respecter les directives du cache HTTP
    revalidateIfStale: true,
  });
}

// Hook pour les secteurs d'un objet - avec mise à jour optimisée
export function useSectors(objectId: string | null) {
  return useSWR(objectId ? `/api/sectors/${objectId}` : null, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 0,
    dedupingInterval: 30000, // 30 secondes
    onSuccess: (data) => persistCache(`sectors_${objectId}`, data),
    fallbackData: getPersistedCache(`sectors_${objectId}`),
    // Respecter les directives du cache HTTP
    revalidateIfStale: true,
  });
}

// Hook pour les articles d'un secteur - optimisé
export function useArticles(sectorId: string | null) {
  return useSWR(
    sectorId ? `/api/sectors/${sectorId}/articles` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000, // 30 secondes
      // Caching local pour améliorer les performances
      onSuccess: (data) => persistCache(`articles_${sectorId}`, data),
      fallbackData: getPersistedCache(`articles_${sectorId}`),
    }
  );
}

// Hook pour les tâches - avec gestion améliorée du cache et des mises à jour
export function useTasks(objectId: string | null) {
  const { data, error, mutate } = useSWR(
    objectId ? `/api/tasks/object/${objectId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Réduire à 30 secondes pour les tâches
      dedupingInterval: 5000, // Réduire l'intervalle de déduplication
      onSuccess: (data) => persistCache(`tasks_${objectId}`, data),
      fallbackData: getPersistedCache(`tasks_${objectId}`, 60000), // Cache plus court (1 minute)

    }
  );

  // Ajouter une fonction d'invalidation de cache
  const invalidateCache = () => {
    // Supprimer le cache local
    try {
      localStorage.removeItem(`pk_cache_tasks_${objectId}`);
    } catch (e) {
      console.warn("Erreur lors de la suppression du cache:", e);
    }

    // Revalider les données
    mutate();
  };

  return {
    tasks: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
    invalidateCache,
  };
}

// Hook pour une tâche spécifique avec tous les détails
export function useTask(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}` : null, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 15000, // 15 secondes
    onSuccess: (data) => persistCache(`task_${taskId}`, data),
    fallbackData: getPersistedCache(`task_${taskId}`, 30000), // Cache court (30sec)
  });
}

// Hook pour les documents d'une tâche
export function useTaskDocuments(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}/documents` : null, fetcher, {
    dedupingInterval: 30000, // 30 secondes
    onSuccess: (data) => persistCache(`task_documents_${taskId}`, data),
    fallbackData: getPersistedCache(`task_documents_${taskId}`),
  });
}

// Hook pour les commentaires d'une tâche
export function useTaskComments(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}/comments` : null, fetcher, {
    refreshInterval: 15000, // 15 secondes, pour voir les nouveaux commentaires rapidement
    dedupingInterval: 5000, // 5 secondes
    onSuccess: (data) => persistCache(`task_comments_${taskId}`, data),
    fallbackData: getPersistedCache(`task_comments_${taskId}`, 15000), // Cache très court (15sec)
  });
}

// Hook pour les notifications - Ajout des types explicites
export function useNotifications(limit = 10, unreadOnly = false) {
  const url = `/api/notifications?limit=${limit}${unreadOnly ? "&unread=true" : ""}`;
  // Spécifier explicitement le type de retour de useSWR
  const { data, error, mutate } = useSWR<NotificationsResponse>(url, fetcher, {
    refreshInterval: 30000, // 30 secondes
    dedupingInterval: 10000, // 10 secondes
    // Cache court pour notifications (données changeantes)
    onSuccess: (data) =>
      persistCache(`notifications_${limit}_${unreadOnly}`, data),
    fallbackData: getPersistedCache(
      `notifications_${limit}_${unreadOnly}`,
      15000
    ), // 15 secondes
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: "POST",
      });

      // Mise à jour optimiste du cache avec typage explicite
      mutate(
        data
          ? {
              ...data,
              notifications: data.notifications.map((n: Notification) =>
                n.id === notificationId ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, data.unreadCount - 1),
            }
          : data,
        false
      );

      // Revalider pour confirmer le changement
      mutate();
    } catch (err) {
      console.error("Erreur lors du marquage de la notification:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      // Mise à jour optimiste du cache avec typage explicite
      mutate(
        data
          ? {
              ...data,
              notifications: data.notifications.map((n: Notification) => ({
                ...n,
                read: true,
              })),
              unreadCount: 0,
            }
          : data,
        false
      );

      // Revalider pour confirmer le changement
      mutate();
    } catch (err) {
      console.error(
        "Erreur lors du marquage de toutes les notifications:",
        err
      );
    }
  };

  // Retour explicitement typé
  return {
    notifications: (data?.notifications || []) as Notification[],
    unreadCount: data?.unreadCount || 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}

// Hook pour gérer les limites d'abonnement
export function useSubscriptionLimits() {
  const { data: objectLimits, error: objectError } = useSWR(
    "/api/limits/objects",
    fetcher,
    {
      dedupingInterval: 60000, // 1 minute
      onSuccess: (data) => persistCache("object_limits", data),
      fallbackData: getPersistedCache("object_limits"),
    }
  );

  const { data: userLimits, error: userError } = useSWR(
    "/api/limits/users",
    fetcher,
    {
      dedupingInterval: 60000, // 1 minute
      onSuccess: (data) => persistCache("user_limits", data),
      fallbackData: getPersistedCache("user_limits"),
    }
  );

  return {
    objectLimits,
    userLimits,
    isLoading: (!objectLimits && !objectError) || (!userLimits && !userError),
    isError: objectError || userError,
  };
}

// Ajoutons une fonction utilitaire pour invalider les caches par préfixe
// Utile lorsqu'une action impacte plusieurs ressources liées
export function invalidateCachesByPrefix(prefix: string) {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`pk_cache_${prefix}`)) {
        keysToRemove.push(key);
      }
    }

    // Supprimer les clés trouvées
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Erreur lors de l'invalidation du cache:", e);
  }
}

// Fonction pour invalider tous les caches liés à un objet
export function invalidateObjectCaches(objectId: string) {
  invalidateCachesByPrefix(`object_${objectId}`);
  invalidateCachesByPrefix(`tasks_${objectId}`);
  invalidateCachesByPrefix(`sectors_${objectId}`);
}

// Fonction pour invalider tous les caches liés à un secteur
export function invalidateSectorCaches(sectorId: string) {
  invalidateCachesByPrefix(`sector_${sectorId}`);
  invalidateCachesByPrefix(`articles_${sectorId}`);
}

// Fonction pour invalider tous les caches liés à une tâche
export function invalidateTaskCaches(taskId: string) {
  invalidateCachesByPrefix(`task_${taskId}`);
  invalidateCachesByPrefix(`task_documents_${taskId}`);
  invalidateCachesByPrefix(`task_comments_${taskId}`);
}

// Fonction pour invalider tous les caches
export function invalidateAllCaches() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("pk_cache_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Erreur lors de l'invalidation de tous les caches:", e);
  }
}
