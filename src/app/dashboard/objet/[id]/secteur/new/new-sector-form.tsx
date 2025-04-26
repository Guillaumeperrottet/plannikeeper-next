"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Trash } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function NewSectorForm({ objetId }: { objetId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (file: File | null) => {
    setImage(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom du secteur est requis");
      return;
    }

    if (!image) {
      toast.error("L'image du secteur est requise");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Création du secteur en cours...");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("image", image);
      formData.append("objectId", objetId);

      const response = await fetch("/api/secteur/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            "Une erreur est survenue lors de la création du secteur"
        );
      }

      toast.success("Secteur créé avec succès!", { id: toastId });
      router.push(`/dashboard/objet/${objetId}/edit`);
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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-background rounded-lg border border-gray-200 p-6"
    >
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nom du secteur *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Cuisine, Salle de bain..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image du secteur *
        </label>
        <div className="mt-2 flex items-start space-x-4">
          <div className="flex-shrink-0">
            {imagePreview ? (
              <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Aperçu de l'image"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleImageChange(null)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
                >
                  <Trash size={16} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Cliquez pour sélectionner une image
                  </p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleImageChange(file);
                  }}
                  required
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">
              L&apos;image doit être au format JPG, PNG ou GIF et ne pas
              dépasser 5 Mo. Choisissez une image qui représente bien le secteur
              pour faciliter son identification.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Link
          href={`/dashboard/objet/${objetId}/edit`}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Création en cours..." : "Créer le secteur"}
        </button>
      </div>
    </form>
  );
}
