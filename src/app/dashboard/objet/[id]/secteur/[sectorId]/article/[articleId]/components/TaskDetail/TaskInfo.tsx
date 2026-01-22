"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task } from "../../lib/types";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Paperclip } from "lucide-react";
import { formatDate } from "../../lib/taskHelpers";
import { toast } from "sonner";
import { GlobalFileUpload } from "../GlobalFileUpload";
import { DocumentsGallery } from "../DocumentsGallery";

interface TaskInfoProps {
  task: Task;
  readonly?: boolean;
  onUpdate?: (updates: Partial<Task>) => Promise<void>;
  refreshKey?: number;
  onUploadSuccess?: () => void;
}

export function TaskInfo({
  task,
  readonly = false,
  onUpdate,
  refreshKey = 0,
  onUploadSuccess,
}: TaskInfoProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save avec debounce pour la description
  const autoSave = useCallback(
    async (field: string, value: string | null) => {
      if (!onUpdate || isSaving) return;

      setIsSaving(true);
      try {
        await onUpdate({ [field]: value });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } catch {
        toast.error("Erreur lors de la sauvegarde automatique");
      } finally {
        setIsSaving(false);
      }
    },
    [onUpdate, isSaving],
  );

  // Debounce pour la description (auto-save après 1 seconde d'inactivité)
  useEffect(() => {
    if (
      editingField === "description" &&
      localValue !== null &&
      localValue !== task.description
    ) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        autoSave("description", localValue);
      }, 1000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [localValue, editingField, task.description, autoSave]);

  return (
    <div className="space-y-6">
      {/* Description - Premier élément car c'est le plus important */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Description
        </Label>
        <Textarea
          value={
            editingField === "description"
              ? (localValue as string) || ""
              : task.description || ""
          }
          onChange={(e) => {
            if (readonly) return;
            setEditingField("description");
            setLocalValue(e.target.value);
          }}
          onFocus={() => {
            if (readonly) return;
            setEditingField("description");
            setLocalValue(task.description || "");
          }}
          placeholder={
            readonly
              ? "Aucune description"
              : "Ajouter une description détaillée de la tâche..."
          }
          disabled={readonly || isSaving}
          className="min-h-[120px] resize-none"
        />
        {editingField === "description" && !readonly && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <span className="animate-spin">⏳</span> Sauvegarde...
                </span>
              ) : isSaved ? (
                <span className="text-green-600 flex items-center gap-1">
                  ✓ Enregistré
                </span>
              ) : (
                "Sauvegarde automatique après 1 seconde"
              )}
            </span>
          </div>
        )}
      </div>

      {/* Images et fichiers - Affichés directement sur mobile */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Photos & Fichiers
          </Label>
          {!readonly && onUploadSuccess && (
            <GlobalFileUpload
              taskId={task.id}
              onUploadSuccess={onUploadSuccess}
              compact={true}
            />
          )}
        </div>
        <DocumentsGallery key={refreshKey} taskId={task.id} />
      </div>

      {/* Informations secondaires */}
      <div className="grid grid-cols-1 gap-4">
        {/* Échéance - Discrète */}
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-muted rounded">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground block mb-1">
              Échéance
            </Label>
            {readonly ? (
              <div className="text-sm text-muted-foreground">
                {formatDate(task.realizationDate)}
              </div>
            ) : (
              <Input
                type="date"
                value={
                  task.realizationDate
                    ? new Date(task.realizationDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={async (e) => {
                  const newValue = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  if (onUpdate) {
                    try {
                      await onUpdate({ realizationDate: newValue });
                      toast.success("Échéance modifiée");
                    } catch {
                      toast.error("Erreur lors de la modification");
                    }
                  }
                }}
                disabled={isSaving}
                className="h-8 text-sm text-muted-foreground"
              />
            )}
          </div>
        </div>
      </div>

      {/* Informations secondaires (une seule ligne) */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>Modifiée: {formatDate(task.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
