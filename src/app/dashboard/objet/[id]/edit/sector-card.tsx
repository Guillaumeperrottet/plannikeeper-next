"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, MoreVertical } from "lucide-react";
import EditSectorModal from "./edit-sector-modal";
import DeleteSectorButton from "./delete-sector-button";

interface SectorCardProps {
  sector: {
    id: string;
    name: string;
    image: string | null;
    createdAt: Date;
  };
  objetId: string;
  isAdmin: boolean;
}

export default function SectorCard({
  sector,
  objetId,
  isAdmin,
}: SectorCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleEditSuccess = () => {
    setShowEditModal(false);
    // Le rafraîchissement de la page sera géré par le modal
  };

  return (
    <>
      <div className="bg-background rounded-lg border border-[color:var(--border)] overflow-hidden hover:shadow-md transition group">
        {/* Image et bouton menu */}
        <div className="relative w-full h-40">
          <Image
            src={sector.image || "/placeholder-image.jpg"}
            alt={sector.name}
            fill
            className="object-cover"
          />

          {/* Bouton menu - visible au survol */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowMenu(!showMenu);
                }}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
              >
                <MoreVertical size={16} className="text-gray-700" />
              </button>

              {/* Menu déroulant */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit size={14} />
                    Modifier
                  </button>

                  {isAdmin && (
                    <div className="px-3 py-1">
                      <DeleteSectorButton
                        sectorId={sector.id}
                        sectorName={sector.name}
                        className="w-full justify-start p-1 h-auto text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Overlay pour fermer le menu */}
          {showMenu && (
            <div
              className="fixed inset-0 z-[5]"
              onClick={() => setShowMenu(false)}
            />
          )}
        </div>

        {/* Contenu - cliquable pour aller vers la vue */}
        <Link
          href={`/dashboard/objet/${objetId}/view`}
          className="block p-4 hover:bg-[color:var(--muted)]/50 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-1 text-[color:var(--foreground)]">
            {sector.name}
          </h3>
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-[color:var(--muted-foreground)]">
              {new Date(sector.createdAt).toLocaleDateString()}
            </span>
            <span className="text-[color:var(--primary)] text-sm font-medium">
              Voir détails
            </span>
          </div>
        </Link>
      </div>

      {/* Modal d'édition */}
      <EditSectorModal
        sector={{
          id: sector.id,
          name: sector.name,
          image: sector.image,
        }}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
