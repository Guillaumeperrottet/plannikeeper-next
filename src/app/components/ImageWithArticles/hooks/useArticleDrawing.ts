import { useState, useCallback, useEffect, RefObject } from "react";
import { ImageSize, Position, Size } from "../types";
import { isInImageBounds } from "../utils/boundaryChecks";
import { clamp } from "../utils/coordinateTransforms";

type UseArticleDrawingProps = {
  imageSize: ImageSize;
  containerRef: RefObject<HTMLDivElement>;
  createMode: boolean;
  openCreateModal: (
    positionX: number,
    positionY: number,
    width: number,
    height: number,
  ) => void;
};

/**
 * Hook pour gérer le dessin interactif de nouveaux articles
 */
export function useArticleDrawing({
  imageSize,
  containerRef,
  createMode,
  openCreateModal,
}: UseArticleDrawingProps) {
  const [isDrawingNew, setIsDrawingNew] = useState(false);
  const [newArticleStart, setNewArticleStart] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [newArticleEnd, setNewArticleEnd] = useState<Position>({ x: 0, y: 0 });
  const [newArticleSize, setNewArticleSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  // Synchroniser le mode création
  useEffect(() => {
    if (!createMode) {
      setIsDrawingNew(false);
      setNewArticleStart({ x: 0, y: 0 });
      setNewArticleEnd({ x: 0, y: 0 });
      setNewArticleSize({ width: 0, height: 0 });
    }
  }, [createMode]);

  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (createMode && !isDrawingNew && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Vérifier si le clic est dans les limites de l'image
        if (
          !isInImageBounds(
            x,
            y,
            imageSize,
            containerRef.current.clientWidth,
            containerRef.current.clientHeight,
          )
        )
          return;

        e.preventDefault();
        e.stopPropagation();

        setNewArticleStart({ x, y });
        setNewArticleEnd({ x, y });
        setNewArticleSize({ width: 0, height: 0 });
        setIsDrawingNew(true);
      }
    },
    [createMode, isDrawingNew, containerRef, imageSize],
  );

  const handleDrawingMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawingNew || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      setNewArticleEnd({ x: currentX, y: currentY });

      const width = Math.abs(currentX - newArticleStart.x);
      const height = Math.abs(currentY - newArticleStart.y);

      setNewArticleSize({ width, height });
    },
    [isDrawingNew, newArticleStart, containerRef],
  );

  const handleDrawingEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawingNew || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const endX = clientX - rect.left;
      const endY = clientY - rect.top;

      const width = Math.abs(endX - newArticleStart.x);
      const height = Math.abs(endY - newArticleStart.y);

      // Vérifier que le rectangle a une taille minimale
      if (width > 15 && height > 10) {
        // Calculer la position du centre du rectangle
        const centerX = Math.min(newArticleStart.x, endX) + width / 2;
        const centerY = Math.min(newArticleStart.y, endY) + height / 2;

        // Calculer les décalages pour centrer l'image
        const unusedWidth =
          containerRef.current.clientWidth - imageSize.displayWidth;
        const unusedHeight =
          containerRef.current.clientHeight - imageSize.displayHeight;
        const offsetX = unusedWidth / 2;
        const offsetY = unusedHeight / 2;

        // Convertir en pourcentages
        const positionXPercent =
          ((centerX - offsetX) / imageSize.displayWidth) * 100;
        const positionYPercent =
          ((centerY - offsetY) / imageSize.displayHeight) * 100;
        const widthPercent = (width / imageSize.displayWidth) * 100;
        const heightPercent = (height / imageSize.displayHeight) * 100;

        // Limiter les valeurs
        const constrainedX = clamp(positionXPercent, 5, 95);
        const constrainedY = clamp(positionYPercent, 5, 95);
        const constrainedWidth = clamp(widthPercent, 1, 80);
        const constrainedHeight = clamp(heightPercent, 1, 60);

        // Ouvrir le modal avec les dimensions calculées
        openCreateModal(
          constrainedX,
          constrainedY,
          constrainedWidth,
          constrainedHeight,
        );
      }

      // Réinitialiser le dessin
      setIsDrawingNew(false);
      setNewArticleStart({ x: 0, y: 0 });
      setNewArticleEnd({ x: 0, y: 0 });
      setNewArticleSize({ width: 0, height: 0 });
    },
    [isDrawingNew, newArticleStart, containerRef, imageSize, openCreateModal],
  );

  const getDrawingRectStyle = useCallback(() => {
    if (!isDrawingNew) return null;

    const minX = Math.min(newArticleStart.x, newArticleEnd.x);
    const minY = Math.min(newArticleStart.y, newArticleEnd.y);

    return {
      position: "absolute" as const,
      left: `${minX}px`,
      top: `${minY}px`,
      width: `${newArticleSize.width}px`,
      height: `${newArticleSize.height}px`,
      border: "2px dashed #3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      pointerEvents: "none" as const,
      zIndex: 100,
    };
  }, [isDrawingNew, newArticleStart, newArticleEnd, newArticleSize]);

  return {
    isDrawingNew,
    handleBackgroundMouseDown,
    handleDrawingMove,
    handleDrawingEnd,
    getDrawingRectStyle,
  };
}
