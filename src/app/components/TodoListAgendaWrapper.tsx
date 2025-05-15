"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTasks } from "@/hooks/useData";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

// Import dynamique du composant TodoListAgenda
const TodoListAgenda = dynamic(() => import("./TodoListAgenda"), {
  ssr: false,
});

// Définir un dataVersion pour le suivi des changements
const DATA_VERSION_KEY = "plannikeeper-data-version";

export default function TodoListAgendaWrapper() {
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const router = useRouter();

  // Utiliser le hook useTasks avec dataVersion comme dépendance
  const { mutate } = useTasks(null);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    console.log("Rafraîchissement des données de l'agenda");
    setIsRefreshing(true);

    try {
      // Invalider et recharger les données
      await mutate();

      // Incrémenter la version des données pour forcer un re-rendu
      const newVersion = dataVersion + 1;
      setDataVersion(newVersion);

      // Stocker la nouvelle version dans localStorage
      localStorage.setItem(DATA_VERSION_KEY, newVersion.toString());

      // Afficher un toast de confirmation
      toast.success("Données rafraîchies", {
        id: "refresh-success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      toast.error("Échec du rafraîchissement", {
        id: "refresh-error",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [dataVersion, mutate]);

  // Écouter les événements de visibilité pour rafraîchir les données
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Application visible, rafraîchissement des données");
        refreshData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshData]);

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
            refreshData();
          }
        }
      };

      navigator.serviceWorker.addEventListener("message", messageHandler);
      return () => {
        navigator.serviceWorker.removeEventListener("message", messageHandler);
      };
    }
  }, [refreshData]);

  // Force un rafraîchissement périodique en mode PWA
  useEffect(() => {
    // Étendre l'interface Navigator pour inclure 'standalone'
    interface NavigatorStandalone extends Navigator {
      standalone?: boolean;
    }
    // Vérifier si nous sommes en PWA
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorStandalone).standalone === true;

    if (isPWA) {
      // Rafraîchir les données toutes les 2 minutes en mode PWA
      const interval = setInterval(
        () => {
          if (document.visibilityState === "visible") {
            console.log("Rafraîchissement périodique des données (PWA)");
            refreshData();
          }
        },
        2 * 60 * 1000
      ); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [refreshData]);

  // Fonction pour activer le rafraîchissement forcé via un bouton
  const handleManualRefresh = () => {
    if (isRefreshing) return;

    refreshData();

    // Simuler un délai pour l'animation du bouton
    setTimeout(() => {
      router.refresh(); // Rafraîchir également l'interface Next.js
    }, 100);
  };

  // Bouton flottant pour rafraîchir les données
  const RefreshButton = () => (
    <button
      onClick={handleManualRefresh}
      disabled={isRefreshing}
      className={`fixed bottom-24 right-8 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform ${
        isRefreshing ? "opacity-70" : "hover:scale-105 active:scale-95"
      }`}
      aria-label="Rafraîchir les données"
    >
      <RefreshCcw size={20} className={isRefreshing ? "animate-spin" : ""} />
    </button>
  );

  return (
    <>
      <TodoListAgenda
        key={`agenda-${dataVersion}`} // Forcer un re-rendu lors des changements
      />
      <RefreshButton />
    </>
  );
}
