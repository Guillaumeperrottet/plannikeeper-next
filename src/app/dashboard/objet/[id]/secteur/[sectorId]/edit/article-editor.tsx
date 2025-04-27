"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Move, X, Edit, Trash, ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

type ImageInfo = {
  displayWidth: number; // Largeur d'affichage effective en pixels
  displayHeight: number; // Hauteur d'affichage effective en pixels
  originalWidth: number; // Largeur originale de l'image
  originalHeight: number; // Hauteur originale de l'image
  scaleX: number; // Facteur d'échelle en X
  scaleY: number; // Facteur d'échelle en Y
  aspectRatio: number; // Rapport hauteur/largeur original
  offsetX: number; // Décalage X pour centrer l'image
  offsetY: number; // Décalage Y pour centrer l'image
};

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
  const imageRef = useRef<HTMLImageElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [imageInfo, setImageInfo] = useState<ImageInfo>({
    displayWidth: 0,
    displayHeight: 0,
    originalWidth: imageWidth || 1200, // Valeur par défaut si null
    originalHeight: imageHeight || 900, // Valeur par défaut si null
    scaleX: 1,
    scaleY: 1,
    aspectRatio: (imageWidth || 1200) / (imageHeight || 900),
    offsetX: 0,
    offsetY: 0,
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

  const router = useRouter();

  // Fonction pour mettre à jour les dimensions de l'image
  const updateImageDimensions = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const image = imageRef.current;

    // S'assurer que l'image est chargée
    if (!image.complete) return;

    // Dimensions réelles du conteneur
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Dimensions réelles de l'image affichée
    const imageRect = image.getBoundingClientRect();
    const displayWidth = imageRect.width;
    const displayHeight = imageRect.height;

    // Dimensions originales de l'image
    const originalWidth = imageWidth || image.naturalWidth;
    const originalHeight = imageHeight || image.naturalHeight;
    const originalAspectRatio = originalWidth / originalHeight;

    // Déterminer comment l'image est contrainte (par largeur ou hauteur)
    let effectiveWidth, effectiveHeight;

    if (displayWidth / displayHeight > originalAspectRatio) {
      // Contrainte par la hauteur
      effectiveHeight = displayHeight;
      effectiveWidth = effectiveHeight * originalAspectRatio;
    } else {
      // Contrainte par la largeur
      effectiveWidth = displayWidth;
      effectiveHeight = effectiveWidth / originalAspectRatio;
    }

    // Calcul des facteurs d'échelle
    const scaleX = originalWidth / effectiveWidth;
    const scaleY = originalHeight / effectiveHeight;

    // Calcul des offsets pour centrer l'image
    const offsetX = (containerWidth - effectiveWidth) / 2;
    const offsetY = (containerHeight - effectiveHeight) / 2;

    setImageInfo({
      displayWidth: effectiveWidth,
      displayHeight: effectiveHeight,
      originalWidth,
      originalHeight,
      scaleX,
      scaleY,
      aspectRatio: originalAspectRatio,
      offsetX,
      offsetY,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("Editor image dimensions updated:", {
        container: { width: containerWidth, height: containerHeight },
        display: { width: displayWidth, height: displayHeight },
        effective: { width: effectiveWidth, height: effectiveHeight },
        original: { width: originalWidth, height: originalHeight },
        scale: { x: scaleX, y: scaleY },
        offset: { x: offsetX, y: offsetY },
      });
    }
  }, [imageWidth, imageHeight]);

  // Configuration du ResizeObserver
  useEffect(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        updateImageDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateImageDimensions]);

  // Gestion du chargement de l'image
  useEffect(() => {
    const handleImageLoad = () => {
      // Mise à jour immédiate
      updateImageDimensions();

      // Mises à jour différées pour garantir un rendu complet
      setTimeout(updateImageDimensions, 50);
      setTimeout(updateImageDimensions, 200);
      setTimeout(updateImageDimensions, 500);
    };

    if (imageRef.current) {
      imageRef.current.addEventListener("load", handleImageLoad);

      if (imageRef.current.complete) {
        handleImageLoad(); // Utiliser la même logique avec délais
      }
    }

    // Enregistrer le gestionnaire pour les redimensionnements de fenêtre
    const handleResize = () => {
      updateImageDimensions();
      // Ajouter un délai pour s'assurer que le navigateur a terminé le redimensionnement
      setTimeout(updateImageDimensions, 100);
    };
    window.addEventListener("resize", handleResize);

    // Force une mise à jour après un court délai au montage du composant
    const initialTimer = setTimeout(updateImageDimensions, 100);

    return () => {
      if (imageRef.current) {
        imageRef.current.removeEventListener("load", handleImageLoad);
      }
      window.removeEventListener("resize", handleResize);
      clearTimeout(initialTimer);
    };
  }, [updateImageDimensions]);

  // Mettre à jour quand imageSrc change
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      updateImageDimensions();
    }
  }, [imageSrc, updateImageDimensions]);

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

  // Convertir les coordonnées pourcentage en pixels absolus (avec décalages)
  const percentToPixels = useCallback(
    (article: Article): AbsolutePosition => {
      if (!imageInfo.displayWidth || !imageInfo.displayHeight) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      const xPercent = article.positionX || 0;
      const yPercent = article.positionY || 0;
      const widthPercent = article.width || 20;
      const heightPercent = article.height || 20;

      // Conversion en tenant compte du décalage pour centrer l'image
      return {
        x: (xPercent / 100) * imageInfo.displayWidth + imageInfo.offsetX,
        y: (yPercent / 100) * imageInfo.displayHeight + imageInfo.offsetY,
        width: (widthPercent / 100) * imageInfo.displayWidth,
        height: (heightPercent / 100) * imageInfo.displayHeight,
      };
    },
    [imageInfo]
  );

  // Convertir les coordonnées de pixels en pourcentage (avec compensation de décalage)
  const pixelsToPercent = useCallback(
    (position: AbsolutePosition): Article => {
      if (!imageInfo.displayWidth || !imageInfo.displayHeight) {
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

      // Convertir en pourcentages en compensant le décalage
      return {
        id: "",
        title: "",
        description: "",
        positionX:
          ((position.x - imageInfo.offsetX) / imageInfo.displayWidth) * 100,
        positionY:
          ((position.y - imageInfo.offsetY) / imageInfo.displayHeight) * 100,
        width: (position.width / imageInfo.displayWidth) * 100,
        height: (position.height / imageInfo.displayHeight) * 100,
      };
    },
    [imageInfo]
  );

  // Obtenir les coordonnées de la souris relatives à l'image
  const getMouseCoordinates = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      if (!containerRef.current) {
        return { x: 0, y: 0 };
      }

      const containerRect = containerRef.current.getBoundingClientRect();

      // Position relative au conteneur
      return {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      };
    },
    []
  );

  // Vérifier si les coordonnées sont dans les limites de l'image
  const isInImageBounds = useCallback(
    (x: number, y: number): boolean => {
      if (!imageInfo.displayWidth || !imageInfo.displayHeight) return false;

      // Vérifier si le point (x, y) est à l'intérieur de l'image (en tenant compte du décalage)
      const imageLeft = imageInfo.offsetX;
      const imageRight = imageInfo.offsetX + imageInfo.displayWidth;
      const imageTop = imageInfo.offsetY;
      const imageBottom = imageInfo.offsetY + imageInfo.displayHeight;

      return (
        x >= imageLeft && x <= imageRight && y >= imageTop && y <= imageBottom
      );
    },
    [imageInfo]
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

      // Vérifier si le clic est dans les limites de l'image
      if (!isInImageBounds(x, y)) return;

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

      // Convertir en pourcentages (en compensant pour le décalage)
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

      // Limites de l'image (en tenant compte du décalage)
      const minX = imageInfo.offsetX + halfWidth;
      const maxX = imageInfo.offsetX + imageInfo.displayWidth - halfWidth;
      const minY = imageInfo.offsetY + halfHeight;
      const maxY = imageInfo.offsetY + imageInfo.displayHeight - halfHeight;

      // Position contrainte
      const constrainedX = Math.max(minX, Math.min(newX, maxX));
      const constrainedY = Math.max(minY, Math.min(newY, maxY));

      // Convertir en pourcentages, en tenant compte du décalage
      const percentPosition = pixelsToPercent({
        x: constrainedX,
        y: constrainedY,
        width: articleSize.width,
        height: articleSize.height,
      });

      // Mettre à jour l'article
      setArticles(
        articles.map((a) =>
          a.id === selectedArticleId
            ? {
                ...a,
                positionX: percentPosition.positionX,
                positionY: percentPosition.positionY,
              }
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

      // Limites de l'image (en tenant compte du décalage)
      const minX = imageInfo.offsetX + halfNewWidth;
      const maxX = imageInfo.offsetX + imageInfo.displayWidth - halfNewWidth;
      const minY = imageInfo.offsetY + halfNewHeight;
      const maxY = imageInfo.offsetY + imageInfo.displayHeight - halfNewHeight;

      // Ajuster la position si nécessaire pour éviter de sortir des limites
      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      // Convertir en pourcentages, en tenant compte du décalage
      const percentPosition = pixelsToPercent({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });

      // Maximum 50% de l'image (en pourcentage)
      const maxWidthPercent = Math.min(percentPosition.width!, 50);
      const maxHeightPercent = Math.min(percentPosition.height!, 50);

      // Mettre à jour l'article
      setArticles(
        articles.map((a) =>
          a.id === selectedArticleId
            ? {
                ...a,
                positionX: percentPosition.positionX,
                positionY: percentPosition.positionY,
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

      // Positionner le tooltip au-dessus de l'article
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

  // Calculer la position et les dimensions d'un article
  const calculateArticleStyle = useCallback(
    (article: Article) => {
      if (
        !article.positionX ||
        !article.positionY ||
        !imageInfo.displayWidth ||
        !imageInfo.displayHeight
      ) {
        return {};
      }

      // Convertir les pourcentages en pixels en tenant compte du décalage
      const xPos =
        (article.positionX / 100) * imageInfo.displayWidth + imageInfo.offsetX;
      const yPos =
        (article.positionY / 100) * imageInfo.displayHeight + imageInfo.offsetY;
      const width = ((article.width || 20) / 100) * imageInfo.displayWidth;
      const height = ((article.height || 20) / 100) * imageInfo.displayHeight;

      return {
        left: `${xPos}px`,
        top: `${yPos}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: "translate(-50%, -50%)",
      };
    },
    [imageInfo]
  );

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="sticky top-0 left-10 z-10 p-4 bg-backgroundround w-full flex justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-12 top-1/2 -translate-y-1/2"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <Button
          type="button"
          variant="outline"
          className={`flex items-center gap-2 px-3 py-2 rounded ${
            isAddingArticle ? "bg-blue-100 text-blue-700" : ""
          }`}
          onClick={() => {
            setIsAddingArticle(!isAddingArticle);
            setIsDraggingNew(false);
            setSelectedArticleId(null);
          }}
        >
          <Plus size={16} />
          <span>
            {isAddingArticle
              ? "Dessinez pour placer un article"
              : "Ajouter un article"}
          </span>
        </Button>
      </div>

      {/* Espace de dessin */}
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
            ref={imageRef}
            src={imageSrc}
            alt={imageAlt}
            className="block w-full h-auto max-h-[calc(100vh-150px)]"
            style={{ objectFit: "contain" }}
          />

          {/* Articles */}
          {articles.map((article) => {
            if (article.positionX == null || article.positionY == null)
              return null;

            const articleStyle = calculateArticleStyle(article);

            return (
              <div
                key={article.id}
                className={`absolute border ${
                  selectedArticleId === article.id
                    ? "border-blue-500"
                    : "border-white"
                } rounded-md shadow-md overflow-hidden pointer-events-auto`}
                style={{
                  ...articleStyle,
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
                  className="absolute z-30 bg-background border shadow-lg rounded-md p-2 flex flex-col gap-2 w-48"
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
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
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
