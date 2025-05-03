// src/app/components/notification-provider.tsx
"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  requestNotificationPermission,
  setupMessageListeners,
} from "@/lib/firebase";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useCallback } from "react";

interface NotificationContextType {
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  hasPermission: null,
  requestPermission: async () => false,
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  userId: string;
  children: ReactNode;
}

export function NotificationProvider({
  userId,
  children,
}: NotificationProviderProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  interface NotificationPayload {
    notification?: {
      title?: string;
      body?: string;
    };
    data?: {
      link?: string;
      [key: string]: unknown;
    };
  }

  const displayNotificationToast = useCallback(
    (payload: NotificationPayload) => {
      if (!payload.notification?.title || !payload.notification?.body) return;

      const { notification, data } = payload;

      toast.custom((t) => (
        <div
          className="max-w-md w-full bg-[color:var(--card)] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5"
          onClick={() => {
            if (data?.link) {
              window.location.href = data.link;
            }
            toast.dismiss(t);
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-[color:var(--primary)]/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-[color:var(--primary)]" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  {notification.body}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-[color:var(--border)]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] focus:outline-none"
            >
              Fermer
            </button>
          </div>
        </div>
      ));
    },
    []
  );

  useEffect(() => {
    // Vérifier l'état des permissions
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }

    // Vérifier les notifications non lues
    fetchUnreadCount();

    // Configurer l'écouteur pour les notifications
    setupMessageListeners((payload) => {
      // Afficher un toast pour les notifications reçues
      displayNotificationToast(payload);

      // Actualiser le compteur
      fetchUnreadCount();
    });

    // Actualiser le compteur toutes les minutes
    const interval = setInterval(fetchUnreadCount, 60000);

    // Configurer l'écouteur d'événements personnalisé pour les nouvelles notifications
    window.addEventListener("new-notification", fetchUnreadCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("new-notification", fetchUnreadCount);
    };
  }, [userId, displayNotificationToast]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unread=true&limit=1");
      const data = await response.json();

      if (response.ok) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error("Votre navigateur ne prend pas en charge les notifications");
      return false;
    }

    try {
      const token = await requestNotificationPermission();
      const granted = !!token;
      setHasPermission(granted);

      if (granted) {
        toast.success("Les notifications sont maintenant activées");
      } else {
        toast.error("Les notifications ont été bloquées");
      }

      return granted;
    } catch (error) {
      console.error("Erreur lors de la demande de permission:", error);
      toast.error(
        "Une erreur est survenue lors de l'activation des notifications"
      );
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        hasPermission,
        requestPermission,
        unreadCount,
        refreshUnreadCount: fetchUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
