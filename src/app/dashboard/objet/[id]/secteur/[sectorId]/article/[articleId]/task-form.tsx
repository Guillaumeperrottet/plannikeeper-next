"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, X } from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  executantComment: string | null;
  done: boolean;
  realizationDate: Date | null;
  status: string;
  taskType: string | null;
  color: string | null;
  recurring: boolean;
  period: string | null;
  endDate: Date | null;
  recurrenceReminderDate: Date | null;
  assignedToId: string | null;
  assignedTo: User | null;
  createdAt: Date;
  updatedAt: Date;
};

type TaskFormProps = {
  articleId: string;
  users: User[];
  task?: Task;
  onCancel?: () => void;
};

export default function TaskForm({
  articleId,
  users,
  task,
  onCancel,
}: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(!!task);
  const [isRecurring, setIsRecurring] = useState(task?.recurring || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    status: task?.status || "pending",
    taskType: task?.taskType || "",
    color: task?.color || "#3b82f6", // Bleu par défaut
    realizationDate: task?.realizationDate
      ? new Date(task.realizationDate).toISOString().split("T")[0]
      : "",
    assignedToId: task?.assignedToId || "",
    recurring: task?.recurring || false,
    period: task?.period || "daily",
    endDate: task?.endDate
      ? new Date(task.endDate).toISOString().split("T")[0]
      : "",
    executantComment: task?.executantComment || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));

    if (name === "recurring") {
      setIsRecurring(checked);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, color: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Le nom de la tâche est requis");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      task ? "Mise à jour de la tâche..." : "Création de la tâche..."
    );

    try {
      const taskData = {
        ...formData,
        articleId,
        realizationDate: formData.realizationDate || null,
        endDate:
          formData.recurring && formData.endDate ? formData.endDate : null,
      };

      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      toast.success(
        task ? "Tâche mise à jour avec succès" : "Tâche créée avec succès",
        { id: toastId }
      );

      // Réinitialiser le formulaire ou fermer
      if (!task) {
        setFormData({
          name: "",
          description: "",
          status: "pending",
          taskType: "",
          color: "#3b82f6",
          realizationDate: "",
          assignedToId: "",
          recurring: false,
          period: "daily",
          endDate: "",
          executantComment: "",
        });
        setIsRecurring(false);
        setIsOpen(false);
      } else if (onCancel) {
        onCancel();
      }

      // Rafraîchir la page pour voir les modifications
      window.location.reload();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`,
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !task) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 border-2 border-dashed text-gray-500 hover:text-gray-700 hover:border-gray-400 rounded-lg flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        <span>Ajouter une nouvelle tâche</span>
      </button>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">
          {task ? "Modifier la tâche" : "Nouvelle tâche"}
        </h3>

        {!task && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nom de la tâche *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Saisir le nom de la tâche"
            className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description détaillée (optionnelle)"
            className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Statut
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
            >
              <option value="pending">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="taskType"
              className="block text-sm font-medium mb-1"
            >
              Type de tâche
            </label>
            <input
              type="text"
              id="taskType"
              name="taskType"
              value={formData.taskType}
              onChange={handleChange}
              placeholder="Ex: Maintenance, Nettoyage, Réparation..."
              className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="realizationDate"
              className="block text-sm font-medium mb-1"
            >
              Date de réalisation prévue
            </label>
            <div className="relative">
              <input
                type="date"
                id="realizationDate"
                name="realizationDate"
                value={formData.realizationDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
              />
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="assignedToId"
              className="block text-sm font-medium mb-1"
            >
              Attribuer à
            </label>
            <select
              id="assignedToId"
              name="assignedToId"
              value={formData.assignedToId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Non assignée</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="color" className="block text-sm font-medium mb-1">
              Couleur
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleColorChange}
                className="w-10 h-10 p-0 border-0 rounded-md cursor-pointer"
              />
              <span className="text-sm">{formData.color}</span>
            </div>
          </div>

          <div className="col-span-2">
            <div className="flex items-center h-10">
              <input
                type="checkbox"
                id="recurring"
                name="recurring"
                checked={formData.recurring}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="recurring" className="ml-2 block text-sm">
                Tâche récurrente
              </label>
            </div>
          </div>
        </div>

        {isRecurring && (
          <div className="p-4 bg-blue-50 rounded-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="period"
                  className="block text-sm font-medium mb-1"
                >
                  Périodicité
                </label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                  <option value="quarterly">Trimestrielle</option>
                  <option value="yearly">Annuelle</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium mb-1"
                >
                  Date de fin (optionnelle)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {task && (
          <div>
            <label
              htmlFor="executantComment"
              className="block text-sm font-medium mb-1"
            >
              Commentaire d'exécution
            </label>
            <textarea
              id="executantComment"
              name="executantComment"
              value={formData.executantComment}
              onChange={handleChange}
              placeholder="Commentaires sur l'exécution de la tâche"
              className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500"
              rows={2}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          {task && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Annuler
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting
              ? task
                ? "Mise à jour..."
                : "Création..."
              : task
              ? "Mettre à jour"
              : "Créer la tâche"}
          </button>
        </div>
      </form>
    </div>
  );
}
