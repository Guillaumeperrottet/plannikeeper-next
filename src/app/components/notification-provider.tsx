// src/app/components/notification-provider.tsx
"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  userId: string;
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      console.log("🔄 Fetching unread notifications count...");
      const response = await fetch("/api/notifications?unread=true&limit=1");
      const data = await response.json();

      console.log("📊 API Response:", data);
      console.log("📈 Response OK:", response.ok);

      if (response.ok) {
        console.log("✅ Setting unread count to:", data.unreadCount || 0);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error("❌ API Error:", data);
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des notifications:",
        error
      );
    }
  };

  // Charger les notifications au démarrage
  useEffect(() => {
    fetchUnreadCount();

    // Optionnel: rafraîchir périodiquement les notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Vérifier toutes les minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount: fetchUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
