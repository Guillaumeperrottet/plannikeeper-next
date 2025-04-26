"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Layers,
  Maximize2,
  Minimize2,
} from "lucide-react";
import ImageWithArticles from "@/app/components/ImageWithArticles";

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
  positionX: number | null; // Stocké en pourcentage
  positionY: number | null; // Stocké en pourcentage
  width: number | null; // Stocké en pourcentage
  height: number | null; // Stocké en pourcentage
};

export default function SectorViewer({
  sectors,
  objetId,
}: {
  sectors: Sector[];
  objetId: string;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

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
    setIsDropdownOpen(false);
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);

    // En mode plein écran, nous voulons maximiser l'espace d'affichage
    if (!isFullscreen && viewerRef.current) {
      try {
        if (viewerRef.current.requestFullscreen) {
          viewerRef.current.requestFullscreen();
        }
      } catch (err) {
        console.log("Fullscreen API not supported or enabled");
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

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
  }, [navigateToNextSector, navigateToPreviousSector, isFullscreen]);

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
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      }`}
    >
      {!isFullscreen && (
        <div className="p-4 bg-background border-b flex justify-between items-center">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200"
            >
              <span>
                {selectedSector
                  ? selectedSector.name
                  : "Sélectionner un secteur"}
              </span>
              <ChevronDown size={16} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-md shadow-lg z-10">
                {sectors.map((sector) => (
                  <button
                    key={sector.id}
                    onClick={() => handleSectorChange(sector)}
                    className={`block w-full text-left px-4 py-2 hover:bg-blue-50 ${
                      selectedSector?.id === sector.id ? "bg-blue-50" : ""
                    }`}
                  >
                    {sector.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedSector && (
              <Link
                href={`/dashboard/objet/${objetId}/secteur/${selectedSector.id}/edit`}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <Edit size={16} />
                <span>Éditer ce secteur</span>
              </Link>
            )}
            <Link
              href={`/dashboard/objet/${objetId}/secteur/new`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} />
              <span>Ajouter un secteur</span>
            </Link>
          </div>
        </div>
      )}

      <div
        className={`flex-1 flex items-center justify-center overflow-hidden ${
          isFullscreen ? "bg-black" : "bg-gray-100 p-4"
        }`}
      >
        {selectedSector ? (
          <div className="relative w-full max-h-full">
            {sectors.length > 1 && (
              <>
                <button
                  onClick={navigateToPreviousSector}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-background bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                  aria-label="Secteur précédent"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={navigateToNextSector}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-background bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                  aria-label="Secteur suivant"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center h-64 w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div>
                <ImageWithArticles
                  imageSrc={selectedSector.image}
                  imageAlt={selectedSector.name}
                  originalWidth={selectedSector.imageWidth || 1200}
                  originalHeight={selectedSector.imageHeight || 900}
                  articles={articles}
                  onArticleClick={handleArticleClick}
                  onArticleHover={setHoveredArticleId}
                  hoveredArticleId={hoveredArticleId}
                  className={`rounded-md shadow-md ${
                    isFullscreen ? "max-h-screen" : "max-h-[calc(100vh-150px)]"
                  }`}
                />
              </div>
            )}

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background bg-opacity-80 px-4 py-2 rounded-full shadow-md z-10 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Layers size={16} />
                <span>
                  {selectedIndex + 1} / {sectors.length}: {selectedSector.name}
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
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Sélectionnez un secteur pour afficher son image
          </div>
        )}
      </div>
    </div>
  );
}
