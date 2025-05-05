// src/app/components/NotificationsPanel.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { fr } from "date-fns/locale";
import { Bell, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationData = {
  taskId?: string;
  taskName?: string;
  objectName?: string;
  sectorName?: string;
  articleTitle?: string;
  assignerName?: string;
};

type Notification = {
  id: number;
  type: string;
  content: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
  task?: {
    id: string;
    name: string;
    article: {
      id: string;
      title: string;
      sector: {
        id: string;
        name: string;
        object: {
          id: string;
          nom: string;
        };
      };
    };
  } | null;
  data?: NotificationData;
};

interface NotificationsPanelProps {
  onClose: () => void;
  onNotificationsRead: () => void;
}

export default function NotificationsPanel({
  onClose,
  onNotificationsRead,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Ajouter un event listener pour fermer le panneau quand on clique à l'extérieur
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10");

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/mark-read`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications(
          notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        onNotificationsRead();
      }
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications(
          notifications.map((notification) => ({
            ...notification,
            read: true,
          }))
        );
        onNotificationsRead();
      }
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Rediriger si un lien est fourni
    if (notification.link) {
      router.push(notification.link);
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <span className="text-[color:var(--primary)]">📋</span>;
      case "TASK_COMPLETED":
        return (
          <span className="text-[color:var(--success-foreground)]">✅</span>
        );
      case "COMMENT_ADDED":
        return <span className="text-[color:var(--info-foreground)]">💬</span>;
      default:
        return (
          <Bell className="h-4 w-4 text-[color:var(--muted-foreground)]" />
        );
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-hidden bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg z-50"
    >
      <div className="p-3 border-b border-[color:var(--border)] flex justify-between items-center bg-[color:var(--muted)]">
        <h3 className="font-medium text-[color:var(--foreground)]">
          Notifications
        </h3>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            Tout marquer comme lu
          </button>
          <button
            onClick={onClose}
            className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[60vh]">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)]"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-[color:var(--muted-foreground)]">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--muted)] transition-colors cursor-pointer ${
                  !notification.read
                    ? "bg-[color:var(--info-background)]/10"
                    : ""
                }`}
              >
                <div
                  className="p-3 flex gap-3"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[color:var(--muted)]">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[color:var(--foreground)] mb-1">
                      {notification.content}
                    </p>

                    {/* Afficher les informations détaillées de la tâche */}
                    {notification.data && notification.data.objectName && (
                      <div className="text-xs text-[color:var(--muted-foreground)] space-y-1 mt-1">
                        {notification.data.taskName && (
                          <p className="flex items-center gap-1">
                            <span className="font-medium">Tâche:</span>
                            {notification.data.taskName}
                          </p>
                        )}
                        <p className="flex items-center gap-1">
                          <span className="font-medium">Objet:</span>
                          {notification.data.objectName}
                        </p>
                        {notification.data.assignerName && (
                          <p className="flex items-center gap-1">
                            <span className="font-medium">Assignée par:</span>
                            {notification.data.assignerName}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      className="flex-shrink-0 text-[color:var(--primary)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Marquer comme lu"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-2 border-t border-[color:var(--border)] text-center">
        <a
          href="/profile/notifications"
          className="text-xs text-[color:var(--primary)] hover:underline"
          onClick={() => onClose()}
        >
          Voir toutes les notifications
        </a>
      </div>
    </div>
  );
}
