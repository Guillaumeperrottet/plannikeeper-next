"use client";

import DropdownMenu from "@/app/components/ui/dropdownmenu";
import { Button } from "@/app/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ImageWithArticles from "@/app/components/ImageWithArticles";
import AccessControl from "@/app/components/AccessControl";
import ArticleList from "@/app/components/ArticleList";
import MobileArticleList from "@/app/components/MobileArticleList";

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

interface SectorViewerProps {
  sectors: Sector[];
  objetId: string;
}

export default function SectorViewer({ sectors, objetId }: SectorViewerProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

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

  // Gestion des touches clavier pour la navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        navigateToPreviousSector();
      } else if (event.key === "ArrowRight") {
        navigateToNextSector();
      } else if (event.key === "Escape") {
        setIsFullscreen(false);
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
      className={`flex-1 flex flex-col h-full ${
        isFullscreen ? "fixed inset-0 z-50 bg-background" : ""
      }`}
    >
      {/* Header avec contrôles - caché en plein écran */}
      {!isFullscreen && (
        <div className="p-2 md:p-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 bg-transparent relative">
          {/* Interface de sélection de secteur */}
          <div className="w-full sm:w-auto flex-1 flex items-center">
            <DropdownMenu
              items={sectors.map((s) => ({ id: s.id, label: s.name }))}
              selectedId={selectedSector?.id}
              onSelect={(id) => {
                const sector = sectors.find((s) => s.id === id);
                if (sector) handleSectorChange(sector);
              }}
              label={
                selectedSector ? selectedSector.name : "Sélectionner un secteur"
              }
            />

            {/* Liste d'articles desktop - positionnée de manière absolue */}
            {selectedSector && !isMobile && (
              <div className="hidden md:block absolute top-full left-0 z-10">
                <ArticleList
                  articles={articles}
                  selectedSectorName={selectedSector.name}
                  objetId={objetId}
                  sectorId={selectedSector.id}
                  onArticleClick={handleArticleClick}
                  onArticleHover={setHoveredArticleId}
                  hoveredArticleId={hoveredArticleId}
                  isMobile={false}
                />
              </div>
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

      {/* Container principal de visualisation */}
      <div
        className={`flex-1 ${isFullscreen ? "h-screen" : "h-[calc(100vh-150px)]"} overflow-hidden`}
      >
        {/* Container principal de l'image */}
        <div
          ref={imageContainerRef}
          className={`flex-1 relative flex items-center justify-center ${
            isFullscreen ? "p-0" : "p-1"
          }`}
        >
          {selectedSector ? (
            <>
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
                <ImageWithArticles
                  imageSrc={selectedSector.image}
                  imageAlt={selectedSector.name}
                  originalWidth={selectedSector.imageWidth || 1200}
                  originalHeight={selectedSector.imageHeight || 900}
                  articles={articles}
                  onArticleClick={handleArticleClick}
                  onArticleHover={setHoveredArticleId}
                  hoveredArticleId={hoveredArticleId}
                  className="max-h-full w-full"
                />
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
            </>
          ) : (
            <div className="text-center text-gray-500 p-4">
              Sélectionnez un secteur pour afficher son image
            </div>
          )}
        </div>
      </div>

      {/* Liste des articles pour mobile uniquement - visible seulement quand pas en plein écran */}
      {selectedSector && !isFullscreen && isMobile && (
        <MobileArticleList
          articles={articles}
          selectedSectorName={selectedSector.name}
          objetId={objetId}
          sectorId={selectedSector.id}
          onArticleClick={handleArticleClick}
          onArticleHover={setHoveredArticleId}
          hoveredArticleId={hoveredArticleId}
        />
      )}
    </div>
  );
}
