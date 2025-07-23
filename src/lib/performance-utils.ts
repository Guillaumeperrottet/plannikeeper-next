// Utilitaires pour optimiser les performances
import { useEffect, useState } from 'react';

// Hook pour détecter la préférence d'animation de l'utilisateur
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook pour détecter si l'appareil est peu performant
export function useIsLowPowerDevice() {
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    // Détection basée sur navigator.hardwareConcurrency et navigator.deviceMemory
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
    
    // Considérer comme low-power si moins de 4 cores ou moins de 4GB RAM
    setIsLowPower(cores < 4 || memory < 4);
  }, []);

  return isLowPower;
}

// Variants d'animation optimisées
export const optimizedVariants = {
  // Animation simple pour les appareils peu performants
  simple: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } }
  },
  // Animation complète pour les appareils performants
  full: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  }
};

// Fonction pour choisir les variants selon la performance
export function getOptimizedVariants(isLowPower: boolean, prefersReducedMotion: boolean) {
  if (isLowPower || prefersReducedMotion) {
    return optimizedVariants.simple;
  }
  return optimizedVariants.full;
}

// Throttle pour les événements fréquents
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Debounce optimisé
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return function (this: unknown, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}
