import React, { useState, useRef } from "react";
import { List, X, ExternalLink } from "lucide-react";
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
  const listRef = useRef<HTMLDivElement>(null);

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

  const togglePanel = () => {
    triggerHapticFeedback();
    setIsOpen(!isOpen);
  };

  const handleArticleSelect = (articleId: string) => {
    triggerHapticFeedback("medium");
    onArticleClick(articleId);
  };

  // Animations
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  const panelVariants = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  };

  return (
    <div className="md:hidden">
      {/* Bouton flottant pour ouvrir la liste */}
      <motion.button
        onClick={togglePanel}
        className="fixed bottom-20 left-4 z-[1000] flex items-center gap-1 bg-primary text-primary-foreground rounded-full shadow-lg px-3 py-3"
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: "80px",
          left: "16px",
          zIndex: 1000,
          backgroundColor: "var(--primary)",
          color: "white",
          borderRadius: "9999px",
          padding: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        {isOpen ? <X size={18} /> : <List size={18} />}
        {!isOpen && (
          <span className="ml-1 text-sm font-medium">
            {articles.length} Articles
          </span>
        )}
      </motion.button>

      {/* Panel avec animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay animé */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={togglePanel}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 990,
              }}
            />

            {/* Panneau animé */}
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "white",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                zIndex: 995,
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Indicateur de défilement (handle) */}
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  backgroundColor: "#ccc",
                  borderRadius: "4px",
                  margin: "10px auto 5px",
                  opacity: 0.6,
                }}
              />

              {/* En-tête du panneau */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <h3 style={{ fontWeight: 500, margin: 0 }}>
                  Articles de &quot;{selectedSectorName}&quot;
                </h3>
                <motion.button
                  onClick={togglePanel}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Contenu du panneau avec défilement */}
              <div
                ref={listRef}
                style={{
                  overflowY: "auto",
                  maxHeight: "calc(80vh - 60px)", // Hauteur maximale moins la hauteur de l'en-tête
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: "env(safe-area-inset-bottom, 16px)",
                }}
              >
                {articles.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      color: "#666",
                    }}
                  >
                    Aucun article disponible pour ce secteur
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px" }}>
                    {articles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        custom={index}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => handleArticleSelect(article.id)}
                        onMouseEnter={() => onArticleHover(article.id)}
                        onMouseLeave={() => onArticleHover(null)}
                        style={{
                          padding: "16px",
                          marginBottom: "12px",
                          borderRadius: "12px",
                          border: "1px solid #e0e0e0",
                          backgroundColor:
                            hoveredArticleId === article.id
                              ? "rgba(217, 132, 13, 0.1)"
                              : "white",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex justify-between items-start">
                          <h4
                            style={{
                              fontWeight: 500,
                              marginBottom: "8px",
                              fontSize: "16px",
                            }}
                          >
                            {article.title}
                          </h4>
                          <ExternalLink
                            size={14}
                            style={{
                              color: "var(--muted-foreground)",
                              marginTop: "4px",
                            }}
                          />
                        </div>

                        {article.description && (
                          <p
                            style={{
                              fontSize: "14px",
                              color: "var(--muted-foreground)",
                              lineHeight: 1.4,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              margin: 0,
                            }}
                          >
                            {article.description}
                          </p>
                        )}
                      </motion.div>
                    ))}
                    {/* Espace supplémentaire en bas */}
                    <div style={{ height: "20px" }}></div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileArticleList;
