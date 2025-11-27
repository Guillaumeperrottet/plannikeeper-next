"use client";

import { useState, useRef } from "react";
import { Task, User } from "../../lib/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { TaskTypeSelector } from "../shared/TaskTypeSelector";
import {
  Calendar,
  X,
  Paperclip,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface TaskFormProps {
  task?: Task;
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Partial<Task>, documents?: File[]) => Promise<void>;
}

export function TaskForm({
  task,
  users,
  open,
  onOpenChange,
  onSave,
}: TaskFormProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    name: task?.name || "",
    description: task?.description || "",
    status: task?.status || "pending",
    taskType: task?.taskType || null,
    realizationDate: task?.realizationDate || null,
    assignedToId: task?.assignedToId || null,
    recurring: task?.recurring || false,
    period: task?.period || "weekly",
    endDate: task?.endDate || null,
    recurrenceReminderDate: task?.recurrenceReminderDate || null,
    color: task?.color || "#3b82f6",
  });

  const [documents, setDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setDocuments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error("Le nom de la tâche est requis");
      return;
    }

    if (!formData.assignedToId) {
      toast.error("Veuillez assigner la tâche à un utilisateur");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData, documents.length > 0 ? documents : undefined);
      onOpenChange(false);
      // Reset form
      setFormData({
        name: "",
        description: "",
        status: "pending",
        taskType: null,
        realizationDate: null,
        assignedToId: null,
        recurring: false,
        period: "weekly",
        endDate: null,
        recurrenceReminderDate: null,
        color: "#3b82f6",
      });
      setDocuments([]);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {task?.id ? "Modifier la tâche" : "Nouvelle tâche"}
          </SheetTitle>
          <SheetDescription>
            Remplissez les informations de la tâche
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Nom */}
          <div>
            <Label htmlFor="name">Nom de la tâche *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nom de la tâche"
              required
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Description détaillée (optionnelle)"
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Statut et Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">À faire</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type de tâche</Label>
              <TaskTypeSelector
                value={formData.taskType || null}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, taskType: value }))
                }
                className="mt-2"
              />
            </div>
          </div>

          {/* Date et Assignation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="realizationDate">Date de réalisation</Label>
              <div className="relative mt-2">
                <Input
                  id="realizationDate"
                  name="realizationDate"
                  type="date"
                  value={
                    formData.realizationDate
                      ? new Date(formData.realizationDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={handleChange}
                  className="pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <div>
              <Label htmlFor="assignedToId">Attribuer à *</Label>
              <Select
                value={formData.assignedToId || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assignedToId: value }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Récurrence */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurring: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="recurring" className="font-normal">
                Tâche récurrente
              </Label>
            </div>

            {formData.recurring && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 pl-6 border-l-2 border-primary"
              >
                <div>
                  <Label htmlFor="period">Période</Label>
                  <Select
                    value={formData.period || "weekly"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, period: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="quarterly">Trimestrielle</SelectItem>
                      <SelectItem value="yearly">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={
                      formData.endDate
                        ? new Date(formData.endDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Documents */}
          <div>
            <Label>Documents</Label>
            <div
              className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragging ? "border-primary bg-primary/5" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,image/*"
              />
              <Paperclip className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Glissez-déposez des fichiers ici
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Sélectionnez des fichiers
              </Button>
            </div>

            {documents.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 space-y-2"
              >
                {documents.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 text-primary" />
                      ) : (
                        <FileText className="w-4 h-4 text-primary" />
                      )}
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
