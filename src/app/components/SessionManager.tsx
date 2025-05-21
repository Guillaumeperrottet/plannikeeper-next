// ce composant gère la session de l'utilisateur
// et la deconnexion automatique lors du swipe up

"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SessionManager() {
  const router = useRouter();

  useEffect(() => {
    let isHidden = false;

    // Fonction pour déconnecter l'utilisateur
    const logoutUser = async () => {
      try {
        await authClient.signOut();
        // Rediriger vers la page de connexion lors du prochain chargement
        window.localStorage.setItem("forceLogout", "true");
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
      }
    };

    // Gestionnaire d'événement quand la visibilité de la page change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isHidden = true;
        // Enregistrer le timestamp quand la page est cachée
        window.localStorage.setItem("appHiddenAt", Date.now().toString());
      } else if (isHidden) {
        isHidden = false;
        // Si la page était cachée et devient visible à nouveau, vérifier si l'utilisateur s'est déconnecté
        const forceLogout = window.localStorage.getItem("forceLogout");
        if (forceLogout === "true") {
          window.localStorage.removeItem("forceLogout");
          router.push("/signin");
        }
      }
    };

    // Gestionnaire d'événement pour quand l'application va être fermée
    const handleBeforeUnload = () => {
      // Enregistrer qu'on quitte l'application
      window.localStorage.setItem("appClosing", "true");
    };

    // Lorsque l'application se recharge après avoir été fermée
    const checkIfWasClosed = () => {
      const wasClosed = window.localStorage.getItem("appClosing");
      if (wasClosed === "true") {
        // L'app a été complètement fermée, déconnecter l'utilisateur
        window.localStorage.removeItem("appClosing");
        logoutUser();
      }
    };

    // Exécuter la vérification au chargement
    checkIfWasClosed();

    // Ajouter les écouteurs d'événements
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Nettoyer les écouteurs lors du démontage
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router]);

  return null; // Ce composant ne rend rien visuellement
}
