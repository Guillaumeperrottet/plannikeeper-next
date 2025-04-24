// src/app/dashboard/objet/[id]/secteur/[sectorId]/edit/article-editor.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Move, X, Edit, Trash } from "lucide-react";
import ImageWithArticles from "@/app/components/ImageWithArticles";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null; // Stocké en pourcentage
  positionY: number | null; // Stocké en pourcentage
  width: number | null; // Stocké en pourcentage
  height: number | null; // Stocké en pourcentage
};

// Coordonnées en pixels pour utilisation interne
type AbsolutePosition = {
  x: number; // Position X en pixels
  y: number; // Position Y en pixels
  width: number; // Largeur en pixels
  height: number; // Hauteur en pixels
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
  imageWidth = null,
  imageHeight = null,
  imageSrc,
  imageAlt,
}: {
  sectorId: string;
  initialArticles?: Article[];
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageSrc: string;
  imageAlt: string;
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
  const [resizeStart, setResizeStart] = useState<AbsolutePosition>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [newArticleStart, setNewArticleStart] = useState({ x: 0, y: 0 });
  const [newArticleSize, setNewArticleSize] = useState({ width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
    ratio: 1,
  });

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

  // Obtenir les dimensions de l'image
  useEffect(() => {
    const handleImageLoaded = (event: Event) => {
      const img = event.target as HTMLImageElement;
      const { width, height } = img.getBoundingClientRect();
      setImageSize({
        width,
        height,
        ratio: (imageWidth || width) / width,
      });
    };

    const updateImageSize = () => {
      if (containerRef.current) {
        const imageElement = containerRef.current.querySelector("img");
        if (imageElement) {
          const { width, height } = imageElement.getBoundingClientRect();
          setImageSize({
            width,
            height,
            ratio: Math.max(
              (imageWidth || width) / width,
              (imageHeight || height) / height
            ),
          });
        }
      }
    };

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(updateImageSize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      const imageElement = containerRef.current.querySelector("img");
      if (imageElement) {
        imageElement.addEventListener("load", handleImageLoaded);
      }
    }

    window.addEventListener("resize", updateImageSize);

    return () => {
      if (containerRef.current) {
        const imageElement = containerRef.current.querySelector("img");
        if (imageElement) {
          imageElement.removeEventListener("load", handleImageLoaded);
        }
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateImageSize);
    };
  }, [imageWidth]);

  const fetchArticles = useCallback(async () => {
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
  }, [sectorId]);

  useEffect(() => {
    if (initialArticles.length === 0) {
      fetchArticles();
    }
  }, [initialArticles, fetchArticles]);

  // Convertir les coordonnées de pourcentage en pixels
  const percentToPixels = useCallback(
    (article: Article): AbsolutePosition => {
      if (!imageSize.width || !imageSize.height) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      return {
        x: imageSize.width * ((article.positionX || 0) / 100),
        y: imageSize.height * ((article.positionY || 0) / 100),
        width: imageSize.width * ((article.width || 20) / 100),
        height: imageSize.height * ((article.height || 20) / 100),
      };
    },
    [imageSize]
  );

  // Convertir les coordonnées de pixels en pourcentage
  const pixelsToPercent = useCallback(
    (position: AbsolutePosition): Article => {
      if (!imageSize.width || !imageSize.height) {
        return {
          id: "",
          title: "",
          description: "",
          positionX: 0,
          positionY: 0,
          width: 20,
          height: 20,
        };
      }

      return {
        id: "",
        title: "",
        description: "",
        positionX: (position.x / imageSize.width) * 100,
        positionY: (position.y / imageSize.height) * 100,
        width: (position.width / imageSize.width) * 100,
        height: (position.height / imageSize.height) * 100,
      };
    },
    [imageSize]
  );

  // Obtenir les coordonnées réelles de la souris par rapport à l'image
  const getMouseCoordinates = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      if (!containerRef.current || !imageSize.width || !imageSize.height) {
        return { x: 0, y: 0 };
      }

      const rect = containerRef.current.getBoundingClientRect();
      const imageRect = containerRef.current
        .querySelector("img")
        ?.getBoundingClientRect();

      if (!imageRect) {
        return { x: 0, y: 0 };
      }

      return {
        x: e.clientX - imageRect.left,
        y: e.clientY - imageRect.top,
      };
    },
    [imageSize]
  );

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingArticle && !isDraggingNew) {
      return;
    }
    setSelectedArticleId(null);
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingArticle && !isDraggingNew && containerRef.current) {
      const { x, y } = getMouseCoordinates(e);
      setNewArticleStart({ x, y });
      setNewArticleSize({ width: 0, height: 0 });
      setIsDraggingNew(true);
      e.preventDefault(); // Empêcher la sélection de texte
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingNew) {
      const { x, y } = getMouseCoordinates(e);
      const width = Math.abs(x - newArticleStart.x);
      const height = Math.abs(y - newArticleStart.y);
      setNewArticleSize({ width, height });
    } else if (isDragging || isResizing) {
      handleMouseMove(e);
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingNew) {
      const { x, y } = getMouseCoordinates(e);
      const minX = Math.min(newArticleStart.x, x);
      const minY = Math.min(newArticleStart.y, y);
      const width = Math.abs(x - newArticleStart.x);
      const height = Math.abs(y - newArticleStart.y);

      // Créer l'article en pixels puis convertir en pourcentages
      const articleInPixels: AbsolutePosition = {
        x: minX + width / 2, // Centre X
        y: minY + height / 2, // Centre Y
        width: Math.max(width, 20), // Minimum 20px de large
        height: Math.max(height, 20), // Minimum 20px de haut
      };

      // Convertir en pourcentages
      const articleInPercent = pixelsToPercent(articleInPixels);

      setModalArticle({
        title: "",
        description: "",
        positionX: articleInPercent.positionX || 0,
        positionY: articleInPercent.positionY || 0,
        width: articleInPercent.width || 10,
        height: articleInPercent.height || 10,
      });

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

    if (containerRef.current) {
      // Convertir les coordonnées en pourcentage en pixels
      const articleInPixels = percentToPixels(article);

      // Calculer l'offset du drag
      const { x, y } = getMouseCoordinates(e);
      setDragOffset({
        x: x - articleInPixels.x,
        y: y - articleInPixels.y,
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

    // Convertir les coordonnées en pourcentage en pixels pour le début du resize
    setResizeStart(percentToPixels(article));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedArticleId && containerRef.current) {
      const { x, y } = getMouseCoordinates(e);
      const article = articles.find((a) => a.id === selectedArticleId);

      if (!article) return;

      // Position absolue du nouvel emplacement (en pixels)
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;

      // Vérifier que l'article ne sort pas des limites de l'image
      const articleSize = percentToPixels(article);
      const halfWidth = articleSize.width / 2;
      const halfHeight = articleSize.height / 2;

      // Limites
      const minX = halfWidth;
      const maxX = imageSize.width - halfWidth;
      const minY = halfHeight;
      const maxY = imageSize.height - halfHeight;

      // Position contrainte
      const constrainedX = Math.max(minX, Math.min(newX, maxX));
      const constrainedY = Math.max(minY, Math.min(newY, maxY));

      // Convertir en pourcentages
      const xPercent = (constrainedX / imageSize.width) * 100;
      const yPercent = (constrainedY / imageSize.height) * 100;

      // Mettre à jour l'article
      setArticles(
        articles.map((a) =>
          a.id === selectedArticleId
            ? { ...a, positionX: xPercent, positionY: yPercent }
            : a
        )
      );
    } else if (
      isResizing &&
      selectedArticleId &&
      resizeType &&
      containerRef.current
    ) {
      e.preventDefault();
      const { x: mouseX, y: mouseY } = getMouseCoordinates(e);
      const article = articles.find((a) => a.id === selectedArticleId);

      if (!article) return;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x;
      let newY = resizeStart.y;

      // Calcul des nouvelles dimensions selon le type de redimensionnement
      if (["right", "topRight", "bottomRight"].includes(resizeType)) {
        newWidth = Math.max(
          20,
          mouseX - (resizeStart.x - resizeStart.width / 2)
        );
      }
      if (["left", "topLeft", "bottomLeft"].includes(resizeType)) {
        const rightEdge = resizeStart.x + resizeStart.width / 2;
        const newLeftEdge = Math.min(mouseX, rightEdge - 20);
        newWidth = (rightEdge - newLeftEdge) * 2;
        newX = (rightEdge + newLeftEdge) / 2;
      }
      if (["bottom", "bottomLeft", "bottomRight"].includes(resizeType)) {
        newHeight = Math.max(
          20,
          mouseY - (resizeStart.y - resizeStart.height / 2)
        );
      }
      if (["top", "topLeft", "topRight"].includes(resizeType)) {
        const bottomEdge = resizeStart.y + resizeStart.height / 2;
        const newTopEdge = Math.min(mouseY, bottomEdge - 20);
        newHeight = (bottomEdge - newTopEdge) * 2;
        newY = (bottomEdge + newTopEdge) / 2;
      }

      // Contraintes pour que l'article reste dans l'image
      const halfNewWidth = newWidth / 2;
      const halfNewHeight = newHeight / 2;

      // Ajuster la position si nécessaire pour éviter de sortir des limites
      newX = Math.max(
        halfNewWidth,
        Math.min(newX, imageSize.width - halfNewWidth)
      );
      newY = Math.max(
        halfNewHeight,
        Math.min(newY, imageSize.height - halfNewHeight)
      );

      // Convertir en pourcentages
      const xPercent = (newX / imageSize.width) * 100;
      const yPercent = (newY / imageSize.height) * 100;
      const widthPercent = (newWidth / imageSize.width) * 100;
      const heightPercent = (newHeight / imageSize.height) * 100;

      // Maximum 50% de l'image
      const maxWidthPercent = Math.min(widthPercent, 50);
      const maxHeightPercent = Math.min(heightPercent, 50);

      // Mettre à jour l'article
      setArticles(
        articles.map((a) =>
          a.id === selectedArticleId
            ? {
                ...a,
                positionX: xPercent,
                positionY: yPercent,
                width: maxWidthPercent,
                height: maxHeightPercent,
              }
            : a
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
      // Position du tooltip basée sur la position de l'article
      const articlePos = percentToPixels(article);
      const imageRect = containerRef.current
        .querySelector("img")
        ?.getBoundingClientRect();

      if (!imageRect) return;

      // Positionnement du tooltip au-dessus de l'article
      const tooltipX = articlePos.x;
      const tooltipY = articlePos.y - articlePos.height / 2 - 10;

      setTooltipPosition({
        x: tooltipX,
        y: Math.max(20, tooltipY),
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

  const handleArticleSelection = (articleId: string) => {
    const article = articles.find((a) => a.id === articleId);
    if (article) {
      setSelectedArticleId(articleId);

      // Position du tooltip basée sur la position de l'article
      if (containerRef.current) {
        const articlePos = percentToPixels(article);
        setTooltipPosition({
          x: articlePos.x,
          y: Math.max(20, articlePos.y - articlePos.height / 2 - 10),
        });
      }
    }
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
          <img
            src={imageSrc}
            alt={imageAlt}
            className="block w-full object-contain max-h-[calc(100vh-150px)]"
          />

          {/* Articles */}
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
                } rounded-md shadow-md overflow-hidden pointer-events-auto`}
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
                onMouseEnter={() => setHoveredArticleId(article.id)}
                onMouseLeave={() => setHoveredArticleId(null)}
              >
                {renderResizeHandles(article)}
              </div>
            );
          })}

          {/* Tooltip pour l'article sélectionné */}
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

          {/* Rectangle de sélection pour nouvel article */}
          {isDraggingNew && isAddingArticle && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-50 rounded-md z-20"
              style={{
                left: `${Math.min(
                  newArticleStart.x,
                  newArticleStart.x + newArticleSize.width
                )}px`,
                top: `${Math.min(
                  newArticleStart.y,
                  newArticleStart.y + newArticleSize.height
                )}px`,
                width: `${newArticleSize.width}px`,
                height: `${newArticleSize.height}px`,
                transform: "none", // Pas de transformation ici car on utilise des coordonnées absolues
              }}
            />
          )}
        </div>
      </div>

      {/* Modal pour éditer/créer un article */}
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
