import { useState, useCallback, RefObject } from "react";
import { toast } from "sonner";
import {
  Article,
  ImageSize,
  ResizeHandle,
  ArticlePositionUpdate,
  Size,
  Position,
} from "../types";
import { showErrorToast } from "../utils/errorHandlers";

type UseArticleResizeProps = {
  articles: Article[];
  imageSize: ImageSize;
  containerRef: RefObject<HTMLDivElement>;
  onArticlePositionUpdate?: (
    articleId: string,
    updates: ArticlePositionUpdate,
  ) => Promise<void>;
  onPopoverOpenChange: (isOpen: boolean) => void;
  restorePreviousPositionFromDrag: () => Promise<void>;
};

/**
 * Hook pour gérer le redimensionnement des articles
 */
export function useArticleResize({
  articles,
  imageSize,
  containerRef,
  onArticlePositionUpdate,
  onPopoverOpenChange,
  restorePreviousPositionFromDrag,
}: UseArticleResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizingArticleId, setResizingArticleId] = useState<string | null>(
    null,
  );
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStartPosition, setResizeStartPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [tempResizeSize, setTempResizeSize] = useState<
    (Position & Size) | null
  >(null);
  const [preventPopoverOpen, setPreventPopoverOpen] = useState(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, article: Article, handle: ResizeHandle) => {
      e.stopPropagation();

      setResizingArticleId(article.id);
      setIsResizing(true);
      setResizeHandle(handle);
      onPopoverOpenChange(false);
      setPreventPopoverOpen(true);

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      setResizeStartPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [containerRef, onPopoverOpenChange],
  );

  const handleResizeMove = useCallback(
    (clientX: number, clientY: number) => {
      if (
        !isResizing ||
        !resizingArticleId ||
        !containerRef.current ||
        !resizeHandle
      )
        return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      const article = articles.find((a) => a.id === resizingArticleId);
      if (!article) return;

      const unusedWidth =
        containerRef.current.clientWidth - imageSize.displayWidth;
      const unusedHeight =
        containerRef.current.clientHeight - imageSize.displayHeight;
      const offsetX = unusedWidth / 2;
      const offsetY = unusedHeight / 2;

      const currentCenterX =
        (article.positionX! / 100) * imageSize.displayWidth + offsetX;
      const currentCenterY =
        (article.positionY! / 100) * imageSize.displayHeight + offsetY;
      const currentWidth =
        ((article.width || 20) / 100) * imageSize.displayWidth;
      const currentHeight =
        ((article.height || 20) / 100) * imageSize.displayHeight;

      let newLeft = currentCenterX - currentWidth / 2;
      let newTop = currentCenterY - currentHeight / 2;
      let newRight = currentCenterX + currentWidth / 2;
      let newBottom = currentCenterY + currentHeight / 2;

      const deltaX = currentX - resizeStartPosition.x;
      const deltaY = currentY - resizeStartPosition.y;

      switch (resizeHandle) {
        case "se":
          newRight = Math.max(newLeft + 5, newRight + deltaX);
          newBottom = Math.max(newTop + 5, newBottom + deltaY);
          break;
        case "sw":
          newLeft = Math.min(newRight - 5, newLeft + deltaX);
          newBottom = Math.max(newTop + 5, newBottom + deltaY);
          break;
        case "ne":
          newRight = Math.max(newLeft + 5, newRight + deltaX);
          newTop = Math.min(newBottom - 5, newTop + deltaY);
          break;
        case "nw":
          newLeft = Math.min(newRight - 5, newLeft + deltaX);
          newTop = Math.min(newBottom - 5, newTop + deltaY);
          break;
      }

      const newWidth = newRight - newLeft;
      const newHeight = newBottom - newTop;
      const newCenterX = newLeft + newWidth / 2;
      const newCenterY = newTop + newHeight / 2;

      setTempResizeSize({
        width: newWidth,
        height: newHeight,
        x: newCenterX,
        y: newCenterY,
      });
    },
    [
      isResizing,
      resizingArticleId,
      resizeHandle,
      resizeStartPosition,
      articles,
      imageSize,
      containerRef,
    ],
  );

  const handleResizeEnd = useCallback(async () => {
    if (
      !isResizing ||
      !resizingArticleId ||
      !onArticlePositionUpdate ||
      !tempResizeSize ||
      !containerRef.current
    )
      return;

    const article = articles.find((a) => a.id === resizingArticleId);
    if (!article) return;

    const unusedWidth =
      containerRef.current.clientWidth - imageSize.displayWidth;
    const unusedHeight =
      containerRef.current.clientHeight - imageSize.displayHeight;
    const offsetX = unusedWidth / 2;
    const offsetY = unusedHeight / 2;

    const newWidthPercent =
      (tempResizeSize.width / imageSize.displayWidth) * 100;
    const newHeightPercent =
      (tempResizeSize.height / imageSize.displayHeight) * 100;
    const newPositionXPercent =
      ((tempResizeSize.x - offsetX) / imageSize.displayWidth) * 100;
    const newPositionYPercent =
      ((tempResizeSize.y - offsetY) / imageSize.displayHeight) * 100;

    const constrainedWidth = Math.max(1, Math.min(80, newWidthPercent));
    const constrainedHeight = Math.max(1, Math.min(60, newHeightPercent));
    const constrainedX = Math.max(5, Math.min(95, newPositionXPercent));
    const constrainedY = Math.max(5, Math.min(95, newPositionYPercent));

    const articleIdToUpdate = resizingArticleId;

    setIsResizing(false);
    setResizingArticleId(null);
    setResizeHandle(null);
    setTempResizeSize(null);
    setResizeStartPosition({ x: 0, y: 0 });

    setTimeout(() => setPreventPopoverOpen(false), 1500);

    const loadingToast = toast.loading("Redimensionnement en cours...", {
      description: "Sauvegarde des nouvelles dimensions",
    });

    try {
      await onArticlePositionUpdate(articleIdToUpdate, {
        positionX: constrainedX,
        positionY: constrainedY,
        width: constrainedWidth,
        height: constrainedHeight,
      });

      toast.success("Article redimensionné !", {
        description: "Les nouvelles dimensions ont été sauvegardées.",
        duration: 2000,
        id: loadingToast,
      });
    } catch {
      toast.dismiss(loadingToast);
      restorePreviousPositionFromDrag();
      showErrorToast("redimensionnement");
    }
  }, [
    isResizing,
    resizingArticleId,
    tempResizeSize,
    articles,
    imageSize,
    containerRef,
    onArticlePositionUpdate,
    restorePreviousPositionFromDrag,
  ]);

  return {
    isResizing,
    resizingArticleId,
    tempResizeSize,
    resizeHandle,
    preventPopoverOpen,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
}
