"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Move, X, Edit, Trash } from "lucide-react";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

type ResizeType =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | null;

export default function ArticleEditor({
  sectorId,
  initialArticles = [],
  children,
}: {
  sectorId: string;
  initialArticles?: Article[];
  children?: React.ReactNode;
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null
  );
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<ResizeType>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [newArticleStart, setNewArticleStart] = useState({ x: 0, y: 0 });
  const [newArticleSize, setNewArticleSize] = useState({ width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalArticle, setModalArticle] = useState<{
    id?: string;
    title: string;
    description: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
  }>({
    title: "",
    description: "",
    positionX: 0,
    positionY: 0,
    width: 10,
    height: 10,
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (initialArticles.length === 0) {
      fetchArticles();
    }
  }, [initialArticles, sectorId]);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`/api/sectors/${sectorId}/articles`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        toast.error("Erreur lors du chargement des articles");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des articles");
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingArticle && !isDraggingNew) {
      return;
    }
    setSelectedArticleId(null);
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingArticle && containerRef.current && !isDraggingNew) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setNewArticleStart({ x, y });
      setNewArticleSize({ width: 0, height: 0 });
      setIsDraggingNew(true);
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingNew && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;
      const width = Math.abs(currentX - newArticleStart.x);
      const height = Math.abs(currentY - newArticleStart.y);
      setNewArticleSize({ width, height });
    } else if (isDragging || isResizing) {
      handleMouseMove(e);
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingNew && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;
      const minX = Math.min(newArticleStart.x, currentX);
      const minY = Math.min(newArticleStart.y, currentY);
      const width = Math.abs(currentX - newArticleStart.x);
      const height = Math.abs(currentY - newArticleStart.y);

      if (width < 2 || height < 2) {
        const centerX = (newArticleStart.x + currentX) / 2;
        const centerY = (newArticleStart.y + currentY) / 2;
        setModalArticle({
          ...modalArticle,
          positionX: centerX,
          positionY: centerY,
          width: 2,
          height: 2,
        });
      } else {
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;
        setModalArticle({
          ...modalArticle,
          positionX: centerX,
          positionY: centerY,
          width,
          height,
        });
      }

      setIsDraggingNew(false);
      setIsAddingArticle(false);
      setShowModal(true);
    } else if (isDragging || isResizing) {
      stopDraggingOrResizing();
    }
  };

  const startDragging = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setSelectedArticleId(article.id);
    setIsDragging(true);
    if (
      containerRef.current &&
      article.positionX != null &&
      article.positionY != null
    ) {
      const rect = containerRef.current.getBoundingClientRect();
      const articleX = (article.positionX / 100) * rect.width;
      const articleY = (article.positionY / 100) * rect.height;
      setDragOffset({
        x: e.clientX - rect.left - articleX,
        y: e.clientY - rect.top - articleY,
      });
    }
  };

  const startResizing = (
    e: React.MouseEvent,
    article: Article,
    type: ResizeType
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedArticleId(article.id);
    setIsResizing(true);
    setResizeType(type);
    setResizeStart({
      x: article.positionX ?? 0,
      y: article.positionY ?? 0,
      width: article.width ?? 20,
      height: article.height ?? 20,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedArticleId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      const posX = (x / rect.width) * 100;
      const posY = (y / rect.height) * 100;
      setArticles(
        articles.map((article) =>
          article.id === selectedArticleId
            ? {
                ...article,
                positionX: Math.max(0, Math.min(posX, 100)),
                positionY: Math.max(0, Math.min(posY, 100)),
              }
            : article
        )
      );
    } else if (
      isResizing &&
      selectedArticleId &&
      resizeType &&
      containerRef.current
    ) {
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newPosX = resizeStart.x;
      let newPosY = resizeStart.y;

      if (["right", "topRight", "bottomRight"].includes(resizeType)) {
        newWidth = Math.max(2, mouseX - newPosX + resizeStart.width / 2);
      }
      if (["left", "topLeft", "bottomLeft"].includes(resizeType)) {
        const rightEdge = resizeStart.x + resizeStart.width;
        newWidth = Math.max(2, rightEdge - mouseX);
        newPosX = mouseX;
      }
      if (["bottom", "bottomLeft", "bottomRight"].includes(resizeType)) {
        newHeight = Math.max(2, mouseY - newPosY + resizeStart.height / 2);
      }
      if (["top", "topLeft", "topRight"].includes(resizeType)) {
        const bottomEdge = resizeStart.y + resizeStart.height;
        newHeight = Math.max(2, bottomEdge - mouseY);
        newPosY = mouseY;
      }

      setArticles(
        articles.map((article) =>
          article.id === selectedArticleId
            ? {
                ...article,
                width: Math.min(newWidth, 50),
                height: Math.min(newHeight, 50),
                positionX: Math.max(0, Math.min(newPosX, 100)),
                positionY: Math.max(0, Math.min(newPosY, 100)),
              }
            : article
        )
      );
    }
  };

  const stopDraggingOrResizing = async () => {
    if ((isDragging || isResizing) && selectedArticleId) {
      const article = articles.find((a) => a.id === selectedArticleId);
      if (article) {
        try {
          await saveArticle(article);
          toast.success(
            isDragging ? "Position mise à jour" : "Dimensions mises à jour"
          );
        } catch (error) {
          console.error("Error updating article:", error);
          toast.error("Erreur lors de la mise à jour de l'article");
        }
      }
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeType(null);
  };

  const saveArticle = async (article: Article) => {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: article.id,
        title: article.title,
        description: article.description,
        positionX: article.positionX,
        positionY: article.positionY,
        width: article.width,
        height: article.height,
        sectorId,
      }),
    });
    if (!response.ok)
      throw new Error("Erreur lors de la sauvegarde de l'article");
    return await response.json();
  };

  const handleSaveModal = async () => {
    try {
      const articleData = { ...modalArticle, sectorId };
      const savedArticle = await saveArticle(articleData as Article);
      if (modalArticle.id) {
        setArticles(
          articles.map((a) => (a.id === modalArticle.id ? savedArticle : a))
        );
      } else {
        setArticles([...articles, savedArticle]);
      }
      setShowModal(false);
      toast.success("Article sauvegardé avec succès");
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Erreur lors de la sauvegarde de l'article");
    }
  };

  const handleEditArticle = (article: Article) => {
    setModalArticle({
      id: article.id,
      title: article.title,
      description: article.description || "",
      positionX: article.positionX || 0,
      positionY: article.positionY || 0,
      width: article.width || 20,
      height: article.height || 20,
    });
    setShowModal(true);
  };

  const handleDeleteArticle = async (article: Article) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("Erreur lors de la suppression de l'article");
      setArticles(articles.filter((a) => a.id !== article.id));
      setSelectedArticleId(null);
      toast.success("Article supprimé avec succès");
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Erreur lors de la suppression de l'article");
    }
  };

  const handleArticleClick = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const articleCenterX = ((article.positionX ?? 0) / 100) * rect.width;
      const articleTopY =
        (((article.positionY ?? 0) - (article.height ?? 20) / 2) / 100) *
        rect.height;
      setTooltipPosition({
        x: articleCenterX,
        y: Math.max(20, articleTopY - 10),
      });
    }
    setSelectedArticleId(article.id);
  };

  const renderResizeHandles = (article: Article) => {
    if (selectedArticleId !== article.id) return null;
    const handleStyle =
      "absolute w-3 h-3 bg-blue-500 border border-white rounded-full z-10";
    const edgeStyle = "absolute bg-transparent z-10";
    return (
      <>
        <div
          className={`${edgeStyle} top-0 left-0 right-0 h-2 cursor-ns-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "top");
          }}
        />
        <div
          className={`${edgeStyle} bottom-0 left-0 right-0 h-2 cursor-ns-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "bottom");
          }}
        />
        <div
          className={`${edgeStyle} left-0 top-2 bottom-2 w-2 cursor-ew-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "left");
          }}
        />
        <div
          className={`${edgeStyle} right-0 top-2 bottom-2 w-2 cursor-ew-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "right");
          }}
        />
        <div
          className={`${handleStyle} top-0 left-0 -mt-1.5 -ml-1.5 cursor-nwse-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "topLeft");
          }}
        />
        <div
          className={`${handleStyle} top-0 right-0 -mt-1.5 -mr-1.5 cursor-nesw-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "topRight");
          }}
        />
        <div
          className={`${handleStyle} bottom-0 left-0 -mb-1.5 -ml-1.5 cursor-nesw-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "bottomLeft");
          }}
        />
        <div
          className={`${handleStyle} bottom-0 right-0 -mb-1.5 -mr-1.5 cursor-nwse-resize`}
          onMouseDown={(e) => {
            e.stopPropagation();
            startResizing(e, article, "bottomRight");
          }}
        />
      </>
    );
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 p-2 bg-white border-b">
        <button
          onClick={() => {
            setIsAddingArticle(!isAddingArticle);
            setIsDraggingNew(false);
            setSelectedArticleId(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded ${
            isAddingArticle ? "bg-blue-100 text-blue-700" : "bg-gray-100"
          }`}
        >
          <Plus size={16} />
          <span>
            {isAddingArticle
              ? "Dessinez pour placer un article"
              : "Ajouter un article"}
          </span>
        </button>
      </div>

      {/* Drawing area */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${
          isAddingArticle ? "cursor-crosshair" : ""
        }`}
        onClick={handleContainerClick}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
      >
        <div className="relative">
          <div className="w-full min-h-[500px] bg-gray-200">{children}</div>

          {articles.map((article) => {
            if (article.positionX == null || article.positionY == null)
              return null;
            return (
              <div
                key={article.id}
                className={`absolute border ${
                  selectedArticleId === article.id
                    ? "border-blue-500"
                    : "border-white"
                } rounded-md shadow-md overflow-hidden`}
                style={{
                  left: `${article.positionX}%`,
                  top: `${article.positionY}%`,
                  width: `${article.width || 20}%`,
                  height: `${article.height || 20}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: selectedArticleId === article.id ? 10 : 5,
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                }}
                onClick={(e) => handleArticleClick(e, article)}
              >
                {renderResizeHandles(article)}
              </div>
            );
          })}

          {selectedArticleId &&
            (() => {
              const article = articles.find((a) => a.id === selectedArticleId);
              if (!article) return null;
              return (
                <div
                  className="absolute z-30 bg-white border shadow-lg rounded-md p-2 flex flex-col gap-2 w-48"
                  style={{
                    top: `${tooltipPosition.y}px`,
                    left: `${tooltipPosition.x}px`,
                    transform: "translate(-50%, -100%)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm truncate">
                      {article.title}
                    </span>
                  </div>
                  {article.description && (
                    <div className="text-xs mb-2 text-gray-600 max-h-20 overflow-y-auto">
                      {article.description}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startDragging(e, article);
                      }}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Move size={14} />
                      <span>Déplacer</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditArticle(article);
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={14} />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article);
                      }}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                    >
                      <Trash size={14} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
                </div>
              );
            })()}

          {isDraggingNew && isAddingArticle && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-50 rounded-md z-20"
              style={{
                left: `${Math.min(
                  newArticleStart.x,
                  newArticleStart.x + newArticleSize.width
                )}%`,
                top: `${Math.min(
                  newArticleStart.y,
                  newArticleStart.y + newArticleSize.height
                )}%`,
                width: `${newArticleSize.width}%`,
                height: `${newArticleSize.height}%`,
              }}
            />
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {modalArticle.id ? "Modifier l'article" : "Nouvel article"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={modalArticle.title}
                  onChange={(e) =>
                    setModalArticle({ ...modalArticle, title: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={modalArticle.description}
                  onChange={(e) =>
                    setModalArticle({
                      ...modalArticle,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Largeur (%)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={modalArticle.width}
                    onChange={(e) =>
                      setModalArticle({
                        ...modalArticle,
                        width: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hauteur (%)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={modalArticle.height}
                    onChange={(e) =>
                      setModalArticle({
                        ...modalArticle,
                        height: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveModal}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
