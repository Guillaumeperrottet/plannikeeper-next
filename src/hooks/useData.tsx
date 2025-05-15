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

// Fetcher avec une meilleure gestion d'erreur
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const info = await response.json().catch(() => null);
    throw new FetchError(
      `Erreur ${response.status}: ${response.statusText}`,
      response.status,
      info
    );
  }
  return response.json();
};

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

// Hook pour les objets immobiliers
export function useObjects() {
  return useSWR("/api/objet", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 300000, // 5 minutes
    onSuccess: (data) => persistCache("objects", data),
    fallbackData: getPersistedCache("objects"),
  });
}

// Hook pour un objet spécifique
export function useObject(id: string | null) {
  return useSWR(id ? `/api/objet/${id}` : null, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 0, // Pas de rafraîchissement automatique
    onSuccess: (data) => persistCache(`object_${id}`, data),
    fallbackData: getPersistedCache(`object_${id}`),
  });
}

// Hook pour les secteurs d'un objet
export function useSectors(objectId: string | null) {
  return useSWR(objectId ? `/api/sectors/${objectId}` : null, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 0,
    onSuccess: (data) => persistCache(`sectors_${objectId}`, data),
    fallbackData: getPersistedCache(`sectors_${objectId}`),
  });
}

// Hook pour les articles d'un secteur
export function useArticles(sectorId: string | null) {
  return useSWR(
    sectorId ? `/api/sectors/${sectorId}/articles` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );
}

// Hook pour les tâches
export function useTasks(objectId: string | null) {
  const { data, error, mutate } = useSWR(
    objectId ? `/api/tasks/object/${objectId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Réduire à 30 secondes pour les tâches
      dedupingInterval: 5000, // Réduire l'intervalle de déduplication
    }
  );

  // Ajouter une fonction d'invalidation de cache
  const invalidateCache = () => {
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
  });
}

// Hook pour les documents d'une tâche
export function useTaskDocuments(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}/documents` : null, fetcher);
}

// Hook pour les commentaires d'une tâche
export function useTaskComments(taskId: string | null) {
  return useSWR(taskId ? `/api/tasks/${taskId}/comments` : null, fetcher, {
    refreshInterval: 15000, // 15 secondes, pour voir les nouveaux commentaires rapidement
  });
}

// Hook pour les notifications - Ajout des types explicites
export function useNotifications(limit = 10, unreadOnly = false) {
  const url = `/api/notifications?limit=${limit}${unreadOnly ? "&unread=true" : ""}`;
  // Spécifier explicitement le type de retour de useSWR
  const { data, error, mutate } = useSWR<NotificationsResponse>(url, fetcher, {
    refreshInterval: 30000, // 30 secondes
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
    fetcher
  );
  const { data: userLimits, error: userError } = useSWR(
    "/api/limits/users",
    fetcher
  );

  return {
    objectLimits,
    userLimits,
    isLoading: (!objectLimits && !objectError) || (!userLimits && !userError),
    isError: objectError || userError,
  };
}
