"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

type ImageWithArticlesProps = {
  imageSrc: string;
  imageAlt: string;
  originalWidth: number;
  originalHeight: number;
  articles: Article[];
  onArticleClick?: (articleId: string) => void;
  onArticleHover?: (articleId: string | null) => void;
  hoveredArticleId?: string | null;
  selectedArticleId?: string | null;
  isEditable?: boolean;
  className?: string;
};

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
}: ImageWithArticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [mounted, setMounted] = useState(false);
  const [imageSize, setImageSize] = useState({
    displayWidth: 0,
    displayHeight: 0,
    scaleX: 1,
    scaleY: 1,
    aspectRatio: originalWidth / originalHeight,
  });

  // État pour le tooltip
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    content: {
      title: string;
      description: string | null;
    };
    position: {
      x: number;
      y: number;
    };
  }>({
    visible: false,
    content: {
      title: "",
      description: null,
    },
    position: {
      x: 0,
      y: 0,
    },
  });

  // Fonction pour mettre à jour les dimensions - extraite pour pouvoir l'appeler à différents moments
  const updateDimensions = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const image = imageRef.current;

    // Obtenir les dimensions réelles de l'élément img affiché
    const rect = image.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // L'aspect ratio original de l'image
    const originalAspectRatio = originalWidth / originalHeight;

    // L'aspect ratio de l'affichage actuel
    const displayAspectRatio = displayWidth / displayHeight;

    // Déterminer comment l'image est contrainte (par largeur ou hauteur)
    // C'est crucial pour le calcul correct des coordonnées
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

    // Calculer les facteurs d'échelle pour transformer les coordonnées
    const scaleX = originalWidth / effectiveWidth;
    const scaleY = originalHeight / effectiveHeight;

    setImageSize({
      displayWidth: effectiveWidth,
      displayHeight: effectiveHeight,
      scaleX,
      scaleY,
      aspectRatio: originalAspectRatio,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("Image dimensions updated:", {
        display: { width: displayWidth, height: displayHeight },
        effective: { width: effectiveWidth, height: effectiveHeight },
        original: { width: originalWidth, height: originalHeight },
        scales: { x: scaleX, y: scaleY },
      });
    }
  }, [originalWidth, originalHeight]);

  // Gérer le redimensionnement et le montage initial
  useEffect(() => {
    setMounted(true);

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      // Utiliser requestAnimationFrame pour limiter les appels
      window.requestAnimationFrame(() => {
        updateDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // S'assurer que les dimensions sont mises à jour lorsque l'image est chargée
    const handleImageLoad = () => {
      updateDimensions();
    };

    const timers = [
      setTimeout(() => updateDimensions(), 100),
      setTimeout(() => updateDimensions(), 500),
      setTimeout(() => updateDimensions(), 1000),
    ];

    if (imageRef.current) {
      imageRef.current.addEventListener("load", handleImageLoad);

      // Si l'image est déjà chargée (depuis le cache), exécuter updateDimensions
      if (imageRef.current.complete) {
        updateDimensions();
      }
    }

    // Mise à jour lors du redimensionnement de la fenêtre
    window.addEventListener("resize", updateDimensions);

    return () => {
      if (imageRef.current) {
        imageRef.current.removeEventListener("load", handleImageLoad);
      }
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions]);

  // Effectuer une mise à jour supplémentaire si la source de l'image change
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      // Mise à jour immédiate
      updateDimensions();

      // Mise à jour différée pour s'assurer que le navigateur a bien terminé le rendu
      const timer1 = setTimeout(() => {
        updateDimensions();
      }, 50);

      // Deuxième mise à jour différée au cas où
      const timer2 = setTimeout(() => {
        updateDimensions();
      }, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [imageSrc, updateDimensions]);

  // Calculer la position et les dimensions d'un article en tenant compte des contraintes
  const calculateArticleStyle = useCallback(
    (article: Article) => {
      if (!article.positionX || !article.positionY) {
        return {};
      }

      // Espace potentiellement non utilisé à cause du maintien du ratio d'aspect
      const unusedWidth = containerRef.current?.clientWidth
        ? containerRef.current.clientWidth - imageSize.displayWidth
        : 0;
      const unusedHeight = containerRef.current?.clientHeight
        ? containerRef.current.clientHeight - imageSize.displayHeight
        : 0;

      // Compensation pour centrer l'image dans son conteneur
      const offsetX = unusedWidth / 2;
      const offsetY = unusedHeight / 2;

      // Convertir les pourcentages en pixels dans le système de coordonnées de l'image
      const xPos = (article.positionX / 100) * imageSize.displayWidth + offsetX;
      const yPos =
        (article.positionY / 100) * imageSize.displayHeight + offsetY;
      const width = ((article.width || 20) / 100) * imageSize.displayWidth;
      const height = ((article.height || 20) / 100) * imageSize.displayHeight;

      return {
        left: `${xPos}px`,
        top: `${yPos}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: "translate(-50%, -50%)",
      };
    },
    [imageSize]
  );

  // Gérer le survol d'un article
  const handleArticleMouseEnter = (e: React.MouseEvent, article: Article) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({
      visible: true,
      content: {
        title: article.title,
        description: article.description,
      },
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    });
    if (onArticleHover) onArticleHover(article.id);
  };

  const handleArticleMouseLeave = () => {
    setTooltipInfo((prev) => ({ ...prev, visible: false }));
    if (onArticleHover) onArticleHover(null);
  };

  // Ne rien afficher pendant le premier rendu côté client
  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", position: "relative" }}
    >
      <img
        ref={imageRef}
        src={imageSrc}
        alt={imageAlt}
        className="block w-full h-auto max-h-[calc(100vh-150px)]"
        style={{ objectFit: "contain" }}
      />

      {articles.map((article) => {
        if (!article.positionX || !article.positionY) return null;

        const articleStyle = calculateArticleStyle(article);

        return (
          <div
            key={article.id}
            className={`absolute border ${
              selectedArticleId === article.id
                ? "border-blue-500"
                : "border-white"
            } rounded-md shadow-md overflow-hidden cursor-pointer pointer-events-auto ${
              isEditable ? "z-10" : ""
            }`}
            style={{
              ...articleStyle,
              zIndex:
                hoveredArticleId === article.id ||
                selectedArticleId === article.id
                  ? 10
                  : 5,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
            onClick={() => onArticleClick && onArticleClick(article.id)}
            onMouseEnter={(e) => handleArticleMouseEnter(e, article)}
            onMouseLeave={handleArticleMouseLeave}
          >
            {/* Contenu de l'article ici, si nécessaire */}
          </div>
        );
      })}

      {/* Tooltip global détaché du flux DOM */}
      {tooltipInfo.visible && (
        <div
          className="fixed w-64 bg-black bg-opacity-90 text-white p-3 rounded-md shadow-lg"
          style={{
            left: tooltipInfo.position.x,
            top: tooltipInfo.position.y - 10,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
            pointerEvents: "none",
            maxWidth: "250px",
          }}
        >
          <div className="font-bold text-sm truncate">
            {tooltipInfo.content.title}
          </div>

          {tooltipInfo.content.description && (
            <div className="text-xs mt-1 text-gray-300 max-h-20 overflow-auto">
              {tooltipInfo.content.description}
            </div>
          )}

          <div className="mt-2 text-xs text-center">
            <span className="text-blue-300">Cliquez pour gérer les tâches</span>
          </div>

          {/* Flèche pointant vers l'élément */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-8px",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid rgba(0, 0, 0, 0.9)",
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
