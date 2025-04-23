"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Layers,
} from "lucide-react";

type Sector = {
  id: string;
  name: string;
  image: string;
  objectId: string;
};

export default function SectorViewer({
  sectors,
  objetId,
}: {
  sectors: Sector[];
  objetId: string;
}) {
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sélectionner le premier secteur au chargement si aucun n'est sélectionné
  useEffect(() => {
    if (sectors.length > 0 && !selectedSector) {
      setSelectedSector(sectors[0]);
      setSelectedIndex(0);
    }
  }, [sectors, selectedSector]);

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
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigateToNextSector, navigateToPreviousSector, isFullscreen]);

  return (
    <div
      className={`flex-1 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      }`}
    >
      {!isFullscreen && (
        <div className="p-4 bg-white border-b flex justify-between items-center">
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
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-md shadow-lg z-10">
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
          <div className="relative max-w-full max-h-full w-auto h-auto">
            {sectors.length > 1 && (
              <>
                <button
                  onClick={navigateToPreviousSector}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                  aria-label="Secteur précédent"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={navigateToNextSector}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 z-10"
                  aria-label="Secteur suivant"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <div
              className="cursor-pointer"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Image
                src={selectedSector.image}
                alt={selectedSector.name}
                width={1200}
                height={900}
                className={`object-contain ${
                  isFullscreen ? "max-h-screen" : "max-h-[calc(100vh-150px)]"
                } rounded-md shadow-md`}
                priority
              />
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 px-4 py-2 rounded-full shadow-md z-10">
              <div className="flex items-center gap-2">
                <Layers size={16} />
                <span>
                  {selectedIndex + 1} / {sectors.length}: {selectedSector.name}
                </span>
              </div>
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
