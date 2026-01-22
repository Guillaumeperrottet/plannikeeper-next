"use client";

import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Clock,
  Trash2,
  MoreVertical,
  Archive,
} from "lucide-react";

interface TaskActionsProps {
  readonly?: boolean;
  isLoading: boolean;
  currentStatus: string;
  onDelete: () => Promise<void>;
  onStatusChange: (status: string) => Promise<void>;
}

export function TaskActions({
  readonly = false,
  isLoading,
  currentStatus,
  onDelete,
  onStatusChange,
}: TaskActionsProps) {
  if (readonly) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Archive className="h-4 w-4" />
        <span className="text-sm font-medium">
          Tâche archivée - Lecture seule
        </span>
      </div>
    );
  }

  // Quick action button based on status
  const getQuickAction = () => {
    if (currentStatus === "pending" || currentStatus === "in_progress") {
      return (
        <motion.div
          key="complete-action"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 sm:flex-none"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => onStatusChange("completed")}
            disabled={isLoading}
            className="gap-2 h-11 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Terminer la tâche</span>
          </Button>
        </motion.div>
      );
    }

    if (currentStatus === "completed" || currentStatus === "cancelled") {
      return (
        <motion.div
          key="reopen-action"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 sm:flex-none"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange("pending")}
            disabled={isLoading}
            className="gap-1.5 h-8 w-full sm:w-auto"
          >
            <Clock className="h-4 w-4" />
            <span>Remettre à faire</span>
          </Button>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center gap-2">
      {getQuickAction()}

      {/* Desktop actions */}
      <div className="hidden sm:flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="h-8 px-3"
            >
              <Trash2 size={14} className="mr-1.5" />
              Supprimer
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Supprimer définitivement la tâche</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden h-8 w-8 p-0"
            aria-label="Plus d'options"
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Status actions */}
          {(currentStatus === "pending" || currentStatus === "in_progress") && (
            <DropdownMenuItem
              onClick={() => onStatusChange("completed")}
              disabled={isLoading}
            >
              <CheckCircle2 size={14} className="mr-2" />
              Marquer terminée
            </DropdownMenuItem>
          )}

          {(currentStatus === "completed" || currentStatus === "cancelled") && (
            <DropdownMenuItem
              onClick={() => onStatusChange("pending")}
              disabled={isLoading}
            >
              <Clock size={14} className="mr-2" />
              Remettre à faire
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 size={14} className="mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
