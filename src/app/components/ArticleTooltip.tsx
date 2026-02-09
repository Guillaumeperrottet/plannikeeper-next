"use client";

import { useState, useEffect, cloneElement } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ArticleTooltipProps {
  article: {
    id: string;
    title: string;
    description: string | null;
  };
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onArticleClick?: (articleId: string) => void;
  actions?: React.ReactNode; // Actions personnalisées (éditer, supprimer, etc.)
}

/**
 * Composant tooltip/popover adaptatif pour les articles sur la carte
 * - Desktop : Affiche un tooltip élégant au hover
 * - Mobile : Affiche un popover tactile au tap avec texte lisible
 */
export function ArticleTooltip({
  article,
  children,
  open,
  onOpenChange,
  onArticleClick,
  actions,
}: ArticleTooltipProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    x: 0,
    y: 0,
    articleCenterX: 0,
  });
  const [viewportZoom, setViewportZoom] = useState(1);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Détecter le niveau de zoom du viewport
  useEffect(() => {
    const updateZoom = () => {
      setViewportZoom(window.visualViewport?.scale || 1);
    };

    updateZoom();
    window.visualViewport?.addEventListener("resize", updateZoom);
    window.visualViewport?.addEventListener("scroll", updateZoom);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateZoom);
      window.visualViewport?.removeEventListener("scroll", updateZoom);
    };
  }, []);

  // Fonction pour calculer la position avec ajustement minimal pour les bords
  const calculateTooltipPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const margin = 16;

    // Position centrée par défaut (position originale de l'article)
    const articleCenterX = rect.left + rect.width / 2;
    let x = articleCenterX;
    const y = rect.top;

    // Clamp X pour éviter les débordements (seulement si vraiment nécessaire)
    const minX = tooltipWidth / 2 + margin;
    const maxX = window.innerWidth - tooltipWidth / 2 - margin;
    x = Math.max(minX, Math.min(x, maxX));

    return { x, y, articleCenterX };
  };

  // Sur desktop, gérer le hover avec délai
  useEffect(() => {
    // Ne pas afficher le tooltip si le viewport est zoomé
    if (!isMobile && isHovered && viewportZoom <= 1.1) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isHovered, isMobile, viewportZoom]);
  if (isMobile) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className="w-80 max-w-[calc(100vw-2rem)] p-3 shadow-lg"
          side="top"
          align="center"
          sideOffset={8}
        >
          <div className="space-y-2">
            {/* Titre */}
            <h4 className="font-semibold text-sm leading-tight">
              {article.title}
            </h4>

            {/* Description */}
            {article.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Bouton CTA principal */}
            {onArticleClick && (
              <button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 font-medium text-sm transition-colors"
                onClick={() => {
                  onArticleClick(article.id);
                  onOpenChange?.(false);
                }}
              >
                Ouvrir l&apos;article
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Sur desktop : Popover avec tooltip au hover
  // On doit cloner l'enfant pour ajouter les événements hover sans wrapper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childElement = children as React.ReactElement<any>;

  const childWithHover = cloneElement(childElement, {
    onMouseEnter: (e: React.MouseEvent) => {
      setIsHovered(true);
      const element = e.currentTarget as HTMLElement;
      const position = calculateTooltipPosition(element);
      setTooltipPosition(position);
      // Appeler le onMouseEnter original si il existe
      if (childElement.props?.onMouseEnter) {
        childElement.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setIsHovered(false);
      // Appeler le onMouseLeave original si il existe
      if (childElement.props?.onMouseLeave) {
        childElement.props.onMouseLeave(e);
      }
    },
  });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{childWithHover}</PopoverTrigger>

      {/* Tooltip au hover (desktop uniquement) - Portal avec position fixed */}
      {showTooltip &&
        !open &&
        (() => {
          // Calculer le décalage de la flèche : différence entre la position de l'article et celle du tooltip
          const arrowOffset =
            tooltipPosition.articleCenterX - tooltipPosition.x;
          const arrowPosition = 50 + (arrowOffset / 320) * 100; // En pourcentage du tooltip (320px de large)

          return (
            <div
              className="fixed z-[100] pointer-events-none"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y - 8}px`,
                transform: "translate(-50%, -100%)",
                width: "320px",
              }}
            >
              <div className="bg-white text-black border border-gray-200 shadow-lg rounded-lg p-3 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-sm leading-tight">
                    {article.title}
                  </h4>
                  {article.description && (
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {article.description}
                    </p>
                  )}
                </div>
                {/* Petite flèche en bas - positionnée dynamiquement */}
                <div
                  className="absolute top-full"
                  style={{
                    left: `${arrowPosition}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="border-8 border-transparent border-t-white" />
                </div>
              </div>
            </div>
          );
        })()}

      <PopoverContent
        className="w-96 max-w-md p-4 shadow-xl"
        side="top"
        align="center"
        sideOffset={12}
      >
        <div className="space-y-3">
          {/* Titre */}
          <h4 className="font-semibold text-lg leading-tight">
            {article.title}
          </h4>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Bouton CTA */}
          {onArticleClick && (
            <button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2.5 font-medium text-sm transition-colors"
              onClick={() => {
                onArticleClick(article.id);
                onOpenChange?.(false);
              }}
            >
              Ouvrir l&apos;article
            </button>
          )}

          {/* Actions supplémentaires */}
          {actions && <div className="pt-2 border-t">{actions}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
