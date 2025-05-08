// src/app/components/ui/loading-button.tsx
"use client";

import React, { useState } from "react";
import { Button, ButtonProps } from "./button";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/lib/router-helper";

interface LoadingButtonProps extends ButtonProps {
  href?: string;
  loadingText?: string;
  onNavigate?: () => Promise<void> | void;
  hapticFeedback?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  href,
  loadingText,
  onNavigate,
  hapticFeedback = true,
  disabled,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const customRouter = useRouter();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Arrêter la propagation si on gère nous-mêmes la navigation
    if (href || onNavigate) {
      e.preventDefault();
    }

    // Éviter les clics multiples
    if (isLoading || disabled) return;

    // Feedback visuel immédiat
    setIsLoading(true);

    // Feedback haptique (vibration) sur mobile si supporté
    if (hapticFeedback && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    try {
      if (onNavigate) {
        // Exécuter la fonction de navigation personnalisée
        await onNavigate();
      } else if (href) {
        // Utiliser le router personnalisé avec chargement global
        customRouter.navigateWithLoading(href, {
          loadingMessage: loadingText,
          hapticFeedback: false, // Déjà géré localement
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      // Réinitialiser l'état de chargement après un délai
      // On ne réinitialise pas immédiatement car le loader global prendra le relais
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  return (
    <Button {...props} onClick={handleClick} disabled={isLoading || disabled}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
