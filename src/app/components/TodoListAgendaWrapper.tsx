"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTasks } from "@/hooks/useData";

// Import dynamique du composant TodoListAgenda
const TodoListAgenda = dynamic(() => import("./TodoListAgenda"), {
  ssr: false,
});

// Définir un dataVersion pour le suivi des changements
const DATA_VERSION_KEY = "plannikeeper-data-version";

export default function TodoListAgendaWrapper() {
  const [selectedObjectId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Utiliser le hook useTasks
  const { mutate } = useTasks(selectedObjectId);

  // Fonction pour rafraîchir les données silencieusement
  const refreshDataSilently = useCallback(async () => {
    console.log("Rafraîchissement silencieux des données de l'agenda");

    try {
      // Invalider et recharger les données
      await mutate();

      // Incrémenter la version des données pour forcer un re-rendu
      const newVersion = dataVersion + 1;
      setDataVersion(newVersion);

      // Stocker la nouvelle version dans localStorage
      localStorage.setItem(DATA_VERSION_KEY, newVersion.toString());
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
    }
  }, [dataVersion, mutate]);

  // Écouter les événements de visibilité pour rafraîchir les données
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Application visible, rafraîchissement des données");
        refreshDataSilently();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshDataSilently]);

  // Récupérer la version des données stockée lors du montage
  useEffect(() => {
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
    if (storedVersion) {
      setDataVersion(parseInt(storedVersion, 10));
    }
  }, []);

  // Écouter les messages du service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type) {
          console.log("Message reçu du Service Worker:", event.data);

          // Si le message concerne les données, rafraîchir
          if (
            event.data.type === "data-change" ||
            event.data.type === "task-change" ||
            event.data.type === "cache-invalidated"
          ) {
            refreshDataSilently();
          }
        }
      };

      navigator.serviceWorker.addEventListener("message", messageHandler);
      return () => {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
      };
    }
  }, [refreshDataSilently]);

  // Force un rafraîchissement périodique en mode PWA
  useEffect(() => {
    // Définir un type personnalisé pour navigator avec la propriété standalone
    interface NavigatorWithStandalone extends Navigator {
      standalone?: boolean;
    }
    // Vérifier si nous sommes en PWA
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;

    if (isPWA) {
      // Rafraîchir les données toutes les 2 minutes en mode PWA
      const interval = setInterval(
        () => {
          if (document.visibilityState === "visible") {
            console.log("Rafraîchissement périodique des données (PWA)");
            refreshDataSilently();
          }
        },
        2 * 60 * 1000
      ); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [refreshDataSilently]);

  return (
    <TodoListAgenda
      key={`agenda-${dataVersion}`} // Forcer un re-rendu lors des changements
    />
  );
}
