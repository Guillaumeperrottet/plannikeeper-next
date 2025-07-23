import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Move, Square, Edit, Trash } from "lucide-react";

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
  // Nouvelles props pour les actions
  onArticleMove?: (articleId: string) => void;
  onArticleResize?: (articleId: string) => void;
  onArticleEdit?: (articleId: string) => void;
  onArticleDelete?: (articleId: string) => void;
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
  // Nouvelles props pour les actions
  onArticleMove,
  onArticleResize,
  onArticleEdit,
  onArticleDelete,
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

  // État pour gérer le popover ouvert
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

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

  // Gérer le clic/toucher sur un article
  const handleArticleInteraction = (
    e: React.MouseEvent | React.TouchEvent,
    article: Article
  ) => {
    e.stopPropagation(); // Empêcher la propagation aux éléments parents

    // Sur mobile ou si les actions sont disponibles, ouvrir le popover
    if (
      isMobile ||
      onArticleMove ||
      onArticleResize ||
      onArticleEdit ||
      onArticleDelete
    ) {
      // Ouvrir le popover pour cet article
      setOpenPopoverId(article.id);
      if (onArticleHover) onArticleHover(article.id);
      return;
    }

    // Sur desktop sans actions, comportement de clic standard
    if (onArticleClick) {
      onArticleClick(article.id);
    }
  };

  // Gérer le survol d'un article (uniquement sur desktop)
  const handleArticleMouseEnter = (e: React.MouseEvent, article: Article) => {
    if (isMobile) return;
    if (onArticleHover) onArticleHover(article.id);
  };

  const handleArticleMouseLeave = () => {
    if (isMobile) return;
    if (onArticleHover) onArticleHover(null);
  };

  // Fermer le popover quand on clique ailleurs
  const handleBackgroundClick = () => {
    setOpenPopoverId(null);
    if (onArticleHover) onArticleHover(null);
  };

  // Gestion des événements de zoom pour fermer le popover
  useEffect(() => {
    const handleZoomChange = () => {
      setOpenPopoverId(null);
      if (onArticleHover) onArticleHover(null);
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
          setOpenPopoverId(null);
          if (onArticleHover) onArticleHover(null);
        }

        lastTouchDistance = touchDistance;
      }
    };

    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("resize", handleZoomChange);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [onArticleHover]);

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
          openPopoverId === article.id;

        // Si les actions sont disponibles, utiliser le popover
        if (
          onArticleMove ||
          onArticleResize ||
          onArticleEdit ||
          onArticleDelete
        ) {
          return (
            <Popover
              key={article.id}
              open={openPopoverId === article.id}
              onOpenChange={(open) => {
                if (open) {
                  setOpenPopoverId(article.id);
                  if (onArticleHover) onArticleHover(article.id);
                } else {
                  setOpenPopoverId(null);
                  if (onArticleHover) onArticleHover(null);
                }
              }}
            >
              {/* @ts-expect-error - Types issue with shadcn/ui PopoverTrigger children prop */}
              <PopoverTrigger asChild>
                <div
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
                  onClick={(e: React.MouseEvent) => handleArticleInteraction(e, article)}
                  onMouseEnter={(e: React.MouseEvent) => handleArticleMouseEnter(e, article)}
                  onMouseLeave={handleArticleMouseLeave}
                >
                  {/* Zone cliquable/survolable pour chaque article positionné */}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top" align="center">
                <div className="space-y-4">
                  {/* En-tête avec titre et description */}
                  <div>
                    <h4 className="font-medium leading-none">
                      {article.title}
                    </h4>
                    {article.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {article.description}
                      </p>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="grid grid-cols-2 gap-2">
                    {onArticleMove && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onArticleMove(article.id);
                          setOpenPopoverId(null);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Move size={16} />
                        Déplacer
                      </Button>
                    )}

                    {onArticleResize && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onArticleResize(article.id);
                          setOpenPopoverId(null);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Square size={16} />
                        Redimensionner
                      </Button>
                    )}

                    {onArticleEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onArticleEdit(article.id);
                          setOpenPopoverId(null);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Modifier
                      </Button>
                    )}

                    {onArticleDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onArticleDelete(article.id);
                          setOpenPopoverId(null);
                        }}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash size={16} />
                        Supprimer
                      </Button>
                    )}
                  </div>

                  {/* Bouton pour voir/gérer les tâches si pas d'actions spécifiques */}
                  {onArticleClick && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        onArticleClick(article.id);
                        setOpenPopoverId(null);
                      }}
                    >
                      Gérer les tâches
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        // Rendu simple sans popover si pas d'actions
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
    </div>
  );
}
