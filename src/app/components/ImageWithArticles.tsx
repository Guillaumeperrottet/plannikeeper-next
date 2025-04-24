// Modification du composant ImageWithArticles.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";

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
  });

  // Gérer le redimensionnement et le montage initial
  useEffect(() => {
    setMounted(true);

    const updateDimensions = () => {
      if (!containerRef.current || !imageRef.current) return;

      const image = imageRef.current;
      const { width: displayWidth, height: displayHeight } =
        image.getBoundingClientRect();

      // Calculer les ratios de mise à l'échelle entre les dimensions originales et affichées
      const scaleX = originalWidth / displayWidth;
      const scaleY = originalHeight / displayHeight;

      setImageSize({
        displayWidth,
        displayHeight,
        scaleX,
        scaleY,
      });
    };

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // S'assurer que les dimensions sont mises à jour lorsque l'image est chargée
    if (imageRef.current) {
      imageRef.current.onload = updateDimensions;

      // Si l'image est déjà chargée (depuis le cache), exécuter updateDimensions
      if (imageRef.current.complete) {
        updateDimensions();
      }
    }

    // Mise à jour lors du redimensionnement de la fenêtre
    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [originalWidth, originalHeight]);

  if (!mounted) {
    return null; // Éviter le rendu côté serveur pour ce composant
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", height: "auto" }}
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

        return (
          <div
            key={article.id}
            className={`absolute border ${
              selectedArticleId === article.id
                ? "border-blue-500"
                : "border-white"
            } rounded-md shadow-md overflow-hidden cursor-pointer pointer-events-auto`}
            style={{
              left: `${article.positionX}%`,
              top: `${article.positionY}%`,
              width: `${article.width || 20}%`,
              height: `${article.height || 20}%`,
              transform: "translate(-50%, -50%)",
              zIndex:
                hoveredArticleId === article.id ||
                selectedArticleId === article.id
                  ? 10
                  : 5,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
            onClick={() => onArticleClick && onArticleClick(article.id)}
            onMouseEnter={() => onArticleHover && onArticleHover(article.id)}
            onMouseLeave={() => onArticleHover && onArticleHover(null)}
          >
            {/* Contenu de l'article ici, si nécessaire */}
            {hoveredArticleId === article.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-black bg-opacity-80 text-white p-2 rounded shadow-lg z-30">
                <div className="font-bold text-sm truncate">
                  {article.title}
                </div>
                {article.description && (
                  <div className="text-xs mt-1 opacity-80 max-h-20 overflow-y-auto">
                    {article.description}
                  </div>
                )}
                <div className="mt-2 text-xs text-center">
                  <span className="text-blue-300">
                    Cliquez pour gérer les tâches
                  </span>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-opacity-80"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
