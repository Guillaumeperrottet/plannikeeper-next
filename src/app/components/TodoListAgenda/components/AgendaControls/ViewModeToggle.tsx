// Bouton pour basculer entre Liste et Calendrier
"use client";

import { ListIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ViewMode } from "../../types";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: () => void;
  isMobile: boolean;
}

export const ViewModeToggle = ({
  viewMode,
  onToggle,
  isMobile,
}: ViewModeToggleProps) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={onToggle}
        variant={viewMode === ViewMode.LIST ? "default" : "outline"}
        size="sm"
        className="h-7 px-2.5 text-xs"
      >
        <ListIcon size={12} />
        {!isMobile && <span className="ml-1">Liste</span>}
      </Button>
      <Button
        onClick={onToggle}
        variant={viewMode === ViewMode.CALENDAR ? "default" : "outline"}
        size="sm"
        className="h-7 px-2.5 text-xs"
      >
        <CalendarIcon size={12} />
        {!isMobile && <span className="ml-1">Agenda</span>}
      </Button>
    </div>
  );
};
