// Header principal de l'agenda - Switch entre Desktop et Mobile
"use client";

import { DesktopHeader } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";
import { AppObject, Task, ArticleOption } from "../../types";

interface AgendaHeaderProps {
  isMobile: boolean;
  objects: AppObject[];
  selectedObjectId: string;
  onObjectChange: (objectId: string) => void;
  onToggle: () => void;
  onClose: () => void;
  isExpanded: boolean;
  taskCount: number;
  // Props pour Desktop
  tasks?: Task[];
  filteredTasks?: Task[];
  objectName?: string;
  searchTerm?: string;
  statusFilter?: string;
  articleFilter?: string;
  availableArticles?: ArticleOption[];
  thisWeekEnd?: Date;
}

export const AgendaHeader = ({
  isMobile,
  objects,
  selectedObjectId,
  onObjectChange,
  onToggle,
  onClose,
  isExpanded,
  taskCount,
  tasks = [],
  filteredTasks = [],
  objectName = "",
  searchTerm = "",
  statusFilter = "all",
  articleFilter = "all",
  availableArticles = [],
  thisWeekEnd = new Date(),
}: AgendaHeaderProps) => {
  return (
    <div
      className="flex justify-between items-center bg-secondary text-secondary-foreground relative border-b border-border h-12"
      data-agenda-header
    >
      {isMobile ? (
        <MobileHeader
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectChange={onObjectChange}
          onToggle={onToggle}
          onClose={onClose}
          isExpanded={isExpanded}
          taskCount={taskCount}
        />
      ) : (
        <DesktopHeader
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectChange={onObjectChange}
          onToggle={onToggle}
          onClose={onClose}
          isExpanded={isExpanded}
          tasks={tasks}
          filteredTasks={filteredTasks}
          objectName={objectName}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          articleFilter={articleFilter}
          availableArticles={availableArticles}
          thisWeekEnd={thisWeekEnd}
        />
      )}
    </div>
  );
};
