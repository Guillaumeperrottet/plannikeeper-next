// Filtres rapides pour l'assignation
"use client";

import { AssignableUser } from "../../types";

interface QuickFiltersProps {
  assigneeFilter: string;
  onAssigneeFilterChange: (filter: string) => void;
  assignableUsers: AssignableUser[];
}

export const QuickFilters = ({
  assigneeFilter,
  onAssigneeFilterChange,
  assignableUsers,
}: QuickFiltersProps) => {
  return (
    <div className="flex items-center">
      <select
        className="bg-background text-foreground pl-2 pr-3 py-1.5 rounded-full border border-border text-xs appearance-none focus:outline-none"
        value={assigneeFilter}
        onChange={(e) => onAssigneeFilterChange(e.target.value)}
        style={{ WebkitAppearance: "none", minWidth: "100px" }}
      >
        <option value="me">👤 Mes tâches</option>
        <option value="all">👥 Toutes</option>
        {assignableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name.length > 10
              ? `${user.name.substring(0, 10)}...`
              : user.name}
          </option>
        ))}
      </select>
    </div>
  );
};
