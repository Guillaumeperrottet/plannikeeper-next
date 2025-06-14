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
    placement: "top" | "bottom" | "left" | "right";
    articleId: string | null;
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
    placement: "top",
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

  // Fonction pour mettre à jour les dimensions
  const updateDimensions = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const image = imageRef.current;
    const rect = image.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const originalAspectRatio = originalWidth / originalHeight;
    const displayAspectRatio = displayWidth / displayHeight;

    // Déterminer comment l'image est contrainte (par largeur ou hauteur)
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
      window.requestAnimationFrame(() => {
        updateDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleImageLoad = () => {
      updateDimensions();
    };

    const timers = [
      setTimeout(() => updateDimensions(), 100),
      setTimeout(() => updateDimensions(), 500),
      setTimeout(() => updateDimensions(), 1000),
    ];

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

      // Mises à jour différées pour s'assurer que le navigateur a bien terminé le rendu
      const timer1 = setTimeout(() => {
        updateDimensions();
      }, 50);

      const timer2 = setTimeout(() => {
        updateDimensions();
      }, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [imageSrc, updateDimensions]);

  // Calculer la position et les dimensions d'un article
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

  // Fermer le tooltip
  const closeTooltip = () => {
    setTooltipInfo((prev) => ({ ...prev, visible: false, articleId: null }));
    if (onArticleHover) onArticleHover(null);
  };

  // Fonction pour calculer la position optimale du tooltip
  const calculateTooltipPosition = (
    articleRect: DOMRect,
    tooltipWidth: number = 250,
    tooltipHeight: number = 120
  ): {
    x: number;
    y: number;
    placement: "top" | "bottom" | "left" | "right";
  } => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16; // Marge minimum par rapport aux bords
    const offset = 5; // Distance entre le tooltip et l'article (réduite)

    // Position de base : centré sur l'article
    const articleCenterX = articleRect.left + articleRect.width / 2;
    const articleCenterY = articleRect.top + articleRect.height / 2;

    let finalX = articleCenterX;
    let finalY = articleRect.top - tooltipHeight - offset;
    let placement: "top" | "bottom" | "left" | "right" = "top";

    // Vérifier si on peut placer le tooltip en haut
    if (finalY < padding) {
      // Essayer en bas
      finalY = articleRect.bottom + offset;
      placement = "bottom";

      // Si ça dépasse en bas aussi
      if (finalY + tooltipHeight > viewportHeight - padding) {
        // Essayer à droite
        if (
          articleRect.right + tooltipWidth + offset <
          viewportWidth - padding
        ) {
          finalX = articleRect.right + offset;
          finalY = articleCenterY;
          placement = "right";
        }
        // Essayer à gauche
        else if (articleRect.left - tooltipWidth - offset > padding) {
          finalX = articleRect.left - offset;
          finalY = articleCenterY;
          placement = "left";
        }
        // En dernier recours, forcer en bas avec ajustement
        else {
          finalY = Math.min(
            articleRect.bottom + offset,
            viewportHeight - tooltipHeight - padding
          );
          placement = "bottom";
        }
      }
    }

    // Ajuster la position horizontale pour éviter le débordement
    if (placement === "top" || placement === "bottom") {
      // S'assurer que le tooltip ne dépasse pas à droite
      if (finalX + tooltipWidth / 2 > viewportWidth - padding) {
        finalX = viewportWidth - tooltipWidth / 2 - padding;
      }
      // S'assurer que le tooltip ne dépasse pas à gauche
      if (finalX - tooltipWidth / 2 < padding) {
        finalX = tooltipWidth / 2 + padding;
      }
    }

    // Ajuster la position verticale pour éviter le débordement (pour left/right)
    if (placement === "left" || placement === "right") {
      // S'assurer que le tooltip ne dépasse pas en bas
      if (finalY + tooltipHeight / 2 > viewportHeight - padding) {
        finalY = viewportHeight - tooltipHeight / 2 - padding;
      }
      // S'assurer que le tooltip ne dépasse pas en haut
      if (finalY - tooltipHeight / 2 < padding) {
        finalY = tooltipHeight / 2 + padding;
      }
    }

    return {
      x: finalX,
      y: finalY,
      placement,
    };
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
      // Si c'est un nouvel article, afficher son tooltip
      else {
        const position = calculateTooltipPosition(rect);

        setTooltipInfo({
          visible: true,
          content: {
            title: article.title,
            description: article.description,
          },
          position: {
            x: position.x,
            y: position.y,
          },
          placement: position.placement,
          articleId: article.id,
        });
        if (onArticleHover) onArticleHover(article.id);

        // Feedback haptique (vibration légère)
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
      }
    }
    // Sur desktop, comportement de clic standard
    else if (onArticleClick) {
      onArticleClick(article.id);
    }
  };

  // Gérer le survol d'un article (uniquement sur desktop)
  const handleArticleMouseEnter = (e: React.MouseEvent, article: Article) => {
    if (isMobile) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = calculateTooltipPosition(rect);

    setTooltipInfo({
      visible: true,
      content: {
        title: article.title,
        description: article.description,
      },
      position: {
        x: position.x,
        y: position.y,
      },
      placement: position.placement,
      articleId: article.id,
    });
    if (onArticleHover) onArticleHover(article.id);
  };

  const handleArticleMouseLeave = () => {
    if (isMobile) return;
    closeTooltip();
  };

  // Gérer le clic sur le bouton "Gérer les tâches" dans le tooltip mobile
  const handleViewTasksClick = () => {
    if (tooltipInfo.articleId && onArticleClick) {
      // Feedback haptique avant la navigation
      if ("vibrate" in navigator) {
        navigator.vibrate([15, 30, 15]);
      }

      // Petit délai avant la navigation
      setTimeout(() => {
        if (tooltipInfo.articleId && onArticleClick) {
          onArticleClick(tooltipInfo.articleId);
        }
      }, 50);
    }
  };

  // Gestion du zoom et des événements tactiles
  useEffect(() => {
    const handleZoomChange = () => {
      if (tooltipInfo.visible) {
        setTooltipInfo((prev) => ({
          ...prev,
          visible: false,
          articleId: null,
        }));
        if (onArticleHover) onArticleHover(null);
      }
    };

    window.addEventListener("resize", handleZoomChange);

    // Gestion des gestes de pinch sur iOS Safari
    let lastTouchDistance = 0;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const touchDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );

        if (
          lastTouchDistance &&
          Math.abs(touchDistance - lastTouchDistance) > 10
        ) {
          if (tooltipInfo.visible) {
            setTooltipInfo((prev) => ({
              ...prev,
              visible: false,
              articleId: null,
            }));
            if (onArticleHover) onArticleHover(null);
          }
        }

        lastTouchDistance = touchDistance;
      }
    };

    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("resize", handleZoomChange);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [tooltipInfo.visible, onArticleHover]);

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
        className="block h-auto max-h-[calc(100vh-150px)]"
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
            {/* Zone cliquable/survolable pour chaque article positionné */}
          </div>
        );
      })}

      {/* Tooltip détaché pour les infos d'article */}
      {tooltipInfo.visible && (
        <div
          className="fixed w-64 bg-black bg-opacity-90 text-white p-3 rounded-md shadow-lg"
          style={{
            left:
              tooltipInfo.placement === "left"
                ? tooltipInfo.position.x - 250 // Tooltip à gauche de l'article
                : tooltipInfo.placement === "right"
                  ? tooltipInfo.position.x // Tooltip à droite de l'article
                  : tooltipInfo.position.x - 125, // Centré horizontalement (250/2 = 125)
            top:
              tooltipInfo.placement === "top"
                ? tooltipInfo.position.y // Position calculée (déjà ajustée)
                : tooltipInfo.placement === "bottom"
                  ? tooltipInfo.position.y // Position calculée (déjà ajustée)
                  : tooltipInfo.position.y - 60, // Centré verticalement (hauteur estimée / 2)
            zIndex: 9999,
            pointerEvents: "auto",
            maxWidth: "250px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bouton de fermeture du tooltip */}
          <button
            className="absolute top-1 right-1 text-gray-300 hover:text-white"
            onClick={closeTooltip}
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="font-bold text-sm truncate pr-5">
            {tooltipInfo.content.title}
          </div>

          {tooltipInfo.content.description && (
            <div className="text-xs mt-1 text-gray-300 max-h-20 overflow-auto">
              {tooltipInfo.content.description}
            </div>
          )}

          <div className="mt-3 flex justify-center">
            {isMobile ? (
              <button
                onClick={handleViewTasksClick}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors w-full"
              >
                Gérer les tâches
              </button>
            ) : (
              <span className="text-xs text-center text-blue-300">
                Cliquez pour gérer les tâches
              </span>
            )}
          </div>

          {/* Flèche pointant vers l'élément - s'ajuste selon le placement */}
          {!isMobile && (
            <div
              style={{
                position: "absolute",
                ...(tooltipInfo.placement === "top" && {
                  left: "50%",
                  bottom: "-8px",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "8px solid rgba(0, 0, 0, 0.9)",
                }),
                ...(tooltipInfo.placement === "bottom" && {
                  left: "50%",
                  top: "-8px",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid rgba(0, 0, 0, 0.9)",
                }),
                ...(tooltipInfo.placement === "left" && {
                  right: "-8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderLeft: "8px solid rgba(0, 0, 0, 0.9)",
                }),
                ...(tooltipInfo.placement === "right" && {
                  left: "-8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderRight: "8px solid rgba(0, 0, 0, 0.9)",
                }),
              }}
            ></div>
          )}
        </div>
      )}
    </div>
  );
}
