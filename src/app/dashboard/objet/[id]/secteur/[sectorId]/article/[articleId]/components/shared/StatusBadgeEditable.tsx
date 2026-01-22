"use client";

import { useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { getStatusConfig } from "../../lib/taskHelpers";
import { toast } from "sonner";

interface StatusBadgeEditableProps {
  status: string;
  readonly?: boolean;
  onStatusChange?: (newStatus: string) => Promise<void>;
}

const statusOptions = [
  { value: "pending", label: "À faire", icon: Clock, color: "text-blue-600" },
  {
    value: "in_progress",
    label: "En cours",
    icon: AlertCircle,
    color: "text-amber-600",
  },
  {
    value: "completed",
    label: "Terminée",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    value: "cancelled",
    label: "Annulée",
    icon: XCircle,
    color: "text-gray-600",
  },
];

export function StatusBadgeEditable({
  status,
  readonly = false,
  onStatusChange,
}: StatusBadgeEditableProps) {
  const [isSaving, setIsSaving] = useState(false);

  const config = getStatusConfig(status);

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange || isSaving || status === newStatus) return;

    setIsSaving(true);
    try {
      await onStatusChange(newStatus);
      // Ne pas afficher de toast ici pour "completed" car useTaskMutations/useTaskDetail
      // affichent déjà un toast personnalisé avec les actions
      if (newStatus !== "completed") {
        toast.success("Statut modifié");
      }
    } catch {
      toast.error("Erreur lors de la modification du statut");
    } finally {
      setIsSaving(false);
    }
  };

  // Déterminer la couleur du point selon le statut
  const dotColor = status === "completed" ? "bg-green-500" : "bg-red-500";

  if (readonly) {
    return (
      <Badge
        variant="secondary"
        className="text-xs h-6 px-2.5 flex items-center gap-1.5"
      >
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        {config.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant="secondary"
          className="text-xs h-6 px-2.5 cursor-pointer hover:opacity-80 transition-opacity group relative flex items-center gap-1.5"
        >
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          {config.label}
          <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Changer le statut
        </div>
        {statusOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Icon className={`w-4 h-4 ${option.color}`} />
              <span>{option.label}</span>
              {status === option.value && (
                <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
