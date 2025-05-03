// src/app/components/NotificationIndicator.tsx (mise à jour)
"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import NotificationsPanel from "@/app/components/NotificationsPanel";
import { useNotifications } from "./notification-provider";

export default function NotificationIndicator() {
  const { unreadCount, requestPermission, hasPermission } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  const closePanel = () => {
    setShowPanel(false);
  };

  const handleNotificationsRead = () => {
    // Le compteur est mis à jour automatiquement par le NotificationProvider
  };

  // Demander l'autorisation si on clique sur l'icône et que les notifications ne sont pas autorisées
  const handleClick = async () => {
    if (hasPermission === false) {
      // Si les permissions sont explicitement refusées, afficher un message
      alert(
        "Les notifications sont désactivées pour ce site. Veuillez les activer dans les paramètres de votre navigateur."
      );
    } else if (hasPermission === null) {
      // Si les permissions n'ont pas encore été demandées
      await requestPermission();
    }

    togglePanel();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
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
