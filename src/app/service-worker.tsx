"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      // Vérifier si les Service Workers sont supportés
      if ("serviceWorker" in navigator) {
        try {
          // Enregistrer le service worker
          const registration =
            await navigator.serviceWorker.register("/service-worker.js");

          // console.log(
          //   "Service Worker enregistré avec succès:",
          //   registration.scope
          // );

          // Gérer les mises à jour
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // Nouvelle version disponible
                  toast.info("Une nouvelle version est disponible!", {
                    description:
                      "Rechargez la page pour mettre à jour l'application.",
                    action: {
                      label: "Recharger",
                      onClick: () => window.location.reload(),
                    },
                    duration: 10000,
                  });
                } else {
                  // Première installation
                  toast.success("Application disponible hors ligne", {
                    description:
                      "PlanniKeeper est maintenant disponible même sans connexion internet.",
                  });
                }
              }
            };
          };

          // Vérifier les mises à jour périodiquement (toutes les heures)
          const checkForUpdates = async () => {
            try {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) await reg.update();
            } catch (err) {
              console.error("Erreur de vérification des mises à jour:", err);
            }
          };

          setInterval(checkForUpdates, 60 * 60 * 1000);
        } catch (error) {
          console.error("Erreur d'enregistrement du Service Worker:", error);
        }
      } else {
        console.log("Les Service Workers ne sont pas supportés");
      }
    };

    // Attendre que la page soit complètement chargée
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
      return () => window.removeEventListener("load", registerServiceWorker);
    }
  }, []);

  return null; // Ce composant ne rend rien visuellement
}
