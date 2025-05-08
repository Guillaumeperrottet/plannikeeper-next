import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, List, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

interface MobileArticleListProps {
  articles: Article[];
  selectedSectorName: string;
  objetId: string;
  sectorId: string;
  onArticleClick: (articleId: string) => void;
  onArticleHover: (articleId: string | null) => void;
  hoveredArticleId: string | null;
}

const MobileArticleList: React.FC<MobileArticleListProps> = ({
  articles,
  selectedSectorName,
  onArticleClick,
  onArticleHover,
  hoveredArticleId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Feedback haptique pour les interactions
  const triggerHapticFeedback = (intensity = "light") => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      switch (intensity) {
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(15);
          break;
        case "strong":
          navigator.vibrate([15, 30, 15]);
          break;
      }
    }
  };

  // Configuration pour empêcher les interactions de défilement lors du glissement du panneau
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && !isScrollingList(e)) {
        e.preventDefault();
      }
    };

    // Fonction pour déterminer si on défile dans la liste ou si on veut fermer le panneau
    const isScrollingList = (e: TouchEvent): boolean => {
      if (!listRef.current || !e.target) return false;

      // Si l'utilisateur interagit avec la liste et qu'elle peut défiler
      if (listRef.current.contains(e.target as Node)) {
        const isAtTop = listRef.current.scrollTop <= 0;
        return !(isAtTop && currentY && startY && currentY > startY);
      }

      return false;
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, startY, currentY]);

  // Debugger: ajouter un log pour voir si le composant est rendu
  useEffect(() => {
    console.log("MobileArticleList rendu", { articles, isOpen });
  }, [articles, isOpen]);

  const togglePanel = () => {
    console.log("Toggling panel, current state:", isOpen);
    triggerHapticFeedback();
    setIsOpen(!isOpen);
  };

  const handleArticleSelect = (articleId: string) => {
    triggerHapticFeedback("medium");
    onArticleClick(articleId);
  };

  // Gérer le début d'un glissement tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (panelRef.current && e.touches[0]) {
      setStartY(e.touches[0].clientY);
      setCurrentY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  // Gérer le mouvement pendant un glissement tactile
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && startY !== null && e.touches[0]) {
      const currentTouchY = e.touches[0].clientY;
      setCurrentY(currentTouchY);

      // Calculer le déplacement vertical
      const deltaY = currentTouchY - startY;

      // Appliquer un coefficient de résistance pour ralentir le mouvement
      const resistance = 0.4;
      const offset = deltaY > 0 ? deltaY * resistance : 0;

      // Mettre à jour la position du panneau avec animation fluide
      controls.set({ y: offset });
    }
  };

  // Gérer la fin d'un glissement tactile
  const handleTouchEnd = () => {
    if (isDragging && startY !== null && currentY !== null) {
      const deltaY = currentY - startY;
      const threshold = 100; // Seuil pour considérer qu'on veut fermer

      if (deltaY > threshold) {
        // Fermer le panneau avec animation
        controls
          .start({
            y: "100%",
            transition: { type: "spring", damping: 25, stiffness: 300 },
          })
          .then(() => {
            setIsOpen(false);
          });
        triggerHapticFeedback();
      } else {
        // Remettre le panneau à sa position initiale
        controls.start({
          y: 0,
          transition: { type: "spring", damping: 25, stiffness: 300 },
        });
      }
    }

    // Réinitialiser les états de défilement
    setIsDragging(false);
    setStartY(null);
    setCurrentY(null);
  };

  return (
    <div className="md:hidden">
      {/* Ajout d'un debug pour voir si le composant est visible */}
      {/* <div className="fixed bottom-36 right-4 bg-red-500 text-white p-2 rounded z-50">
        Articles: {articles.length} | Open: {isOpen ? "yes" : "no"}
      </div> */}

      {/* Bouton flottant pour ouvrir la liste - Augmenté z-index */}
      <button
        onClick={togglePanel}
        className="fixed bottom-20 left-4 z-50 flex items-center gap-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-full shadow-lg px-3 py-3 active:scale-95 transition-transform"
        aria-label={
          isOpen ? "Fermer la liste des articles" : "Voir tous les articles"
        }
      >
        {isOpen ? <X size={18} /> : <List size={18} />}
        {!isOpen && (
          <span className="ml-1 text-sm font-medium">
            {articles.length} Articles
          </span>
        )}
      </button>

      {/* Panel coulissant avec la liste des articles - Augmenté z-index */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ y: "100%" }}
            animate={controls}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-[color:var(--background)] border-t border-[color:var(--border)] rounded-t-2xl shadow-lg max-h-[80vh] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Poignée de défilement (indicator visuel) */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-[color:var(--muted-foreground)]/20 rounded-full" />

            {/* En-tête du panel */}
            <div
              className="flex justify-between items-center p-4 border-b border-[color:var(--border)] bg-[color:var(--muted)]"
              style={{ touchAction: "none" }}
            >
              <h3 className="font-medium text-base">
                Articles de &quot;{selectedSectorName}&quot;
              </h3>
              <button
                onClick={togglePanel}
                className="p-1 rounded-full hover:bg-[color:var(--background)] active:scale-95 transition-transform"
                aria-label="Fermer"
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Contenu du panel avec les articles */}
            <div
              ref={listRef}
              className="overflow-y-auto overscroll-contain pb-safe max-h-[calc(80vh-4rem)]"
              style={{
                touchAction: "pan-y",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "env(safe-area-inset-bottom, 16px)",
              }}
            >
              {articles.length === 0 ? (
                <div className="p-4 text-center text-[color:var(--muted-foreground)]">
                  Aucun article disponible pour ce secteur
                </div>
              ) : (
                <ul className="p-3 space-y-3">
                  {articles.map((article) => (
                    <li
                      key={article.id}
                      className={`rounded-lg border p-3 active:scale-[0.98] transition-all ${
                        hoveredArticleId === article.id
                          ? "bg-[color:var(--primary)]/10 border-[color:var(--primary)]"
                          : "border-[color:var(--border)] bg-[color:var(--card)]"
                      }`}
                      onMouseEnter={() => onArticleHover(article.id)}
                      onMouseLeave={() => onArticleHover(null)}
                      onClick={() => handleArticleSelect(article.id)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm mb-1">
                          {article.title}
                        </h4>
                        <ExternalLink
                          size={14}
                          className="text-[color:var(--muted-foreground)] mt-1"
                        />
                      </div>

                      {article.description && (
                        <p className="text-xs text-[color:var(--muted-foreground)] line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Espace supplémentaire en bas pour assurer un bon défilement */}
              <div className="h-safe pb-6" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay pour fermer le panneau en touchant ailleurs - Augmenté z-index */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[1px]"
          onClick={togglePanel}
        />
      )}
    </div>
  );
};

export default MobileArticleList;
