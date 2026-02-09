import { useState, useEffect, useCallback, RefObject } from "react";
import { ImageSize } from "../types";
import { DIMENSION_UPDATE_DELAYS } from "../constants";

/**
 * Hook pour gérer les dimensions de l'image responsive
 */
export function useImageDimensions(
  containerRef: RefObject<HTMLDivElement>,
  imageRef: RefObject<HTMLImageElement>,
  originalWidth: number,
  originalHeight: number,
) {
  const [mounted, setMounted] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>({
    displayWidth: 0,
    displayHeight: 0,
    scaleX: 1,
    scaleY: 1,
    aspectRatio: originalWidth / originalHeight,
  });

  const updateDimensions = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const image = imageRef.current;
    const rect = image.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const originalAspectRatio = originalWidth / originalHeight;
    const displayAspectRatio = displayWidth / displayHeight;

    // Déterminer comment l'image est contrainte (par largeur ou hauteur)
    let effectiveWidth, effectiveHeight;

    if (displayAspectRatio > originalAspectRatio) {
      // L'image est contrainte par la hauteur
      effectiveHeight = displayHeight;
      effectiveWidth = effectiveHeight * originalAspectRatio;
    } else {
      // L'image est contrainte par la largeur
      effectiveWidth = displayWidth;
      effectiveHeight = effectiveWidth / originalAspectRatio;
    }

    // Calculer les facteurs d'échelle
    const scaleX = originalWidth / effectiveWidth;
    const scaleY = originalHeight / effectiveHeight;

    setImageSize({
      displayWidth: effectiveWidth,
      displayHeight: effectiveHeight,
      scaleX,
      scaleY,
      aspectRatio: originalAspectRatio,
    });
  }, [originalWidth, originalHeight, containerRef, imageRef]);

  useEffect(() => {
    setMounted(true);

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        updateDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Mettre à jour les dimensions après des délais variés
    const timers = DIMENSION_UPDATE_DELAYS.map((delay) =>
      setTimeout(() => updateDimensions(), delay),
    );

    return () => {
      resizeObserver.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [updateDimensions, containerRef]);

  return { mounted, imageSize, updateDimensions };
}
