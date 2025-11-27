"use client";

import { useState } from "react";
import { Task, User } from "../../lib/types";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Calendar, Clock, User as UserIcon, Pencil } from "lucide-react";
import { formatDate } from "../../lib/taskHelpers";
import { toast } from "sonner";

interface TaskInfoProps {
  task: Task;
  users: User[];
  readonly?: boolean;
  onUpdate?: (updates: Partial<Task>) => Promise<void>;
}

export function TaskInfo({
  task,
  users,
  readonly = false,
  onUpdate,
}: TaskInfoProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<Date | string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = (field: string, value: Date | string | null) => {
    if (readonly) return;
    setEditingField(field);
    setLocalValue(value);
  };

  const handleSave = async (field: string) => {
    if (!onUpdate || isSaving) return;

    setIsSaving(true);
    try {
      await onUpdate({ [field]: localValue });
      setEditingField(null);
      toast.success("Modification enregistrée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setLocalValue(null);
  };

  return (
    <div className="space-y-6">
      {/* Dates et assignation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Échéance */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground block mb-1">
              Échéance
            </Label>
            {editingField === "realizationDate" ? (
              <Input
                type="date"
                value={
                  localValue
                    ? new Date(localValue).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setLocalValue(
                    e.target.value ? new Date(e.target.value) : null
                  )
                }
                onBlur={() => handleSave("realizationDate")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave("realizationDate");
                  if (e.key === "Escape") handleCancel();
                }}
                autoFocus
                disabled={isSaving}
                className="h-8 text-sm"
              />
            ) : (
              <div
                className={`text-sm font-medium text-foreground ${
                  !readonly
                    ? "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors group flex items-center gap-2"
                    : ""
                }`}
                onClick={() =>
                  handleStartEdit("realizationDate", task.realizationDate)
                }
              >
                {formatDate(task.realizationDate)}
                {!readonly && (
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assigné à */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <UserIcon className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground block mb-1">
              Assigné à
            </Label>
            {editingField === "assignedToId" ? (
              <Select
                value={(localValue as string) || "unassigned"}
                onValueChange={(value) => {
                  const newValue = value === "unassigned" ? null : value;
                  setLocalValue(newValue);
                  // Auto-save on select
                  onUpdate?.({ assignedToId: newValue });
                  setEditingField(null);
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Sélectionner" />
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
            ) : (
              <div
                className={`text-sm font-medium text-foreground ${
                  !readonly
                    ? "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors group flex items-center gap-2"
                    : ""
                }`}
                onClick={() =>
                  handleStartEdit("assignedToId", task.assignedToId)
                }
              >
                {task.assignedTo?.name || (
                  <span className="text-muted-foreground italic">
                    Non assigné
                  </span>
                )}
                {!readonly && (
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date de modification */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muted/50 rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground block mb-1">
              Modifiée
            </Label>
            <div className="text-sm font-medium text-foreground">
              {formatDate(task.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        {editingField === "description" ? (
          <Textarea
            value={(localValue as string) || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => handleSave("description")}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCancel();
            }}
            placeholder="Ajouter une description..."
            className="min-h-[100px]"
            autoFocus
            disabled={isSaving}
          />
        ) : (
          <div
            className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed min-h-[80px] rounded-md p-4 ${
              !readonly
                ? "bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors group relative"
                : "bg-muted/30"
            }`}
            onClick={() =>
              handleStartEdit("description", task.description || "")
            }
          >
            {task.description || (
              <span className="text-muted-foreground italic">
                Cliquer pour ajouter une description...
              </span>
            )}
            {!readonly && (
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity absolute top-4 right-4" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
