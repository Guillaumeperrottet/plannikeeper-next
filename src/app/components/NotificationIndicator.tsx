// src/app/components/NotificationIndicator.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import NotificationsPanel from "@/app/components/NotificationsPanel";

export default function NotificationIndicator() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    fetchUnreadCount();

    // Mettre en place un intervalle pour vérifier régulièrement les nouvelles notifications
    const interval = setInterval(fetchUnreadCount, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, []);

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
  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  const closePanel = () => {
    setShowPanel(false);
  };

  const handleNotificationsRead = () => {
    fetchUnreadCount(); // Rafraîchir le compteur
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePanel}
        className="relative p-2 rounded-full"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[color:var(--destructive)] text-white text-xs flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {showPanel && (
        <NotificationsPanel
          onClose={closePanel}
          onNotificationsRead={handleNotificationsRead}
        />
      )}
    </div>
  );
}
