"use client";

import { useState } from "react";
import { Task } from "../../lib/types";
import { UserAvatar } from "../shared/UserAvatar";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCcw, Pencil } from "lucide-react";
import { getPeriodLabel } from "../../lib/taskHelpers";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
};

interface TaskHeaderProps {
  task: Task;
  users?: User[];
  readonly?: boolean;
  onUpdate?: (updates: Partial<Task>) => Promise<void>;
  onStatusChange?: (newStatus: string) => Promise<void>;
}

export function TaskHeader({
  task,
  users = [],
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

  // Déterminer la couleur du point selon le statut
  const dotColor = task.status === "completed" ? "#22c55e" : "#ef4444"; // vert si terminé, rouge sinon

  const statusOptions = [
    { value: "pending", label: "À faire", color: "#ef4444" },
    { value: "in_progress", label: "En cours", color: "#f59e0b" },
    { value: "completed", label: "Terminée", color: "#22c55e" },
    { value: "cancelled", label: "Annulée", color: "#6b7280" },
  ];

  return (
    <div className="space-y-4">
      {/* Titre avec point de statut cliquable */}
      <div className="flex items-center gap-3">
        {readonly ? (
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-3 h-3 rounded-full shrink-0 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-primary/50 transition-all"
                style={{ backgroundColor: dotColor }}
                title="Changer le statut"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Changer le statut
              </div>
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={async () => {
                    if (onStatusChange && task.status !== option.value) {
                      try {
                        await onStatusChange(option.value);
                      } catch {
                        toast.error("Erreur lors du changement de statut");
                      }
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <span>{option.label}</span>
                  {task.status === option.value && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
                  ? "cursor-text hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-all border-2 border-transparent hover:border-dashed hover:border-muted-foreground/30 group flex items-center gap-2"
                  : ""
              }`}
              onClick={() => !readonly && setIsEditingTitle(true)}
            >
              {task.name}
              {!readonly && (
                <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
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

        {(task.assignedTo || !readonly) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                {readonly ? (
                  <div className="flex items-center gap-2">
                    {task.assignedTo && (
                      <>
                        <UserAvatar user={task.assignedTo} size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {task.assignedTo.name}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <Select
                    value={task.assignedToId || "unassigned"}
                    onValueChange={async (value) => {
                      const newValue = value === "unassigned" ? null : value;
                      if (onUpdate) {
                        try {
                          await onUpdate({ assignedToId: newValue });
                          toast.success("Assignation modifiée");
                        } catch {
                          toast.error("Erreur lors de la modification");
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-auto border-0 bg-secondary hover:bg-secondary/80 text-sm gap-2">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {task.assignedTo ? (
                            <>
                              <UserAvatar user={task.assignedTo} size="sm" />
                              <span>{task.assignedTo.name}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Non assigné
                            </span>
                          )}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {readonly
                  ? `Assigné à ${task.assignedTo?.name || "personne"}`
                  : "Cliquer pour changer l'assignation"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
