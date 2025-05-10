"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { fr } from "date-fns/locale";
import { Bell, Check, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "./notification-provider";
import { motion, AnimatePresence } from "framer-motion";

// Types comme avant...
type Notification = {
  id: number;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: {
    objectName?: string;
    taskName?: string;
    assignerName?: string;
  };
  task?: {
    id: number;
    article: {
      id: number;
      sector: {
        id: number;
        object: {
          id: number;
        };
      };
    };
  };
  link?: string;
};

type NotificationsPanelProps = {
  onClose: () => void;
  onNotificationsRead: () => void;
};

export default function NotificationsPanel({
  onClose,
  onNotificationsRead,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const { refreshUnreadCount } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<number[]>(
    []
  );
  const [markingAsRead, setMarkingAsRead] = useState<Record<number, boolean>>(
    {}
  );

  // Animation variants
  const notificationVariants = {
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      marginBottom: "1px",
      transition: {
        opacity: { duration: 0.3 },
        height: { duration: 0.3 },
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      transition: {
        opacity: { duration: 0.2 },
        height: { duration: 0.3 },
      },
    },
  };

  // Panel animations
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  // Fetch notifications de manière indépendante
  const fetchNotifications = useCallback(async (showRefreshing = true) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/notifications?limit=10");

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Rafraîchir manuellement les notifications
  const handleRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Appeler fetch au montage
  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Mettre à jour la liste des notifications visibles quand notifications change
  useEffect(() => {
    const unreadNotifications = notifications
      .filter((n) => !n.read)
      .map((n) => n.id);
    setVisibleNotifications(unreadNotifications);
  }, [notifications]);

  // La fonction markAsRead définie une seule fois avec useCallback
  const markAsRead = useCallback(
    async (notificationId: number, updateUI: boolean = true) => {
      try {
        if (updateUI) {
          // Commencer l'animation de "marquage comme lu"
          setMarkingAsRead((prev) => ({ ...prev, [notificationId]: true }));
        }

        const response = await fetch(
          `/api/notifications/${notificationId}/mark-read`,
          { method: "POST" }
        );

        if (response.ok) {
          if (updateUI) {
            // Après un court délai pour l'animation, mettre à jour l'état
            setTimeout(() => {
              setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                  notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
                )
              );

              setVisibleNotifications((prev) =>
                prev.filter((id) => id !== notificationId)
              );

              setMarkingAsRead((prev) => ({
                ...prev,
                [notificationId]: false,
              }));

              refreshUnreadCount();
              onNotificationsRead();
            }, 300); // Délai correspondant à la durée de l'animation
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error("Erreur lors du marquage de la notification:", error);
        if (updateUI) {
          setMarkingAsRead((prev) => ({ ...prev, [notificationId]: false }));
        }
        return false;
      }
    },
    [refreshUnreadCount, onNotificationsRead]
  );

  // Fonction markVisibleNotificationsAsRead améliorée pour gérer les animations
  const markVisibleNotificationsAsRead = useCallback(async () => {
    if (visibleNotifications.length === 0) return;

    try {
      // Animer toutes les notifications non lues pour montrer qu'elles sont marquées comme lues
      visibleNotifications.forEach((id) => {
        setMarkingAsRead((prev) => ({ ...prev, [id]: true }));
      });

      // Court délai pour laisser l'animation se produire
      setTimeout(() => {
        // Mettre à jour localement l'état des notifications
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            visibleNotifications.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );

        // Vider la liste des notifications visibles non lues
        setVisibleNotifications([]);

        // Réinitialiser les états d'animation
        setMarkingAsRead({});

        // Rafraîchir le compteur
        refreshUnreadCount();
        onNotificationsRead();
      }, 300);

      // Envoyer les requêtes au serveur en parallèle
      await Promise.all(
        visibleNotifications.map((id) => markAsRead(id, false))
      );
    } catch (error) {
      console.error(
        "Erreur lors du marquage des notifications comme lues:",
        error
      );
      // Réinitialiser les états d'animation en cas d'erreur
      setMarkingAsRead({});
    }
  }, [
    visibleNotifications,
    markAsRead,
    refreshUnreadCount,
    onNotificationsRead,
  ]);

  // Gestionnaire de clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        markVisibleNotificationsAsRead();
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, markVisibleNotificationsAsRead]);

  // Fonction markAllAsRead améliorée avec animations
  const markAllAsRead = useCallback(async () => {
    try {
      // Animer toutes les notifications non lues
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

      unreadIds.forEach((id) => {
        setMarkingAsRead((prev) => ({ ...prev, [id]: true }));
      });

      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        // Court délai pour l'animation
        setTimeout(() => {
          setNotifications((prevNotifications) =>
            prevNotifications.map((notification) => ({
              ...notification,
              read: true,
            }))
          );

          setVisibleNotifications([]);
          setMarkingAsRead({});
          refreshUnreadCount();
          onNotificationsRead();
        }, 300);
      }
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
      setMarkingAsRead({});
    }
  }, [notifications, refreshUnreadCount, onNotificationsRead]);

  // handleNotificationClick avec useCallback
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }

      if (notification.task) {
        const taskLink =
          `/dashboard/objet/${notification.task.article.sector.object.id}` +
          `/secteur/${notification.task.article.sector.id}` +
          `/article/${notification.task.article.id}` +
          `/task/${notification.task.id}`;

        router.push(taskLink);
        onClose();
      } else if (notification.link) {
        router.push(notification.link);
        onClose();
      }
    },
    [markAsRead, router, onClose]
  );

  // Fonction handleClosePanel
  const handleClosePanel = useCallback(() => {
    markVisibleNotificationsAsRead();
    onClose();
  }, [markVisibleNotificationsAsRead, onClose]);

  // getNotificationIcon en tant que fonction simple
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
    <motion.div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-hidden bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg z-50"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="p-3 border-b border-[color:var(--border)] flex justify-between items-center bg-[color:var(--muted)]">
        <h3 className="font-medium text-[color:var(--foreground)]">
          Notifications
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
            title="Rafraîchir"
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={`${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={markAllAsRead}
            className="text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
            disabled={visibleNotifications.length === 0}
          >
            Tout marquer comme lu
          </button>
          <button
            onClick={handleClosePanel}
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
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.li
                  key={notification.id}
                  variants={notificationVariants}
                  initial="visible"
                  exit="exit"
                  animate={markingAsRead[notification.id] ? "exit" : "visible"}
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
                      <motion.button
                        className="flex-shrink-0 text-[color:var(--primary)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Marquer comme lu"
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <Check size={16} />
                      </motion.button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <div className="p-2 border-t border-[color:var(--border)] text-center">
        <motion.a
          href="/profile/notifications"
          className="text-xs text-[color:var(--primary)] hover:underline inline-block"
          onClick={() => handleClosePanel()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Voir toutes les notifications
        </motion.a>
      </div>
    </motion.div>
  );
}
