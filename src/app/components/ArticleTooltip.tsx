"use client";

import { useState, useEffect, useRef, cloneElement } from "react";
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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sur desktop, gérer le hover avec délai
  useEffect(() => {
    if (!isMobile && isHovered) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        // Calculer la position du tooltip
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isHovered, isMobile]);

  // Sur mobile : toujours utiliser le Popover
  if (isMobile) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-2rem)] max-w-sm p-4 shadow-xl"
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
              <p className="text-base text-muted-foreground leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Bouton CTA principal */}
            {onArticleClick && (
              <button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-3 font-medium text-base transition-colors"
                onClick={() => {
                  onArticleClick(article.id);
                  onOpenChange?.(false);
                }}
              >
                Ouvrir l&apos;article
              </button>
            )}

            {/* Actions supplémentaires (éditer, supprimer, etc.) */}
            {actions && <div className="pt-2 border-t">{actions}</div>}
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
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
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
      {showTooltip && !open && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 8}px`,
            transform: "translate(-50%, -100%)",
            minWidth: "200px",
            maxWidth: "320px",
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
            {/* Petite flèche en bas */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full">
              <div className="border-8 border-transparent border-t-white" />
            </div>
          </div>
        </div>
      )}

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
