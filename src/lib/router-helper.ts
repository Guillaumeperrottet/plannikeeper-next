"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useGlobalLoader } from "@/app/components/GlobalLoader";
import { useState, useEffect } from "react";

interface NavigateOptions {
  // Message à afficher pendant le chargement
  loadingMessage?: string;

  // Durée maximale d'affichage du loader (en ms)
  loadingTimeout?: number;

  // Callback après la navigation
  onComplete?: () => void;

  // Callback en cas d'erreur
  onError?: (error: unknown) => void;

  // Appliquer un délai avant de naviguer, utile pour montrer le loader
  delay?: number;

  // Déclencher un retour haptique sur les appareils mobiles
  hapticFeedback?: boolean;

  // Doit-on afficher un loader global
  useGlobalLoader?: boolean;

  // Doit-on activer le loader instantané (sans délai d'animation)
  instantLoader?: boolean;
}

// État pour suivre les navigations en cours et éviter les doublons
const activeNavigations = new Set<string>();

/**
 * Hook personnalisé pour la navigation avec indicateur de chargement
 */
export function useRouter() {
  const router = useNextRouter();
  const { showLoader, hideLoader, setInstantLoading } = useGlobalLoader();
  const [isNavigating, setIsNavigating] = useState(false);

  // Nettoyer les navigations actives quand le composant est démonté
  useEffect(() => {
    return () => {
      // Ne nettoyez que les navigations initiées par ce composant
      // Pour une implémentation plus robuste, il faudrait un ID de composant
    };
  }, []);

  /**
   * Naviguer avec un indicateur de chargement
   */
  const navigateWithLoading = async (
    url: string,
    options: NavigateOptions = {}
  ) => {
    const {
      loadingMessage = "Chargement...",
      loadingTimeout = 5000,
      onComplete,
      onError,
      delay = 0,
      hapticFeedback = true,
      useGlobalLoader: showGlobalLoader = true,
      instantLoader = false,
    } = options;

    // Éviter les navigations dupliquées
    if (activeNavigations.has(url)) {
      return;
    }

    activeNavigations.add(url);
    setIsNavigating(true);

    try {
      // Feedback haptique immédiat si applicable
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate([15, 30, 15]);
      }

      // Configuration du loader global si demandé
      if (showGlobalLoader) {
        // Activer le mode sans délai si demandé
        if (instantLoader) {
          setInstantLoading(true);
        }

        // Afficher le loader global
        showLoader(loadingMessage);
      }

      // Configurer un timeout de sécurité
      const timeoutId = setTimeout(() => {
        if (showGlobalLoader) hideLoader();
        setIsNavigating(false);
        activeNavigations.delete(url);
      }, loadingTimeout);

      // Naviguer après le délai spécifié
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          router.push(url);
          resolve();
        }, delay);
      });

      // Nettoyer et finaliser
      clearTimeout(timeoutId);

      // Attente courte pour permettre à la navigation de commencer
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Cacher le loader global si utilisé
      if (showGlobalLoader) {
        hideLoader();
      }

      // Marquer la navigation comme terminée
      setIsNavigating(false);
      activeNavigations.delete(url);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      // Gestion des erreurs
      if (showGlobalLoader) hideLoader();
      setIsNavigating(false);
      activeNavigations.delete(url);

      if (onError) {
        onError(error);
      } else {
        console.error("Erreur lors de la navigation:", error);
      }
    }
  };

  // Méthode optimisée pour les actions progressives ou formulaires
  const navigateWithProgress = async (
    actionFn: () => Promise<unknown>,
    url: string,
    options: NavigateOptions = {}
  ) => {
    const {
      loadingMessage = "Traitement en cours...",
      hapticFeedback = true,
      instantLoader = true,
    } = options;

    // Feedback haptique immédiat
    if (hapticFeedback && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    try {
      // Afficher le loader instantané
      setInstantLoading(instantLoader);
      showLoader(loadingMessage);

      // Exécuter l'action (par exemple: soumission de formulaire)
      await actionFn();

      // Navigation
      router.push(url);

      // Délai court pour la transition
      await new Promise((resolve) => setTimeout(resolve, 100));

      hideLoader();
    } catch (error) {
      hideLoader();
      console.error("Erreur:", error);
      throw error; // Relancer pour la gestion dans le composant appelant
    }
  };

  // Fonction simplifiée pour les retours en arrière
  const goBack = (fallbackUrl: string = "/dashboard") => {
    if (window.history.length > 2) {
      router.back();
    } else {
      navigateWithLoading(fallbackUrl);
    }
  };

  // Retourner le router Next.js original plus nos méthodes personnalisées
  return {
    ...router,
    navigateWithLoading,
    navigateWithProgress,
    goBack,
    isNavigating,
  };
}
