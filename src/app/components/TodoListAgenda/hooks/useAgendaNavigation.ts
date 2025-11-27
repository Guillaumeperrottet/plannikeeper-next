// Hook pour gérer la navigation depuis l'agenda
"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter as useCustomRouter } from "@/lib/router-helper";
import { useLoadingSystem } from "@/app/components/LoadingSystem";
import { Task } from "../types";

export const useAgendaNavigation = (
  isMobile: boolean,
  onNavigate?: () => void
) => {
  const customRouter = useCustomRouter();
  const { showLoader, hideLoader, hideAllLoaders } = useLoadingSystem();
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Obtenir l'ID utilisateur depuis l'élément HTML
  useEffect(() => {
    const htmlElement = document.documentElement;
    const userId = htmlElement.getAttribute("data-user-id");

    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  const navigateToTask = useCallback(
    async (task: Task): Promise<void> => {
      try {
        // Retour haptique pour confirmer l'action
        if ("vibrate" in navigator && isMobile) {
          navigator.vibrate([15, 30, 15]);
        }

        // Callback pour fermer l'agenda si fourni
        if (onNavigate) {
          onNavigate();
        }

        // Créer un loader manuel
        const loaderId = showLoader({
          message: "Chargement de la tâche...",
          source: "taskNavigation",
          priority: 20,
          skipDelay: true,
        });

        const url = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`;

        let navigationCompleted = false;

        const navigationObserver = () => {
          navigationCompleted = true;
          document.removeEventListener("visibilitychange", navigationObserver);
        };
        document.addEventListener("visibilitychange", navigationObserver);

        customRouter.push(url);

        setTimeout(() => {
          if (!navigationCompleted) {
            setTimeout(() => {
              hideLoader(loaderId);
            }, 1000);
          } else {
            hideLoader(loaderId);
          }
        }, 500);
      } catch (error) {
        console.error("Erreur de navigation:", error);
        hideAllLoaders();
      }
    },
    [isMobile, customRouter, showLoader, hideLoader, hideAllLoaders, onNavigate]
  );

  const triggerHapticFeedback = useCallback(() => {
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10);
    }
  }, [isMobile]);

  return {
    navigateToTask,
    triggerHapticFeedback,
    currentUserId,
  };
};
