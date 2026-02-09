import { useState, useCallback, RefObject } from "react";
import { toast } from "sonner";
import { Article, ImageSize, Position, ArticlePositionUpdate } from "../types";
import { pixelsToPercent, clamp } from "../utils/coordinateTransforms";
import { showErrorToast, showSuccessToast } from "../utils/errorHandlers";

type UseArticleDragAndDropProps = {
  articles: Article[];
  imageSize: ImageSize;
  containerRef: RefObject<HTMLDivElement>;
  onArticlePositionUpdate?: (
    articleId: string,
    updates: ArticlePositionUpdate,
  ) => Promise<void>;
  onPopoverOpenChange: (isOpen: boolean) => void;
};

/**
 * Hook pour gérer le drag & drop des articles
 */
export function useArticleDragAndDrop({
  articles,
  imageSize,
  containerRef,
  onArticlePositionUpdate,
  onPopoverOpenChange,
}: UseArticleDragAndDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggingArticleId, setDraggingArticleId] = useState<string | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [tempDragPosition, setTempDragPosition] = useState<Position | null>(
    null,
  );
  const [hasDraggedMoved, setHasDraggedMoved] = useState(false);
  const [preventPopoverOpen, setPreventPopoverOpen] = useState(false);
  const [previousPosition, setPreviousPosition] = useState<
    (ArticlePositionUpdate & { articleId: string }) | null
  >(null);

  const savePositionBeforeChange = useCallback((article: Article) => {
    setPreviousPosition({
      articleId: article.id,
      positionX: article.positionX || 50,
      positionY: article.positionY || 50,
      width: article.width || 20,
      height: article.height || 20,
    });
  }, []);

  const restorePreviousPosition = useCallback(async () => {
    if (!previousPosition || !onArticlePositionUpdate) return;

    try {
      await onArticlePositionUpdate(previousPosition.articleId, {
        positionX: previousPosition.positionX,
        positionY: previousPosition.positionY,
        width: previousPosition.width,
        height: previousPosition.height,
      });

      showSuccessToast(
        "Position restaurée",
        "L'article a été restauré à sa position précédente.",
      );
    } catch {
      showErrorToast("déplacement");
    } finally {
      setPreviousPosition(null);
    }
  }, [previousPosition, onArticlePositionUpdate]);

  const handleDragStart = useCallback(
    (
      e: React.MouseEvent,
      article: Article,
      calculateArticleCenter: (article: Article) => Position,
    ) => {
      e.stopPropagation();

      savePositionBeforeChange(article);
      setDraggingArticleId(article.id);
      setIsDragging(true);
      setHasDraggedMoved(false);
      onPopoverOpenChange(false);
      setPreventPopoverOpen(true);

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const center = calculateArticleCenter(article);

      setDragOffset({
        x: x - center.x,
        y: y - center.y,
      });
    },
    [savePositionBeforeChange, containerRef, onPopoverOpenChange],
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !draggingArticleId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      setHasDraggedMoved(true);
      setTempDragPosition({ x: newX, y: newY });
    },
    [isDragging, draggingArticleId, dragOffset, containerRef],
  );

  const handleDragEnd = useCallback(
    async (clientX: number, clientY: number) => {
      if (
        !isDragging ||
        !draggingArticleId ||
        !onArticlePositionUpdate ||
        !containerRef.current
      )
        return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const article = articles.find((a) => a.id === draggingArticleId);
      if (!article) return;

      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      const percentPosition = pixelsToPercent(
        {
          x: newX,
          y: newY,
          width: ((article.width || 20) / 100) * imageSize.displayWidth,
          height: ((article.height || 20) / 100) * imageSize.displayHeight,
        },
        imageSize,
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );

      const constrainedX = clamp(percentPosition.positionX, 0, 100);
      const constrainedY = clamp(percentPosition.positionY, 0, 100);

      const articleIdToUpdate = draggingArticleId;

      // Réinitialiser les états immédiatement
      setIsDragging(false);
      setDraggingArticleId(null);
      setDragOffset({ x: 0, y: 0 });
      setTempDragPosition(null);

      if (hasDraggedMoved) {
        setTimeout(() => setPreventPopoverOpen(false), 1500);
      } else {
        setPreventPopoverOpen(false);
      }
      setHasDraggedMoved(false);

      const loadingToast = toast.loading("Déplacement en cours...", {
        description: "Sauvegarde de la nouvelle position",
      });

      try {
        await onArticlePositionUpdate(articleIdToUpdate, {
          positionX: constrainedX,
          positionY: constrainedY,
          width: article.width || 20,
          height: article.height || 20,
        });

        toast.success("Article déplacé !", {
          description: "La nouvelle position a été sauvegardée.",
          duration: 2000,
          id: loadingToast,
        });
      } catch {
        toast.dismiss(loadingToast);
        restorePreviousPosition();
        showErrorToast("déplacement");
      }
    },
    [
      isDragging,
      draggingArticleId,
      dragOffset,
      articles,
      imageSize,
      containerRef,
      onArticlePositionUpdate,
      hasDraggedMoved,
      restorePreviousPosition,
    ],
  );

  return {
    isDragging,
    draggingArticleId,
    tempDragPosition,
    preventPopoverOpen,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
}
