import React, { useState } from "react";
import { ChevronDown, List, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Feedback haptique pour les interactions
  const triggerHapticFeedback = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const togglePanel = () => {
    triggerHapticFeedback();
    setIsOpen(!isOpen);
  };

  const handleArticleSelect = (articleId: string) => {
    triggerHapticFeedback();
    onArticleClick(articleId);
  };

  return (
    <div className="md:hidden">
      {/* Bouton flottant pour ouvrir la liste */}
      <button
        onClick={togglePanel}
        className="fixed bottom-20 left-4 z-40 flex items-center gap-1 bg-primary text-primary-foreground rounded-full shadow-lg px-3 py-3"
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

      {/* Panel coulissant avec la liste des articles */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border rounded-t-2xl shadow-lg max-h-[70vh] overflow-hidden"
          >
            {/* En-tête du panel */}
            <div className="flex justify-between items-center p-3 border-b border-border bg-muted">
              <h3 className="font-medium text-base">
                Articles de &quot;{selectedSectorName}&quot;
              </h3>
              <button
                onClick={togglePanel}
                className="p-1 rounded-full hover:bg-background"
                aria-label="Fermer"
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Contenu du panel avec les articles */}
            <div className="overflow-y-auto max-h-[calc(70vh-3rem)]">
              {articles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Aucun article disponible pour ce secteur
                </div>
              ) : (
                <ul className="p-2 space-y-2">
                  {articles.map((article) => (
                    <li
                      key={article.id}
                      className={`rounded-lg border p-3 ${
                        hoveredArticleId === article.id
                          ? "bg-primary/10 border-primary"
                          : "border-border bg-card"
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
                          className="text-muted-foreground mt-1"
                        />
                      </div>

                      {article.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileArticleList;
