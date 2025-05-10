import React, { useState, useRef, useEffect } from "react";
import {
  List,
  X,
  ExternalLink,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CheckSquare,
  Square,
  XCircle,
} from "lucide-react";
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

interface ArticleListProps {
  articles: Article[];
  selectedSectorName: string;
  objetId: string;
  sectorId: string;
  onArticleClick: (articleId: string) => void;
  onArticleHover: (articleId: string | null) => void;
  hoveredArticleId: string | null;
  isMobile?: boolean;
}

// Options disponibles pour le tri
type SortOption = {
  id: string;
  label: string;
  compareFn: (a: Article, b: Article) => number;
};

const sortOptions: SortOption[] = [
  {
    id: "title-asc",
    label: "Titre (A-Z)",
    compareFn: (a, b) =>
      a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1,
  },
  {
    id: "title-desc",
    label: "Titre (Z-A)",
    compareFn: (a, b) =>
      a.title.toLowerCase() < b.title.toLowerCase() ? 1 : -1,
  },
];

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  selectedSectorName,
  onArticleClick,
  onArticleHover,
  hoveredArticleId,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title-asc");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(articles);
  const [hasPositionFilter, setHasPositionFilter] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour les articles filtrés quand les articles source changent
  useEffect(() => {
    applyFiltersAndSort();
  }, [articles, searchTerm, sortBy, hasPositionFilter]);

  // Fonction pour appliquer les filtres et le tri
  const applyFiltersAndSort = () => {
    // Appliquer le filtre de recherche
    let filtered = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.description &&
          article.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Appliquer le filtre de position
    if (hasPositionFilter) {
      filtered = filtered.filter(
        (article) => article.positionX !== null && article.positionY !== null
      );
    }

    // Appliquer le tri
    const sortOption = sortOptions.find((option) => option.id === sortBy);
    if (sortOption) {
      filtered.sort(sortOption.compareFn);
    }

    setFilteredArticles(filtered);
  };

  // Focus sur le champ de recherche quand les filtres sont affichés
  useEffect(() => {
    if (showFilters && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showFilters]);

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

  const toggleFilters = () => {
    triggerHapticFeedback();
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("title-asc");
    setHasPositionFilter(false);
    triggerHapticFeedback("medium");
  };

  const handleArticleSelect = (articleId: string) => {
    triggerHapticFeedback("medium");
    onArticleClick(articleId);
  };

  const togglePositionFilter = () => {
    setHasPositionFilter(!hasPositionFilter);
    triggerHapticFeedback();
  };

  const getFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (sortBy !== "title-asc") count++;
    if (hasPositionFilter) count++;
    return count;
  };

  // Animations
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  // Différentes animations selon mobile ou desktop
  const panelVariants = isMobile
    ? {
        hidden: { y: "100%" },
        visible: {
          y: 0,
          transition: {
            type: "spring",
            damping: 30,
            stiffness: 300,
          },
        },
      }
    : {
        hidden: { x: "-100%" },
        visible: {
          x: 0,
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

  const filterBarVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: {
          type: "spring",
          stiffness: 500,
          damping: 30,
        },
        opacity: {
          duration: 0.2,
          delay: 0.1,
        },
      },
    },
  };

  return (
    <div className={isMobile ? "md:hidden" : "hidden md:inline-block"}>
      {/* Bouton pour ouvrir la liste */}
      <motion.button
        onClick={togglePanel}
        className={`${isMobile ? "fixed bottom-20 left-4" : "relative ml-2"} z-[50] flex items-center gap-1 bg-primary text-primary-foreground rounded-lg shadow-md px-3 py-2`}
        whileTap={{ scale: 0.95 }}
        style={{
          backgroundColor: "var(--primary)",
          color: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {isOpen ? (
          <X size={18} />
        ) : (
          <>
            {isMobile ? <List size={18} /> : <PanelLeft size={18} />}
            <span className="ml-1 text-sm font-medium">
              {articles.length} Articles
            </span>
          </>
        )}
      </motion.button>

      {/* Panel avec animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay animé - uniquement sur mobile */}
            {isMobile && (
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
            )}

            {/* Panneau animé - différent selon desktop ou mobile */}
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{
                position: "fixed",
                zIndex: 995,
                backgroundColor: "white",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                maxHeight: isMobile ? "80vh" : "100vh",
                display: "flex",
                flexDirection: "column",
                ...(isMobile
                  ? {
                      bottom: 0,
                      left: 0,
                      right: 0,
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                    }
                  : {
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: "320px",
                      borderRightRadius: "16px",
                    }),
              }}
            >
              {/* Indicateur de défilement (handle) - uniquement sur mobile */}
              {isMobile && (
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
              )}

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
                <div className="flex items-center">
                  <h3 style={{ fontWeight: 500, margin: 0 }}>
                    Articles de &quot;{selectedSectorName}&quot;
                  </h3>
                  <div className="text-xs bg-gray-100 px-2 ml-2 rounded-full">
                    {filteredArticles.length}/{articles.length}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={toggleFilters}
                    whileTap={{ scale: 0.9 }}
                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                    aria-label="Filtres et tri"
                  >
                    <Filter size={18} />
                    {getFilterCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {getFilterCount()}
                      </span>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={togglePanel}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>

              {/* Barre de filtres - apparaît/disparaît en fonction de showFilters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    variants={filterBarVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="border-b border-gray-200 overflow-hidden"
                  >
                    <div className="p-3 flex flex-col gap-3">
                      {/* Recherche */}
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-2 top-2.5 text-gray-400"
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full py-2 pl-8 pr-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>

                      {/* Options de tri et filtres */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-500">
                          Trier par:
                        </span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          {sortOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={togglePositionFilter}
                          className={`flex items-center gap-1 text-xs py-1 px-2 rounded border ${
                            hasPositionFilter
                              ? "bg-blue-50 border-blue-200 text-blue-600"
                              : "border-gray-200"
                          }`}
                        >
                          {hasPositionFilter ? (
                            <CheckSquare size={14} />
                          ) : (
                            <Square size={14} />
                          )}
                          Avec position
                        </button>
                      </div>

                      {/* Bouton pour réinitialiser les filtres */}
                      <div className="flex justify-end">
                        <button
                          onClick={clearFilters}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contenu du panneau avec défilement */}
              <div
                ref={listRef}
                style={{
                  overflowY: "auto",
                  maxHeight: isMobile
                    ? "calc(80vh - 60px)"
                    : "calc(100vh - 60px)",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: isMobile
                    ? "env(safe-area-inset-bottom, 16px)"
                    : 0,
                }}
              >
                {filteredArticles.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      color: "#666",
                    }}
                  >
                    {articles.length === 0
                      ? "Aucun article disponible pour ce secteur"
                      : "Aucun article ne correspond à vos critères"}
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px" }}>
                    {filteredArticles.map((article, index) => (
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
                            {article.positionX !== null &&
                              article.positionY !== null && (
                                <span className="inline-block ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                  Positionné
                                </span>
                              )}
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

              {/* Boutons de navigation - uniquement sur desktop */}
              {!isMobile && filteredArticles.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid #eee",
                    padding: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    aria-label="Articles précédents"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page 1 de 1
                  </span>
                  <button
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    aria-label="Articles suivants"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArticleList;
