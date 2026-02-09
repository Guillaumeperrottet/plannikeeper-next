import React from "react";
import { Button } from "@/components/ui/button";
import { Move, Square, Edit, Trash } from "lucide-react";
import { ArticleTooltip } from "@/app/components/ArticleTooltip";
import { Article, ResizeHandle } from "../types";

type ArticleMarkerProps = {
  article: Article;
  style: React.CSSProperties;
  isActive: boolean;
  isDragging: boolean;
  isResizing: boolean;
  isEditable: boolean;
  dragMode: boolean;
  resizeMode: boolean;
  createMode: boolean;
  preventPopoverOpen: boolean;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMoveClick: () => void;
  onResizeClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
  hasPositionUpdate: boolean;
};

export function ArticleMarker({
  article,
  style,
  isActive,
  isDragging,
  isResizing,
  isEditable,
  dragMode,
  resizeMode,
  createMode,
  preventPopoverOpen,
  popoverOpen,
  onPopoverOpenChange,
  onClick,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  onMoveClick,
  onResizeClick,
  onEditClick,
  onDeleteClick,
  onResizeStart,
  hasPositionUpdate,
}: ArticleMarkerProps) {
  // Construire les actions pour le popover
  const actions = (
    <div className="flex flex-col gap-1">
      {onMoveClick && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={(e) => {
            e.stopPropagation();
            onMoveClick();
            onPopoverOpenChange(false);
          }}
        >
          <Move className="w-4 h-4 mr-2" />
          Déplacer
        </Button>
      )}
      {onResizeClick && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={(e) => {
            e.stopPropagation();
            onResizeClick();
            onPopoverOpenChange(false);
          }}
        >
          <Square className="w-4 h-4 mr-2" />
          Redimensionner
        </Button>
      )}
      {onEditClick && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
        >
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      )}
      {onDeleteClick && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
        >
          <Trash className="w-4 h-4 mr-2" />
          Supprimer
        </Button>
      )}
    </div>
  );

  const marker = (
    <div
      className={`absolute border ${
        isActive ? "border-blue-500" : "border-white"
      } rounded-md shadow-md overflow-hidden ${
        dragMode
          ? "cursor-move hover:border-blue-400"
          : resizeMode
            ? "cursor-pointer hover:border-green-400"
            : "cursor-pointer"
      } pointer-events-auto ${isEditable ? "z-10" : ""} ${
        isDragging ? "opacity-75 z-20" : ""
      } ${isResizing ? "opacity-75 z-20" : ""}`}
      style={{
        ...style,
        zIndex: isDragging || isResizing ? 20 : isActive ? 10 : 5,
        backgroundColor: dragMode
          ? "rgba(59, 130, 246, 0.3)"
          : resizeMode
            ? "rgba(34, 197, 94, 0.3)"
            : "rgba(0, 0, 0, 0.2)",
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
    >
      {/* Poignées de redimensionnement */}
      {resizeMode && (
        <>
          <div
            className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-nw-resize"
            style={{ top: "-6px", left: "-6px" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (hasPositionUpdate) onResizeStart(e, "nw");
            }}
          />
          <div
            className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-ne-resize"
            style={{ top: "-6px", right: "-6px" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (hasPositionUpdate) onResizeStart(e, "ne");
            }}
          />
          <div
            className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-sw-resize"
            style={{ bottom: "-6px", left: "-6px" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (hasPositionUpdate) onResizeStart(e, "sw");
            }}
          />
          <div
            className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-se-resize"
            style={{ bottom: "-6px", right: "-6px" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (hasPositionUpdate) onResizeStart(e, "se");
            }}
          />
        </>
      )}
    </div>
  );

  // En mode édition normal (pas de mode spécial), passer les actions à ArticleTooltip
  if (
    isEditable &&
    !createMode &&
    !dragMode &&
    !resizeMode &&
    !preventPopoverOpen
  ) {
    return (
      <ArticleTooltip
        article={article}
        open={popoverOpen}
        onOpenChange={onPopoverOpenChange}
        actions={actions}
      >
        {marker}
      </ArticleTooltip>
    );
  }

  // Sinon, utiliser juste le marker avec ArticleTooltip simple (sans actions)
  return <ArticleTooltip article={article}>{marker}</ArticleTooltip>;
}
