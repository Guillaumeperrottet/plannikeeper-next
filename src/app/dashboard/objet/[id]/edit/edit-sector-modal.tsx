"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash, Loader2, Edit } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  compressImage,
  validateImageFile,
  formatFileSize,
} from "@/lib/image-utils";

interface EditSectorModalProps {
  sector: {
    id: string;
    name: string;
    image: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSectorModal({
  sector,
  isOpen,
  onClose,
  onSuccess,
}: EditSectorModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(sector.name);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(sector.image);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageChange = async (file: File | null) => {
    if (file) {
      // Validation initiale
      const validation = validateImageFile(file, 10 * 1024 * 1024); // 10MB limite initiale
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      try {
        setIsCompressing(true);
        toast.info(`Compression de l'image (${formatFileSize(file.size)})...`);

        // Compresser l'image pour qu'elle soit sous 2MB
        const compressedFile = await compressImage(
          file,
          1920,
          1080,
          0.8,
          2 * 1024 * 1024
        );

        const compressionRatio = (
          ((file.size - compressedFile.size) / file.size) *
          100
        ).toFixed(1);
        toast.success(
          `Image compressée: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)} (-${compressionRatio}%)`
        );

        setImage(compressedFile);
        setShouldRemoveImage(false);
        const preview = URL.createObjectURL(compressedFile);
        setImagePreview(preview);
      } catch (error) {
        console.error("Erreur lors de la compression:", error);
        toast.error("Erreur lors de la compression de l'image");
      } finally {
        setIsCompressing(false);
      }
    } else {
      // Si file est null et qu'on a cliqué sur supprimer, on veut supprimer l'image
      setShouldRemoveImage(true);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom du secteur est requis");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    // Simuler une progression d'upload pour une meilleure UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 95);
      });
    }, 300);

    const toastId = toast.loading("Mise à jour du secteur en cours...");

    try {
      const formData = new FormData();
      formData.append("name", name);
      if (image) {
        formData.append("image", image);
      } else if (shouldRemoveImage) {
        // Indiquer explicitement que l'image doit être supprimée
        formData.append("removeImage", "true");
      }

      const response = await fetch(`/api/secteur/${sector.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            "Une erreur est survenue lors de la mise à jour du secteur"
        );
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Secteur mis à jour avec succès !", { id: toastId });
      onSuccess();
      onClose();
      router.refresh();
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);

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

  const handleClose = () => {
    if (!isSubmitting && !isCompressing) {
      // Nettoyer l'aperçu de l'image si une nouvelle a été sélectionnée
      if (image && imagePreview && imagePreview !== sector.image) {
        URL.revokeObjectURL(imagePreview);
      }
      setName(sector.name);
      setImage(null);
      setImagePreview(sector.image);
      setUploadProgress(0);
      setShouldRemoveImage(false);
      setIsCompressing(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Modifier le secteur
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1"
            >
              Nom du secteur *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cuisine, Salle de bain..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Image du secteur
            </label>
            <div className="mt-2 flex items-start space-x-4">
              <div className="flex-shrink-0">
                {imagePreview && !shouldRemoveImage ? (
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
                      className="absolute top-2 right-2 p-1 bg-[color:var(--destructive)] text-[color:var(--destructive-foreground)] rounded-full hover:bg-[color:var(--destructive)]/90 transition-colors"
                      disabled={isSubmitting}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ) : shouldRemoveImage ? (
                  <div className="w-48 h-48 border-2 border-dashed border-[color:var(--destructive)] rounded-lg bg-[color:var(--destructive)]/5 flex flex-col items-center justify-center">
                    <Trash className="w-10 h-10 text-[color:var(--destructive)] mb-2" />
                    <p className="text-sm text-[color:var(--destructive)] text-center px-4">
                      L&apos;image sera supprimée
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShouldRemoveImage(false);
                        setImagePreview(sector.image);
                      }}
                      className="mt-2 text-xs text-[color:var(--primary)] hover:underline"
                      disabled={isSubmitting}
                    >
                      Annuler la suppression
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-[color:var(--border)] rounded-lg cursor-pointer bg-[color:var(--muted)] hover:bg-[color:var(--muted)]/80 transition-colors ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 text-[color:var(--muted-foreground)]" />
                      <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
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
                      disabled={isSubmitting || isCompressing}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  L&apos;image doit être au format JPG, PNG, GIF ou WebP. Les
                  images volumineuses seront automatiquement compressées pour
                  optimiser l&apos;upload.
                  {shouldRemoveImage
                    ? " L'image actuelle sera supprimée lors de la sauvegarde."
                    : image
                      ? " Une nouvelle image remplacera l'actuelle."
                      : " Laissez vide pour conserver l'image actuelle."}
                </p>

                {isCompressing && (
                  <div className="mt-3 p-3 bg-[color:var(--muted)] rounded-md">
                    <p className="text-sm text-[color:var(--foreground)] mb-2">
                      Compression de l&apos;image en cours...
                    </p>
                    <div className="w-full bg-[color:var(--border)] rounded-full h-2">
                      <div className="bg-[color:var(--primary)] h-2 rounded-full transition-all duration-300 animate-pulse w-1/2"></div>
                    </div>
                  </div>
                )}

                {isSubmitting && (
                  <div className="mt-4">
                    <p className="text-sm text-[color:var(--muted-foreground)] mb-1">
                      Mise à jour en cours...
                    </p>
                    <div className="w-full bg-[color:var(--muted)] rounded-full h-2">
                      <div
                        className="bg-[color:var(--primary)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[color:var(--border)]">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                <>
                  <Edit size={16} className="mr-2" />
                  Mettre à jour
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
