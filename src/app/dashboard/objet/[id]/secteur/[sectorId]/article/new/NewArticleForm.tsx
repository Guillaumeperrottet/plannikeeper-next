"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface NewArticleFormProps {
  objectId: string;
  sectorId: string;
  initialX: number | null;
  initialY: number | null;
}

export default function NewArticleForm({
  objectId,
  sectorId,
  initialX,
  initialY,
}: NewArticleFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/articles/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          sectorId,
          positionX: initialX,
          positionY: initialY,
          width: 8, // Valeur par défaut: 8% de la largeur
          height: 8, // Valeur par défaut: 8% de la hauteur
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Une erreur est survenue");
      }

      const data = await response.json();
      toast.success("Article créé avec succès");
      router.push(`/dashboard/objet/${objectId}/secteur/${sectorId}`);
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de l'article"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Titre *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Titre de l'article"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
          placeholder="Description détaillée de l'article"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() =>
            router.push(`/dashboard/objet/${objectId}/secteur/${sectorId}`)
          }
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Création en cours..." : "Créer l'article"}
        </button>
      </div>
    </form>
  );
}
