"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/app/components/ui/sheet";
import { toast } from "sonner";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Maximize2,
  Minimize2,
  ListFilter,
  ExternalLink,
  Search,
  ArrowUp,
  ArrowDown,
  XCircle,
} from "lucide-react";
import ImageWithArticles from "@/app/components/ImageWithArticles";
import AccessControl from "@/app/components/AccessControl";

// Types définis comme dans votre code original
type Sector = {
  id: string;
  name: string;
  image: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  objectId: string;
};

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

type SortDirection = "asc" | "desc";

interface SectorViewerProps {
  sectors: Sector[];
  objetId: string;
}

export default function SectorViewer({ sectors, objetId }: SectorViewerProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [selectedArticleId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Détection du mode mobile
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

  // Sélectionner le premier secteur au chargement si aucun n'est sélectionné
  useEffect(() => {
    if (sectors.length > 0 && !selectedSector) {
      setSelectedSector(sectors[0]);
      setSelectedIndex(0);
    }
  }, [sectors, selectedSector]);

  // Charger les articles lorsque le secteur sélectionné change
  useEffect(() => {
    if (selectedSector) {
      fetchArticles(selectedSector.id);
    }
  }, [selectedSector]);

  // Filtrer les articles en fonction du terme de recherche et du tri
  useEffect(() => {
    if (!articles.length) {
      setFilteredArticles([]);
      return;
    }

    // Filtrer les articles en fonction du terme de recherche
    let filtered = [...articles];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(lowerSearchTerm) ||
          (article.description &&
            article.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Trier les articles
    filtered.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      if (sortDirection === "asc") {
        return titleA > titleB ? 1 : -1;
      } else {
        return titleA < titleB ? 1 : -1;
      }
    });

    setFilteredArticles(filtered);
  }, [articles, searchTerm, sortDirection]);

  // Mettre le focus sur l'input de recherche quand la sidebar s'ouvre
  useEffect(() => {
    if (sidebarOpen && searchInputRef.current && !isMobile) {
      // Petit délai pour laisser l'animation se terminer
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [sidebarOpen, isMobile]);

  //  bloquer le défilement lorsque la barre latérale est ouverte
  useEffect(() => {
    if (sidebarOpen && !isMobile) {
      // Sauvegarder la position actuelle de défilement
      const scrollY = window.scrollY;

      // Bloquer le défilement en fixant le body avec la position actuelle
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflowY = "scroll"; // Maintient la barre de défilement pour éviter le déplacement de la mise en page

      // Restaurer le défilement lorsque la barre latérale se ferme
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflowY = "";

        // Restaurer la position de défilement
        window.scrollTo(0, scrollY);
      };
    }
  }, [sidebarOpen, isMobile]);

  const fetchArticles = async (sectorId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/sectors/${sectorId}/articles`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        console.error("Erreur lors du chargement des articles");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectorChange = (sector: Sector) => {
    const newIndex = sectors.findIndex((s) => s.id === sector.id);
    setSelectedSector(sector);
    setSelectedIndex(newIndex);
  };

  const navigateToPreviousSector = useCallback(() => {
    if (sectors.length <= 1) return;
    const newIndex = (selectedIndex - 1 + sectors.length) % sectors.length;
    setSelectedSector(sectors[newIndex]);
    setSelectedIndex(newIndex);
  }, [selectedIndex, sectors]);

  const navigateToNextSector = useCallback(() => {
    if (sectors.length <= 1) return;
    const newIndex = (selectedIndex + 1) % sectors.length;
    setSelectedSector(sectors[newIndex]);
    setSelectedIndex(newIndex);
  }, [selectedIndex, sectors]);

  const handleArticleClick = (articleId: string) => {
    if (selectedSector) {
      window.location.href = `/dashboard/objet/${objetId}/secteur/${selectedSector.id}/article/${articleId}`;
    }
  };

  const handleArticleHover = (articleId: string | null) => {
    setHoveredArticleId(articleId);
  };

  const handleArticleUpdate = async (articleId: string, updates: { title: string; description: string }) => {
    try {
      // Trouver l'article existant pour conserver ses autres propriétés
      const existingArticle = articles.find(a => a.id === articleId);
      if (!existingArticle) {
        throw new Error('Article non trouvé');
      }

      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          positionX: existingArticle.positionX,
          positionY: existingArticle.positionY,
          width: existingArticle.width,
          height: existingArticle.height,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'article');
      }

      // Recharger les articles pour refléter les changements
      if (selectedSector) {
        await fetchArticles(selectedSector.id);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      throw error; // Re-throw pour que le composant puisse gérer l'erreur
    }
  };

  const handleArticlePositionUpdate = async (articleId: string, updates: { positionX: number; positionY: number; width: number; height: number }) => {
    try {
      // Trouver l'article existant pour conserver ses autres propriétés
      const existingArticle = articles.find(a => a.id === articleId);
      if (!existingArticle) {
        throw new Error('Article non trouvé');
      }

      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: existingArticle.title,
          description: existingArticle.description,
          positionX: updates.positionX,
          positionY: updates.positionY,
          width: updates.width,
          height: updates.height,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la position de l\'article');
      }

      // Recharger les articles pour refléter les changements
      if (selectedSector) {
        await fetchArticles(selectedSector.id);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position de l\'article:', error);
      throw error; // Re-throw pour que le composant puisse gérer l'erreur
    }
  };

  const handleArticleDelete = async (articleId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'article');
      }

      // Recharger les articles pour refléter les changements
      if (selectedSector) {
        await fetchArticles(selectedSector.id);
      }

      // Afficher un message de succès
      toast.success('Article supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error);
      toast.error('Erreur lors de la suppression de l\'article');
      throw error; // Re-throw pour que le composant puisse gérer l'erreur
    }
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);

    // En mode plein écran, nous voulons maximiser l'espace d'affichage
    if (!isFullscreen && viewerRef.current) {
      try {
        if (viewerRef.current.requestFullscreen) {
          viewerRef.current.requestFullscreen();
        }
      } catch {
        console.log("Fullscreen API not supported or enabled");
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [isFullscreen]);

  // Fonction pour basculer la direction du tri
  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

    // Feedback haptique si disponible
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Fonction pour effacer le terme de recherche
  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  // Gestion des touches clavier pour la navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        navigateToPreviousSector();
      } else if (event.key === "ArrowRight") {
        navigateToNextSector();
      } else if (event.key === "Escape") {
        // Si la barre latérale est ouverte, la fermer d'abord
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else {
          setIsFullscreen(false);
        }
      } else if (event.key === "f" || event.key === "F") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    navigateToNextSector,
    navigateToPreviousSector,
    isFullscreen,
    toggleFullscreen,
    sidebarOpen,
  ]);

  // Gestion de la sortie du mode plein écran via l'API Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  return (
    <div
      ref={viewerRef}
      className={`flex-1 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-transparent" : ""
      }`}
    >
      {/* Header avec contrôles - caché en plein écran */}
      {!isFullscreen && (
        <div className="p-2 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          {/* Interface de sélection de secteur */}
          <div className="w-full sm:w-auto flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <label className="text-sm font-medium text-foreground hidden sm:block">
                Secteur :
              </label>
            </div>
            <Select
              value={selectedSector?.id}
              onValueChange={(id: string) => {
                const sector = sectors.find((s) => s.id === id);
                if (sector) handleSectorChange(sector);
              }}
            >
              {/* @ts-expect-error - Types issue with shadcn/ui SelectTrigger children prop */}
              <SelectTrigger className="w-full sm:w-[280px] bg-background border-input shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                <SelectValue placeholder="Sélectionner un secteur" />
              </SelectTrigger>
              {/* @ts-expect-error - Types issue with shadcn/ui SelectContent children prop */}
              <SelectContent className="max-h-[300px]">
                {sectors.map((sector) => (
                  // @ts-expect-error - Types issue with shadcn/ui SelectItem children prop
                  <SelectItem
                    key={sector.id}
                    value={sector.id}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                      {sector.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bouton Articles pour desktop - en dehors du flux normal */}
            {selectedSector && !isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                {/* @ts-expect-error - Types issue with shadcn/ui SheetTrigger children prop */}
                <SheetTrigger className="ml-4 flex items-center gap-2 px-3 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground">
                  <ListFilter size={16} />
                  Articles
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <div className="text-lg font-semibold">
                      Articles ({filteredArticles.length})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Liste des articles du secteur &quot;{selectedSector.name}
                      &quot;
                    </div>
                  </SheetHeader>

                  {/* Contenu de la Sheet */}
                  <div className="flex flex-col h-full mt-6">
                    {/* Barre de recherche et tri */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Rechercher un article..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full py-2 pl-10 pr-8 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                        />
                        {searchTerm && (
                          <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSortDirection}
                        className="flex items-center gap-1"
                        title={sortDirection === "asc" ? "Tri A-Z" : "Tri Z-A"}
                      >
                        {sortDirection === "asc" ? (
                          <ArrowUp size={16} />
                        ) : (
                          <ArrowDown size={16} />
                        )}
                      </Button>
                    </div>

                    {/* Liste des articles */}
                    <div className="flex-1 overflow-y-auto">
                      {filteredArticles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {articles.length === 0
                            ? "Aucun article disponible pour ce secteur"
                            : "Aucun article ne correspond à votre recherche"}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredArticles.map((article) => (
                            <div
                              key={article.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                hoveredArticleId === article.id ||
                                selectedArticleId === article.id
                                  ? "bg-amber-50 border-amber-200"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => handleArticleClick(article.id)}
                              onMouseEnter={() =>
                                handleArticleHover(article.id)
                              }
                              onMouseLeave={() => handleArticleHover(null)}
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium mb-1">
                                  {article.title}
                                </h4>
                                <ExternalLink
                                  size={14}
                                  className="text-muted-foreground mt-1"
                                />
                              </div>
                              {article.description && (
                                <p
                                  className="text-sm text-muted-foreground overflow-hidden text-ellipsis"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical" as const,
                                  }}
                                >
                                  {article.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Bouton pour ajouter/modifier un article */}
          {selectedSector && (
            <div className="w-full sm:w-auto">
              <AccessControl
                entityType="sector"
                entityId={selectedSector.id}
                requiredLevel="write"
                fallback={
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto opacity-60"
                    onClick={() =>
                      toast.info(
                        "Vous n'avez pas les droits pour modifier ce secteur"
                      )
                    }
                  >
                    {isMobile
                      ? "Modifier/Créer un article"
                      : "Modifier ou créer un article"}
                  </Button>
                }
              >
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link
                    href={`/dashboard/objet/${objetId}/secteur/${selectedSector.id}/edit?addArticle=1`}
                  >
                    {isMobile
                      ? "Modifier/Créer un article"
                      : "Modifier ou créer un article"}
                  </Link>
                </Button>
              </AccessControl>
            </div>
          )}
        </div>
      )}

      {/* Conteneur principal avec l'image et la barre latérale */}
      <div className="flex-1 relative flex">
        {/* Container de l'image - s'ajuste automatiquement quand la sidebar est ouverte */}
        <div
          ref={mainContainerRef}
          className={`flex-1 flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isFullscreen ? "bg-transparent" : "bg-transparent p-1"
          }`}
        >
          {selectedSector ? (
            <div className="relative w-full max-h-full flex items-center justify-center">
              {/* Boutons de navigation entre secteurs */}
              {sectors.length > 1 && (
                <>
                  <button
                    onClick={navigateToPreviousSector}
                    className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 p-1 md:p-2 bg-background bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                    aria-label="Secteur précédent"
                  >
                    <ChevronLeft size={isMobile ? 16 : 24} />
                  </button>
                  <button
                    onClick={navigateToNextSector}
                    className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 p-1 md:p-2 bg-background bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                    aria-label="Secteur suivant"
                  >
                    <ChevronRight size={isMobile ? 16 : 24} />
                  </button>
                </>
              )}

              {/* Indicateur de chargement */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64 w-full">
                  <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-[#d9840d]"></div>
                </div>
              ) : (
                <div className="max-w-full">
                  <ImageWithArticles
                    imageSrc={selectedSector.image}
                    imageAlt={selectedSector.name}
                    originalWidth={selectedSector.imageWidth || 1200}
                    originalHeight={selectedSector.imageHeight || 900}
                    articles={articles}
                    onArticleClick={handleArticleClick}
                    onArticleHover={handleArticleHover}
                    hoveredArticleId={hoveredArticleId}
                    selectedArticleId={selectedArticleId}
                    onArticleMove={(articleId: string) => {
                      // Rediriger vers la page d'édition avec l'article sélectionné
                      window.location.href = `/dashboard/objet/${objetId}/secteur/${selectedSector.id}/edit?selectedArticle=${articleId}&mode=move`;
                    }}
                    onArticleResize={(articleId: string) => {
                      // Rediriger vers la page d'édition avec l'article sélectionné
                      window.location.href = `/dashboard/objet/${objetId}/secteur/${selectedSector.id}/edit?selectedArticle=${articleId}&mode=resize`;
                    }}
                    onArticleEdit={(articleId: string) => {
                      // Rediriger vers la page d'édition avec l'article sélectionné
                      window.location.href = `/dashboard/objet/${objetId}/secteur/${selectedSector.id}/edit?selectedArticle=${articleId}&mode=edit`;
                    }}
                    onArticleDelete={handleArticleDelete}
                    onArticleUpdate={handleArticleUpdate}
                    onArticlePositionUpdate={handleArticlePositionUpdate}
                    className={`${
                      isFullscreen
                        ? "max-h-screen"
                        : "max-h-[calc(100vh-150px)]"
                    }`}
                  />
                </div>
              )}

              {/* Barre d'information en bas de l'image */}
              <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 bg-background bg-opacity-80 px-2 md:px-4 py-1 md:py-2 rounded-full shadow-md z-10 flex items-center gap-2 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <Layers size={isMobile ? 12 : 16} />
                  <span className="truncate max-w-[150px] md:max-w-[250px]">
                    {selectedIndex + 1} / {sectors.length}:{" "}
                    {selectedSector.name}
                  </span>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-1 rounded hover:bg-gray-200"
                  title={
                    isFullscreen ? "Quitter le plein écran" : "Mode plein écran"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 size={isMobile ? 12 : 16} />
                  ) : (
                    <Maximize2 size={isMobile ? 12 : 16} />
                  )}
                </button>
              </div>

              {/* Liste des articles pour mobile uniquement */}
              {selectedSector && !isFullscreen && isMobile && (
                <div className="md:hidden">
                  {/* Sheet pour mobile */}
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    {/* Bouton flottant pour ouvrir la liste */}
                    {/* @ts-expect-error - Types issue with shadcn/ui SheetTrigger children prop */}
                    <SheetTrigger className="fixed bottom-20 left-4 z-[9] flex items-center gap-1 bg-primary text-primary-foreground rounded-full shadow-lg px-3 py-3 hover:scale-105 transition-transform">
                      <ListFilter size={18} />
                      <span className="ml-1 text-sm font-medium">
                        {articles.length} Articles
                      </span>
                    </SheetTrigger>

                    <SheetContent
                      side="bottom"
                      className="h-[80vh] rounded-t-2xl"
                    >
                      {/* Indicateur de défilement (handle) */}
                      <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4 opacity-60" />

                      <SheetHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold text-left">
                              Articles de &quot;{selectedSector.name}&quot;
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={toggleSortDirection}
                              className="flex items-center gap-1"
                              title={
                                sortDirection === "asc" ? "Tri A-Z" : "Tri Z-A"
                              }
                            >
                              {sortDirection === "asc" ? (
                                <ArrowUp size={16} />
                              ) : (
                                <ArrowDown size={16} />
                              )}
                            </Button>
                          </div>
                        </div>
                      </SheetHeader>

                      {/* Contenu de la Sheet mobile */}
                      <div className="flex flex-col h-full">
                        {/* Barre de recherche */}
                        <div className="relative mb-4">
                          <Search
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Rechercher un article..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-2 pl-10 pr-8 border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                          />
                          {searchTerm && (
                            <button
                              onClick={clearSearch}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>

                        {/* Liste d'articles filtrée */}
                        <div className="flex-1 overflow-y-auto">
                          {filteredArticles.length === 0 ? (
                            <div className="text-center py-10 px-5 text-muted-foreground">
                              {articles.length === 0
                                ? "Aucun article disponible pour ce secteur"
                                : "Aucun article ne correspond à votre recherche"}
                            </div>
                          ) : (
                            <div className="space-y-3 pb-5">
                              {filteredArticles.map((article) => (
                                <div
                                  key={article.id}
                                  onClick={() => handleArticleClick(article.id)}
                                  onMouseEnter={() =>
                                    handleArticleHover(article.id)
                                  }
                                  onMouseLeave={() => handleArticleHover(null)}
                                  className={`p-4 rounded-xl border cursor-pointer shadow-sm transition-colors ${
                                    hoveredArticleId === article.id
                                      ? "bg-amber-50 border-amber-200"
                                      : "bg-background hover:bg-muted/50"
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium mb-2 text-base">
                                      {article.title}
                                    </h4>
                                    <ExternalLink
                                      size={14}
                                      className="text-muted-foreground mt-1"
                                    />
                                  </div>

                                  {article.description && (
                                    <p
                                      className="text-sm text-muted-foreground leading-relaxed overflow-hidden text-ellipsis"
                                      style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical" as const,
                                      }}
                                    >
                                      {article.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4">
              Sélectionnez un secteur pour afficher son image
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
