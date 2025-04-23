"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  width?: number | null;
  height?: number | null;
}

interface EditArticleFormProps {
  article: Article;
  objectId: string;
  sectorId: string;
}

export default function EditArticleForm({
  article,
  objectId,
  sectorId,
}: EditArticleFormProps) {
  const [title, setTitle] = useState(article.title);
  const [description, setDescription] = useState(article.description || "");
  const [width, setWidth] = useState(article.width?.toString() || "8");
  const [height, setHeight] = useState(article.height?.toString() || "8");
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
      const parsedWidth = parseFloat(width);
      const parsedHeight = parseFloat(height);

      const response = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          width: isNaN(parsedWidth)
            ? 8
            : Math.max(4, Math.min(50, parsedWidth)),
          height: isNaN(parsedHeight)
            ? 8
            : Math.max(4, Math.min(50, parsedHeight)),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Une erreur est survenue");
      }

      toast.success("Article mis à jour avec succès");
      router.push(
        `/dashboard/objet/${objectId}/secteur/${sectorId}/article/${article.id}`
      );
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour de l'article"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="width"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Largeur (%)
          </label>
          <input
            type="number"
            id="width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="4"
            max="50"
            step="1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Largeur en pourcentage (4-50%)
          </p>
        </div>
        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Hauteur (%)
          </label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="4"
            max="50"
            step="1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Hauteur en pourcentage (4-50%)
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/dashboard/objet/${objectId}/secteur/${sectorId}/article/${article.id}`
            )
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
          {isSubmitting ? "Mise à jour..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
