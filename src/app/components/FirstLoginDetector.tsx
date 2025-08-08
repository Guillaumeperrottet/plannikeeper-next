"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "./notification-provider";

export function FirstLoginDetector() {
  const [hasChecked, setHasChecked] = useState(false);
  const { refreshUnreadCount } = useNotifications();

  useEffect(() => {
    if (hasChecked) return;

    const checkFirstLogin = async () => {
      try {
        // Utiliser le localStorage pour éviter de créer la notification plusieurs fois
        // pendant la même session
        const hasCreatedPwaNotification = localStorage.getItem(
          "pwaNotificationCreated"
        );

        if (hasCreatedPwaNotification) {
          setHasChecked(true);
          return;
        }

        // Créer la notification PWA pour tous les appareils
        const response = await fetch("/api/notifications/pwa-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Marquer comme créé dans le localStorage pour éviter les répétitions
          localStorage.setItem("pwaNotificationCreated", "true");
          console.log("✅ Notification PWA créée avec succès");

          // Rafraîchir le compteur de notifications pour afficher le badge
          await refreshUnreadCount();
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de la première connexion:",
          error
        );
      } finally {
        setHasChecked(true);
      }
    };

    // Déclencher la vérification après un petit délai pour laisser le temps
    // à l'interface de se charger
    const timeout = setTimeout(checkFirstLogin, 3000);

    return () => clearTimeout(timeout);
  }, [hasChecked, refreshUnreadCount]);

  // Ce composant ne rend rien visuellement
  return null;
}
