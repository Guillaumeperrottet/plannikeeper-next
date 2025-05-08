import React, { useState } from "react";
import { List, X } from "lucide-react";

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

  // Fonction de débogage - affiche toujours l'état actuel
  console.log(
    `MobileArticleList - isOpen: ${isOpen}, articles: ${articles.length}`
  );

  const togglePanel = () => {
    console.log(`Toggling panel from ${isOpen} to ${!isOpen}`);
    setIsOpen(!isOpen);

    // Feedback haptique si disponible
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="md:hidden">
      {/* Bouton flottant toujours visible */}
      <button
        onClick={togglePanel}
        className="fixed bottom-20 left-4 z-[1000] bg-primary text-primary-foreground rounded-full shadow-lg px-3 py-3"
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
      </button>

      {/* Panel avec styles inline pour maximiser la visibilité */}
      {isOpen && (
        <>
          {/* Overlay - avec styles inline */}
          <div
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

          {/* Le panneau lui-même - avec styles inline pour garantir l'affichage */}
          <div
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
              overflowY: "auto",
            }}
          >
            {/* Barre de titre */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h3 style={{ fontWeight: 500 }}>
                Articles de &quot;{selectedSectorName}&quot;
              </h3>
              <button
                onClick={togglePanel}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Liste d'articles */}
            <div style={{ padding: "16px", overflow: "auto" }}>
              {articles.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                  }}
                >
                  Aucun article disponible pour ce secteur
                </div>
              ) : (
                <div>
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => onArticleClick(article.id)}
                      onMouseEnter={() => onArticleHover(article.id)}
                      onMouseLeave={() => onArticleHover(null)}
                      style={{
                        padding: "12px",
                        margin: "8px 0",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        backgroundColor:
                          hoveredArticleId === article.id ? "#f5f5f5" : "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                        {article.title}
                      </div>
                      {article.description && (
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>
                          {article.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Indicateur de débogage temporaire */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          backgroundColor: "red",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 9999,
        }}
      >
        Articles: {articles.length} | Ouvert: {isOpen ? "Oui" : "Non"}
      </div>
    </div>
  );
};

export default MobileArticleList;
