import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

// Types et constantes
import { ImageWithArticlesProps, Article, Position } from "./types";

// Hooks
import { useMobileDetection } from "./hooks/useMobileDetection";
import { useImageDimensions } from "./hooks/useImageDimensions";
import { useArticleModals } from "./hooks/useArticleModals";
import { useArticleDragAndDrop } from "./hooks/useArticleDragAndDrop";
import { useArticleResize } from "./hooks/useArticleResize";
import { useArticleDrawing } from "./hooks/useArticleDrawing";

// Composants
import { ArticleMarker } from "./components/ArticleMarker";
import { EditArticleModal } from "./components/EditArticleModal";
import { DeleteArticleModal } from "./components/DeleteArticleModal";
import { CreateArticleModal } from "./components/CreateArticleModal";

// Utils
import { percentToPixels } from "./utils/coordinateTransforms";

export default function ImageWithArticles({
  imageSrc,
  imageAlt,
  originalWidth,
  originalHeight,
  articles,
  onArticleClick,
  onArticleHover,
  hoveredArticleId,
  selectedArticleId,
  isEditable = false,
  className = "",
  onArticleMove,
  onArticleResize,
  onArticleEdit,
  onArticleDelete,
  onArticleUpdate,
  onArticlePositionUpdate,
  onArticleCreate,
  createMode: externalCreateMode,
  onCreateModeChange,
}: ImageWithArticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const imageRef = useRef<HTMLImageElement>(null!);

  console.log("🔧 ImageWithArticles isEditable prop:", isEditable);
  console.log("🔧 Has edit callbacks:", {
    onArticleMove: !!onArticleMove,
    onArticleResize: !!onArticleResize,
    onArticleEdit: !!onArticleEdit,
    onArticleDelete: !!onArticleDelete,
  });

  // États de base
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState(false);
  const [resizeMode, setResizeMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);

  // Hooks
  const isMobile = useMobileDetection();
  const { imageSize, updateDimensions } = useImageDimensions(
    containerRef,
    imageRef,
    originalWidth,
    originalHeight,
  );

  const modals = useArticleModals({
    onArticleUpdate,
    onArticleDelete,
    onArticleCreate,
    onCreateModeChange,
  });

  const drag = useArticleDragAndDrop({
    articles,
    imageSize,
    containerRef,
    onArticlePositionUpdate,
    onPopoverOpenChange: (isOpen) => !isOpen && setOpenPopoverId(null),
  });

  const resize = useArticleResize({
    articles,
    imageSize,
    containerRef,
    onArticlePositionUpdate,
    onPopoverOpenChange: (isOpen) => !isOpen && setOpenPopoverId(null),
    restorePreviousPositionFromDrag: async () => {},
  });

  const drawing = useArticleDrawing({
    imageSize,
    containerRef,
    createMode,
    openCreateModal: modals.openCreateModal,
  });

  // Synchroniser le mode création
  useEffect(() => {
    if (externalCreateMode !== undefined && createMode !== externalCreateMode) {
      setCreateMode(externalCreateMode);
    }
  }, [externalCreateMode, createMode]);

  const updateCreateMode = useCallback(
    (newMode: boolean) => {
      setCreateMode(newMode);
      if (onCreateModeChange) {
        onCreateModeChange(newMode);
      }
    },
    [onCreateModeChange],
  );

  // Calculer le style d'un article
  const calculateArticleStyle = useCallback(
    (article: Article): React.CSSProperties => {
      if (!imageSize.displayWidth || !imageSize.displayHeight) {
        return { display: "none" };
      }

      const containerWidth = containerRef.current?.clientWidth || 0;
      const containerHeight = containerRef.current?.clientHeight || 0;

      let position = percentToPixels(
        article.positionX || 50,
        article.positionY || 50,
        article.width || 20,
        article.height || 20,
        imageSize,
        containerWidth,
        containerHeight,
      );

      // Appliquer les positions temporaires pour drag & drop
      if (
        drag.isDragging &&
        drag.draggingArticleId === article.id &&
        drag.tempDragPosition
      ) {
        position = {
          ...position,
          x: drag.tempDragPosition.x,
          y: drag.tempDragPosition.y,
        };
      }

      if (
        resize.isResizing &&
        resize.resizingArticleId === article.id &&
        resize.tempResizeSize
      ) {
        position = resize.tempResizeSize;
      }

      return {
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        transform: "translate(-50%, -50%)",
      };
    },
    [imageSize, drag, resize, containerRef],
  );

  // Gestionnaires d'événements
  const handleArticleInteraction = useCallback(
    (e: React.MouseEvent, article: Article) => {
      e.stopPropagation();

      if (isMobile) {
        setOpenPopoverId(article.id);
        if (onArticleHover) onArticleHover(article.id);
        return;
      }

      if (onArticleClick) {
        onArticleClick(article.id);
      }
    },
    [isMobile, onArticleClick, onArticleHover],
  );

  const handleArticleMouseEnter = useCallback(
    (e: React.MouseEvent, article: Article) => {
      if (isMobile) return;
      if (onArticleHover) onArticleHover(article.id);
    },
    [isMobile, onArticleHover],
  );

  const handleArticleMouseLeave = useCallback(() => {
    if (isMobile) return;
    if (onArticleHover) onArticleHover(null);
  }, [isMobile, onArticleHover]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, article: Article) => {
      console.log("🖱️ Context menu called for article:", article.id);
      console.log("isMobile:", isMobile);
      console.log("createMode:", createMode);
      console.log("dragMode:", dragMode);
      console.log("resizeMode:", resizeMode);
      console.log(
        "Has actions:",
        !!(
          onArticleMove ||
          onArticleResize ||
          onArticleEdit ||
          onArticleDelete
        ),
      );

      e.preventDefault();
      e.stopPropagation();

      // Sur desktop, ouvrir le popover avec les actions d'édition
      if (
        !isMobile &&
        !createMode &&
        !dragMode &&
        !resizeMode &&
        (onArticleMove || onArticleResize || onArticleEdit || onArticleDelete)
      ) {
        console.log("✅ Opening popover for article:", article.id);
        setOpenPopoverId(article.id);
        if (onArticleHover) onArticleHover(article.id);
      } else {
        console.log("❌ Conditions not met, popover not opened");
      }
    },
    [
      isMobile,
      createMode,
      dragMode,
      resizeMode,
      onArticleMove,
      onArticleResize,
      onArticleEdit,
      onArticleDelete,
      onArticleHover,
    ],
  );

  const handleBackgroundClick = useCallback(() => {
    setOpenPopoverId(null);
    if (onArticleHover) onArticleHover(null);
  }, [onArticleHover]);

  const calculateArticleCenter = useCallback(
    (article: Article): Position => {
      const style = calculateArticleStyle(article);
      return {
        x: parseFloat(style.left?.toString() || "0"),
        y: parseFloat(style.top?.toString() || "0"),
      };
    },
    [calculateArticleStyle],
  );

  // Gestion des événements globaux
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (drag.isDragging) {
        drag.handleDragMove(e.clientX, e.clientY);
      } else if (resize.isResizing) {
        resize.handleResizeMove(e.clientX, e.clientY);
      } else if (drawing.isDrawingNew) {
        drawing.handleDrawingMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (drag.isDragging) {
        drag.handleDragEnd(e.clientX, e.clientY);
      } else if (resize.isResizing) {
        resize.handleResizeEnd();
      } else if (drawing.isDrawingNew) {
        drawing.handleDrawingEnd(e.clientX, e.clientY);
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (createMode) updateCreateMode(false);
        if (dragMode) setDragMode(false);
        if (resizeMode) setResizeMode(false);
      }
    };

    if (drag.isDragging || resize.isResizing || drawing.isDrawingNew) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [
    drag,
    resize,
    drawing,
    createMode,
    dragMode,
    resizeMode,
    updateCreateMode,
  ]);

  // Gestion du zoom pour fermer le popover
  useEffect(() => {
    const handleZoomChange = () => {
      setOpenPopoverId(null);
      if (onArticleHover) onArticleHover(null);
    };

    window.addEventListener("resize", handleZoomChange);

    return () => {
      window.removeEventListener("resize", handleZoomChange);
    };
  }, [onArticleHover]);

  // Articles perdus
  const lostArticles = articles.filter(
    (article) =>
      !article.positionX ||
      !article.positionY ||
      article.positionX < 0 ||
      article.positionX > 100 ||
      article.positionY < 0 ||
      article.positionY > 100 ||
      (article.width && article.width > 80) ||
      (article.height && article.height > 60),
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className} ${createMode ? "cursor-crosshair" : ""}`}
      style={{ width: "100%", position: "relative" }}
      onMouseDown={drawing.handleBackgroundMouseDown}
      onClick={handleBackgroundClick}
    >
      {/* Indicateurs de mode */}
      {dragMode && (
        <div className="absolute top-2 left-2 z-30 bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium">
          Mode déplacement actif - Cliquez et glissez les articles
          <button
            onClick={() => setDragMode(false)}
            className="ml-2 text-blue-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {resizeMode && (
        <div className="absolute top-2 left-2 z-30 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-medium">
          Mode redimensionnement actif - Utilisez les poignées aux coins
          <button
            onClick={() => setResizeMode(false)}
            className="ml-2 text-green-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {createMode && (
        <div className="absolute top-2 left-2 z-30 bg-purple-500 text-white px-3 py-1 rounded-md text-sm font-medium">
          Mode création actif - Cliquez et glissez pour dessiner un article
          <button
            onClick={() => updateCreateMode(false)}
            className="ml-2 text-purple-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Articles perdus */}
      {lostArticles.length > 0 && onArticlePositionUpdate && (
        <div className="absolute top-2 right-2 z-30">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 bg-white"
              >
                <HelpCircle className="h-4 w-4 text-gray-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="left">
              <div className="space-y-3">
                <h4 className="font-medium text-orange-700">
                  Articles perdus ({lostArticles.length})
                </h4>
                <p className="text-sm text-gray-600">
                  Ces articles sont hors limites ou trop grands.
                </p>
                <div className="space-y-2">
                  {lostArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{article.title}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await onArticlePositionUpdate(article.id, {
                            positionX: 50,
                            positionY: 50,
                            width: 20,
                            height: 15,
                          });
                        }}
                      >
                        Récupérer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Image principale */}
      <Image
        ref={imageRef}
        src={imageSrc}
        alt={imageAlt}
        width={originalWidth}
        height={originalHeight}
        className="block h-auto max-h-[calc(100vh-150px)] select-none"
        style={{ display: "block", userSelect: "none" }}
        onLoad={() => updateDimensions()}
        draggable={false}
        priority
      />

      {/* Marqueurs d'articles */}
      {articles.map((article) => {
        if (
          !article.positionX ||
          !article.positionY ||
          article.positionX < 0 ||
          article.positionX > 100 ||
          article.positionY < 0 ||
          article.positionY > 100
        ) {
          return null;
        }

        const isActive =
          hoveredArticleId === article.id || selectedArticleId === article.id;
        const isDraggingThis =
          drag.isDragging && drag.draggingArticleId === article.id;
        const isResizingThis =
          resize.isResizing && resize.resizingArticleId === article.id;

        return (
          <ArticleMarker
            key={article.id}
            article={article}
            style={calculateArticleStyle(article)}
            isActive={isActive}
            isDragging={isDraggingThis}
            isResizing={isResizingThis}
            isEditable={isEditable}
            dragMode={dragMode}
            resizeMode={resizeMode}
            createMode={createMode}
            preventPopoverOpen={
              drag.preventPopoverOpen || resize.preventPopoverOpen
            }
            popoverOpen={openPopoverId === article.id}
            onPopoverOpenChange={(open) => {
              console.log(
                "📝 Popover open change for article:",
                article.id,
                "open:",
                open,
              );
              setOpenPopoverId(open ? article.id : null);
            }}
            onClick={(e) => handleArticleInteraction(e, article)}
            onMouseDown={(e) => {
              if (createMode) {
                e.stopPropagation();
                return;
              }
              if (dragMode && onArticlePositionUpdate && !resizeMode) {
                const target = e.target as HTMLElement;
                if (!target.closest(".resize-handle")) {
                  drag.handleDragStart(e, article, calculateArticleCenter);
                }
              }
            }}
            onMouseEnter={(e) => handleArticleMouseEnter(e, article)}
            onMouseLeave={handleArticleMouseLeave}
            onContextMenu={(e) => handleContextMenu(e, article)}
            onMoveClick={() => setDragMode(true)}
            onResizeClick={() => setResizeMode(true)}
            onEditClick={() => modals.openEditModal(article)}
            onDeleteClick={() => modals.openDeleteModal(article)}
            onResizeStart={(e, handle) =>
              resize.handleResizeStart(e, article, handle)
            }
            hasPositionUpdate={!!onArticlePositionUpdate}
          />
        );
      })}

      {/* Rectangle de dessin */}
      {drawing.isDrawingNew && (
        <div style={drawing.getDrawingRectStyle() || undefined} />
      )}

      {/* Modals */}
      <EditArticleModal
        open={modals.editModalOpen}
        article={modals.editingArticle}
        title={modals.editForm.title}
        description={modals.editForm.description}
        isLoading={modals.isLoadingEdit}
        onTitleChange={(title) =>
          modals.setEditForm({ ...modals.editForm, title })
        }
        onDescriptionChange={(description) =>
          modals.setEditForm({ ...modals.editForm, description })
        }
        onSave={modals.handleSaveEdit}
        onCancel={modals.handleCancelEdit}
      />

      <DeleteArticleModal
        open={modals.deleteModalOpen}
        article={modals.deletingArticle}
        confirmText={modals.deleteConfirmText}
        isDeleting={modals.isDeleting}
        onConfirmTextChange={modals.setDeleteConfirmText}
        onConfirm={modals.handleConfirmDelete}
        onCancel={modals.handleCancelDelete}
      />

      <CreateArticleModal
        open={modals.createModalOpen}
        title={modals.createForm.title}
        description={modals.createForm.description}
        positionX={modals.createForm.positionX}
        positionY={modals.createForm.positionY}
        width={modals.createForm.width}
        height={modals.createForm.height}
        isCreating={modals.isCreating}
        onTitleChange={(title) =>
          modals.setCreateForm({ ...modals.createForm, title })
        }
        onDescriptionChange={(description) =>
          modals.setCreateForm({ ...modals.createForm, description })
        }
        onPositionXChange={(positionX) =>
          modals.setCreateForm({ ...modals.createForm, positionX })
        }
        onPositionYChange={(positionY) =>
          modals.setCreateForm({ ...modals.createForm, positionY })
        }
        onWidthChange={(width) =>
          modals.setCreateForm({ ...modals.createForm, width })
        }
        onHeightChange={(height) =>
          modals.setCreateForm({ ...modals.createForm, height })
        }
        onSave={modals.handleSaveCreate}
        onCancel={modals.handleCancelCreate}
      />
    </div>
  );
}
