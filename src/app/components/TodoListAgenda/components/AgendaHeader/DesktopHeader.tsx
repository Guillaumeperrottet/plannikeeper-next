// Header de l'agenda - Version Desktop
"use client";

import { X } from "lucide-react";
import { AppObject, Task, ArticleOption } from "../../types";
import PrintButton from "@/app/components/ui/PrintButton";

interface DesktopHeaderProps {
  objects: AppObject[];
  selectedObjectId: string;
  onObjectChange: (objectId: string) => void;
  onToggle: () => void;
  onClose: () => void;
  isExpanded: boolean;
  // Props pour le bouton d'impression
  tasks: Task[];
  filteredTasks: Task[];
  objectName: string;
  searchTerm: string;
  statusFilter: string;
  articleFilter: string;
  availableArticles: ArticleOption[];
  thisWeekEnd: Date;
}

export const DesktopHeader = ({
  objects,
  selectedObjectId,
  onObjectChange,
  onToggle,
  onClose,
  isExpanded,
  tasks,
  filteredTasks,
  objectName,
  searchTerm,
  statusFilter,
  articleFilter,
  availableArticles,
  thisWeekEnd,
}: DesktopHeaderProps) => {
  const handleHeaderClick = (e: React.MouseEvent) => {
    // Ne pas ouvrir si on clique sur le select ou le bouton d'impression
    const target = e.target as HTMLElement;
    if (target.closest("select") || target.closest("button")) {
      return;
    }

    console.log("Desktop Header clicked, isExpanded:", isExpanded);
    if (!isExpanded) {
      onToggle();
    }
  };

  return (
    <div
      className="grid grid-cols-3 items-center h-full px-4 transition-colors w-full"
      style={{
        cursor: isExpanded ? "default" : "pointer",
        backgroundColor: isExpanded ? "transparent" : undefined,
      }}
      onClick={handleHeaderClick}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {/* Bouton d'impression à gauche */}
      <div className="flex items-center justify-start">
        <PrintButton
          tasks={tasks}
          filteredTasks={filteredTasks}
          objectName={objectName}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          articleFilter={articleFilter}
          availableArticles={availableArticles}
          isMobile={false}
          thisWeekEnd={thisWeekEnd}
        />
      </div>

      {/* Titre centré */}
      <h2 className="text-xl font-semibold text-center">Agenda todo list</h2>

      {/* Sélecteur d'objet et bouton de fermeture à droite */}
      <div className="flex items-center gap-4 justify-end">
        <select
          className="bg-background text-foreground px-3 py-1 rounded border border-border text-sm transition-all active:scale-95"
          value={selectedObjectId}
          onChange={(e) => {
            onObjectChange(e.target.value);
          }}
        >
          {objects.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.nom}
            </option>
          ))}
        </select>

        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Empêcher le clic de propager au header
              onClose();
            }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Fermer l'agenda"
          >
            <X size={20} className="text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
