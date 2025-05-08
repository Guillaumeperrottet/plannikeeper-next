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
      instantLoader = true, // Changé à true par défaut pour un affichage immédiat
    } = options;

    // Éviter les navigations dupliquées
    if (activeNavigations.has(url)) {
      return;
    }

    // IMPORTANT: Ajouter immédiatement à la liste des navigations actives
    // pour éviter les doubles clics rapides
    activeNavigations.add(url);
    setIsNavigating(true);

    // Ajout d'une classe au body pour le feedback visuel immédiat
    document.body.classList.add("navigation-pending");

    try {
      // Configuration du loader global AVANT toute opération asynchrone
      if (showGlobalLoader) {
        // Activer le mode sans délai
        setInstantLoading(instantLoader);

        // Nous demandons au navigateur de traiter cette opération en priorité
        window.requestAnimationFrame(() => {
          // Afficher le loader global
          showLoader(loadingMessage);
        });
      }

      // Feedback haptique en parallèle (ne pas attendre)
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate([15, 30, 15]);
      }

      // Configurer un timeout de sécurité
      const timeoutId = setTimeout(() => {
        if (showGlobalLoader) hideLoader();
        setIsNavigating(false);
        activeNavigations.delete(url);
        document.body.classList.remove("navigation-pending");
      }, loadingTimeout);

      // Si on a spécifié un délai, on attend
      if (delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }

      // Navigation immédiate
      router.push(url);

      // Nettoyer et finaliser, mais permettre une transition fluide
      clearTimeout(timeoutId);

      // Attente courte pour permettre à la navigation de commencer
      // et éviter que le loader ne disparaisse trop vite
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Laissons le loader visible un peu plus longtemps pour éviter un flash
      // Le loader sera masqué automatiquement par le changement de page
      // Next.js va remplacer le contenu, il n'est pas nécessaire de masquer le loader manuellement

      // Nettoyage des états après un bref délai
      setTimeout(() => {
        setIsNavigating(false);
        activeNavigations.delete(url);
        document.body.classList.remove("navigation-pending");

        if (onComplete) {
          onComplete();
        }
      }, 200);
    } catch (error) {
      // Gestion des erreurs
      if (showGlobalLoader) hideLoader();
      setIsNavigating(false);
      activeNavigations.delete(url);
      document.body.classList.remove("navigation-pending");

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

    // Feedback visuel immédiat
    document.body.classList.add("navigation-pending");

    // Feedback haptique immédiat (ne pas attendre)
    if (hapticFeedback && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    try {
      // Afficher le loader instantané IMMÉDIATEMENT
      setInstantLoading(instantLoader);

      // Utiliser requestAnimationFrame pour prioriser l'affichage du loader
      window.requestAnimationFrame(() => {
        showLoader(loadingMessage);
      });

      // Exécuter l'action (par exemple: soumission de formulaire)
      await actionFn();

      // Navigation
      router.push(url);

      // Nettoyage après un bref délai pour assurer une transition fluide
      setTimeout(() => {
        document.body.classList.remove("navigation-pending");
      }, 200);
    } catch (error) {
      hideLoader();
      document.body.classList.remove("navigation-pending");
      console.error("Erreur:", error);
      throw error; // Relancer pour la gestion dans le composant appelant
    }
  };

  // Fonction simplifiée pour les retours en arrière - optimisée pour la fluidité
  const goBack = (fallbackUrl: string = "/dashboard") => {
    // Feedback visuel immédiat
    document.body.classList.add("navigation-pending");

    // Afficher le loader instantanément
    setInstantLoading(true);
    showLoader("Retour...");

    if (window.history.length > 2) {
      // Retour en arrière avec une courte pause pour permettre l'affichage du loader
      setTimeout(() => {
        router.back();
      }, 10);
    } else {
      // Ou navigation vers le fallback
      setTimeout(() => {
        router.push(fallbackUrl);
      }, 10);
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
