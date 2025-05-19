"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Vérifier que les Service Workers sont supportés
    if ("serviceWorker" in navigator) {
      // Attendre que la page soit complètement chargée
      window.addEventListener("load", () => {
        // Enregistrer le service worker
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log(registration.scope);

            // Vérifier les mises à jour du service worker
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                      // Une nouvelle version du service worker est disponible
                      console.log(
                        "Une nouvelle version de l'application est disponible, rechargez pour mettre à jour."
                      );

                      // Vous pourriez afficher une notification à l'utilisateur ici
                      if (
                        window.confirm(
                          "Une nouvelle version de l'application est disponible. Voulez-vous recharger la page pour mettre à jour?"
                        )
                      ) {
                        window.location.reload();
                      }
                    } else {
                      // Le service worker est installé pour la première fois
                      console.log(
                        "L'application est maintenant disponible hors ligne."
                      );
                    }
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error(
              "Erreur lors de l'enregistrement du service worker:",
              error
            );
          });

        // Vérifier les mises à jour périodiquement
        setInterval(
          () => {
            navigator.serviceWorker.getRegistration().then((registration) => {
              if (registration) registration.update();
            });
          },
          60 * 60 * 1000
        ); // Vérifier toutes les heures
      });

      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_UPDATED") {
          // Gérer les mises à jour de cache
          console.log("Le cache a été mis à jour:", event.data.payload);
        }
      });
    } else {
      console.log(
        "Les Service Workers ne sont pas supportés sur ce navigateur."
      );
    }

    return () => {
      // Nettoyage si nécessaire
    };
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
}
