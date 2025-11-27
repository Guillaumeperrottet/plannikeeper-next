// Header de l'agenda - Version Mobile
"use client";

import { X, ChevronUp } from "lucide-react";
import { AppObject } from "../../types";

interface MobileHeaderProps {
  objects: AppObject[];
  selectedObjectId: string;
  onObjectChange: (objectId: string) => void;
  onToggle: () => void;
  onClose: () => void;
  isExpanded: boolean;
  taskCount: number;
}

export const MobileHeader = ({
  objects,
  selectedObjectId,
  onObjectChange,
  onToggle,
  onClose,
  isExpanded,
  taskCount,
}: MobileHeaderProps) => {
  return (
    <div className="flex justify-between items-center h-full w-full px-3">
      {/* Partie gauche */}
      <div className="flex items-center min-w-0 flex-1">
        {isExpanded ? (
          <select
            className="bg-background text-foreground px-2 py-1 rounded border border-border text-sm transition-all active:scale-95 max-w-[160px] truncate"
            value={selectedObjectId}
            onChange={(e) => onObjectChange(e.target.value)}
            style={{
              WebkitAppearance: "none",
            }}
          >
            {objects.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.nom}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold truncate">Agenda</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {taskCount}
            </span>
          </div>
        )}
      </div>

      {/* Titre centré uniquement si ouvert */}
      {isExpanded && (
        <div className="flex-shrink-0 mx-2">
          <h2 className="text-base font-semibold">Agenda</h2>
        </div>
      )}

      {/* Partie droite - Bouton d'action */}
      <div className="flex items-center flex-shrink-0">
        {isExpanded ? (
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            aria-label="Fermer l'agenda"
          >
            <X size={20} className="text-foreground" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="p-2 text-foreground active:scale-95 transition-all"
            title="Agrandir"
            aria-label="Agrandir"
          >
            <ChevronUp size={24} />
          </button>
        )}
      </div>
    </div>
  );
};
