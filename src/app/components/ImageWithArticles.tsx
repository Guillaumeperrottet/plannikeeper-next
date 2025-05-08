// Modifications à apporter à ImageWithArticles.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

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

  // État pour détecter si l'utilisateur est sur mobile
  const [isMobile, setIsMobile] = useState(false);

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
    articleId: string | null; // Ajout d'un ID d'article pour le suivi
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
    articleId: null,
  });

  // Détecter si l'appareil est mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Fonction pour mettre à jour les dimensions - extraite pour pouvoir l'appeler à différents moments
  const updateDimensions = useCallback(() => {
    // Code inchangé pour updateDimensions
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

  // Effets inchangés...
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

    // Store a reference to the current image element
    const currentImageRef = imageRef.current;

    if (currentImageRef) {
      currentImageRef.addEventListener("load", handleImageLoad);

      // Si l'image est déjà chargée (depuis le cache), exécuter updateDimensions
      if (currentImageRef.complete) {
        updateDimensions();
      }
    }

    // Mise à jour lors du redimensionnement de la fenêtre
    window.addEventListener("resize", updateDimensions);

    return () => {
      if (currentImageRef) {
        currentImageRef.removeEventListener("load", handleImageLoad);
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

  // ** MODIFICATION POUR L'UX MOBILE **
  // Fonction pour fermer le tooltip si on en touche un autre
  const closeTooltip = () => {
    setTooltipInfo((prev) => ({ ...prev, visible: false, articleId: null }));
    if (onArticleHover) onArticleHover(null);
  };

  // Gérer le clic/toucher sur un article
  const handleArticleInteraction = (
    e: React.MouseEvent | React.TouchEvent,
    article: Article
  ) => {
    e.stopPropagation(); // Empêcher la propagation aux éléments parents

    const rect = e.currentTarget.getBoundingClientRect();

    // Si on est sur mobile, afficher/masquer le tooltip au lieu de naviguer immédiatement
    if (isMobile) {
      // Si le tooltip est déjà visible pour cet article, le fermer
      if (tooltipInfo.visible && tooltipInfo.articleId === article.id) {
        closeTooltip();
      }
      // Si c'est un nouvel article, afficher son tooltip (et fermer tout autre tooltip ouvert)
      else {
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
          articleId: article.id,
        });
        if (onArticleHover) onArticleHover(article.id);

        // Feedback haptique (vibration légère)
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
      }
    }
    // Sur desktop, comportement inchangé
    else if (onArticleClick) {
      onArticleClick(article.id);
    }
  };

  // Gérer le survol d'un article (uniquement sur desktop)
  const handleArticleMouseEnter = (e: React.MouseEvent, article: Article) => {
    if (isMobile) return; // Ignorer sur mobile

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
      articleId: article.id,
    });
    if (onArticleHover) onArticleHover(article.id);
  };

  const handleArticleMouseLeave = () => {
    if (isMobile) return; // Ignorer sur mobile

    closeTooltip();
  };

  // Gérer le clic sur le bouton "Gérer les tâches" dans le tooltip mobile
  const handleViewTasksClick = () => {
    // Si on a un ID d'article et la fonction de navigation, utiliser la navigation
    if (tooltipInfo.articleId && onArticleClick) {
      onArticleClick(tooltipInfo.articleId);
    }
  };

  // Fermer le tooltip si on clique ailleurs sur l'image
  const handleBackgroundClick = () => {
    if (tooltipInfo.visible) {
      closeTooltip();
    }
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
      onClick={handleBackgroundClick}
    >
      <Image
        ref={imageRef as React.Ref<HTMLImageElement>}
        src={imageSrc}
        alt={imageAlt}
        width={originalWidth}
        height={originalHeight}
        className="block w-full h-auto max-h-[calc(100vh-150px)]"
        style={{ objectFit: "contain" }}
        onLoadingComplete={updateDimensions}
        priority
      />

      {articles.map((article: Article) => {
        if (!article.positionX || !article.positionY) return null;

        const articleStyle = calculateArticleStyle(article);
        const isActive =
          hoveredArticleId === article.id ||
          selectedArticleId === article.id ||
          tooltipInfo.articleId === article.id;

        return (
          <div
            key={article.id}
            className={`absolute border ${
              isActive ? "border-blue-500" : "border-white"
            } rounded-md shadow-md overflow-hidden cursor-pointer pointer-events-auto ${
              isEditable ? "z-10" : ""
            }`}
            style={{
              ...articleStyle,
              zIndex: isActive ? 10 : 5,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => handleArticleInteraction(e, article)}
            onMouseEnter={(e) => handleArticleMouseEnter(e, article)}
            onMouseLeave={handleArticleMouseLeave}
          >
            {/* Contenu de l'article ici, si nécessaire */}
          </div>
        );
      })}

      {/* Tooltip global détaché du flux DOM - modifié pour mobile */}
      {tooltipInfo.visible && (
        <div
          className="fixed w-64 bg-black bg-opacity-90 text-white p-3 rounded-md shadow-lg"
          style={{
            left: tooltipInfo.position.x,
            top: tooltipInfo.position.y - 10,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
            pointerEvents: "auto", // Changé de "none" à "auto" pour permettre les interactions
            maxWidth: "250px",
          }}
          onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
        >
          <div className="font-bold text-sm truncate">
            {tooltipInfo.content.title}
          </div>

          {tooltipInfo.content.description && (
            <div className="text-xs mt-1 text-gray-300 max-h-20 overflow-auto">
              {tooltipInfo.content.description}
            </div>
          )}

          <div className="mt-3 flex justify-center">
            {isMobile ? (
              // Sur mobile: bouton cliquable
              <button
                onClick={handleViewTasksClick}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors w-full"
              >
                Gérer les tâches
              </button>
            ) : (
              // Sur desktop: texte informatif
              <span className="text-xs text-center text-blue-300">
                Cliquez pour gérer les tâches
              </span>
            )}
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
