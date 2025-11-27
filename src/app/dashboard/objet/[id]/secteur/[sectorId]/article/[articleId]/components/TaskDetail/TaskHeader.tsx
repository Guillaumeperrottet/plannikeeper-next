"use client";

import { useState } from "react";
import { Task } from "../../lib/types";
import { StatusBadgeEditable } from "../shared/StatusBadgeEditable";
import { UserAvatar } from "../shared/UserAvatar";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCcw, Pencil } from "lucide-react";
import { getPeriodLabel } from "../../lib/taskHelpers";
import { toast } from "sonner";

interface TaskHeaderProps {
  task: Task;
  readonly?: boolean;
  onUpdate?: (updates: Partial<Task>) => Promise<void>;
  onStatusChange?: (newStatus: string) => Promise<void>;
}

export function TaskHeader({
  task,
  readonly = false,
  onUpdate,
  onStatusChange,
}: TaskHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTitle = async () => {
    if (!onUpdate || !titleValue.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onUpdate({ name: titleValue });
      setIsEditingTitle(false);
      toast.success("Titre modifié");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
      setTitleValue(task.name); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTitle = () => {
    setIsEditingTitle(false);
    setTitleValue(task.name);
  };
  return (
    <div className="space-y-4">
      {/* Titre avec couleur */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: task.color || "#3b82f6" }}
        />
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <Input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") handleCancelTitle();
              }}
              disabled={isSaving}
              className="text-xl font-bold bg-transparent border-b border-t-0 border-x-0 border-input focus:border-ring rounded-none px-0 h-auto py-1"
              autoFocus
            />
          ) : (
            <div
              className={`text-2xl font-bold text-foreground leading-tight ${
                !readonly
                  ? "cursor-pointer hover:bg-muted/30 rounded px-2 py-1 -mx-2 -my-1 transition-colors group flex items-center gap-2"
                  : ""
              }`}
              onClick={() => !readonly && setIsEditingTitle(true)}
            >
              {task.name}
              {!readonly && (
                <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <StatusBadgeEditable
                status={task.status}
                readonly={readonly}
                onStatusChange={onStatusChange}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {readonly
                ? "Statut actuel de la tâche"
                : "Cliquer pour changer le statut"}
            </p>
          </TooltipContent>
        </Tooltip>

        {task.taskType && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="text-xs h-6 px-2.5">
                {task.taskType}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Type de tâche</p>
            </TooltipContent>
          </Tooltip>
        )}

        {task.recurring && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1.5 text-xs h-6 px-2.5">
                <RefreshCcw size={11} />
                {getPeriodLabel(task.period)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tâche récurrente - se répète automatiquement</p>
            </TooltipContent>
          </Tooltip>
        )}

        {task.assignedTo && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2">
                <UserAvatar user={task.assignedTo} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {task.assignedTo.name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Assigné à {task.assignedTo.name}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
