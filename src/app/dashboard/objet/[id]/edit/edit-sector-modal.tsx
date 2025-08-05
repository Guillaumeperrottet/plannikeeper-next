"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash,
  Loader2,
  Edit,
  MoreVertical,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Réinitialiser les états quand la modal s'ouvre ou que les données du secteur changent
  useEffect(() => {
    if (isOpen) {
      setName(sector.name);
      setImage(null);
      setImagePreview(sector.image);
      setUploadProgress(0);
      setShouldRemoveImage(false);
      setIsCompressing(false);
      setShowConfirmDialog(false);
    }
  }, [isOpen, sector.name, sector.image]);

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

  // Fonction pour déclencher l'ouverture du sélecteur de fichier
  const triggerFileSelector = () => {
    const fileInput = document.getElementById(
      "image-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Fonction pour gérer la suppression directe de l'image
  const handleRemoveImage = () => {
    setShouldRemoveImage(true);
    setImagePreview(null);
    setImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom du secteur est requis");
      return;
    }

    // Vérifier si on remplace ou supprime une image existante
    const isChangingImage =
      (image && sector.image) || (shouldRemoveImage && sector.image);

    if (isChangingImage) {
      // Montrer la confirmation si on modifie l'image
      setShowConfirmDialog(true);
    } else {
      // Procéder directement si pas de changement d'image critique
      await performUpdate();
    }
  };

  const performUpdate = async () => {
    setShowConfirmDialog(false); // Fermer la dialog de confirmation
    setIsSubmitting(true);
    setUploadProgress(0);

    // Simuler une progression d'upload pour une meilleure UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 95);
      });
    }, 300);

    // Message de chargement personnalisé selon l'action
    let loadingMessage = "Mise à jour du secteur en cours...";
    if (shouldRemoveImage) {
      loadingMessage = "Suppression de l'image en cours...";
    } else if (image) {
      loadingMessage = sector.image
        ? "Remplacement de l'image en cours..."
        : "Ajout de l'image en cours...";
    }

    const toastId = toast.loading(loadingMessage);

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

      // Message de succès personnalisé selon l'action
      let successMessage = "Secteur mis à jour avec succès !";
      if (shouldRemoveImage) {
        successMessage = "Secteur mis à jour et image supprimée !";
      } else if (image) {
        successMessage = sector.image
          ? "Secteur mis à jour et image remplacée !"
          : "Secteur mis à jour et image ajoutée !";
      }

      toast.success(successMessage, { id: toastId });
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
      setShowConfirmDialog(false);
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
                  <div className="relative w-48 h-48 border rounded-lg overflow-hidden group">
                    <Image
                      src={imagePreview}
                      alt="Aperçu de l'image"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isSubmitting}
                          >
                            <MoreVertical size={14} className="text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={triggerFileSelector}
                            className="cursor-pointer"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Remplacer l&apos;image
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleRemoveImage}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer l&apos;image
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ) : shouldRemoveImage ? (
                  <div className="w-48 h-48 border border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center p-4">
                    <Trash className="w-6 h-6 text-gray-500 mb-3" />
                    <p className="text-sm text-gray-700 text-center mb-4">
                      Image supprimée
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerFileSelector}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Choisir une image
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShouldRemoveImage(false);
                          setImagePreview(sector.image);
                        }}
                        disabled={isSubmitting}
                        className="w-full text-xs"
                      >
                        Annuler
                      </Button>
                    </div>
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

                {/* Input file toujours présent mais caché */}
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

      {/* Dialog de confirmation pour le changement d'image */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la modification de l&apos;image</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                {shouldRemoveImage
                  ? "Vous êtes sur le point de supprimer l'image de ce secteur."
                  : "Vous êtes sur le point de remplacer l'image de ce secteur."}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  <strong>Important :</strong> Les articles positionnés sur
                  cette image continueront d&apos;exister, mais ils devront être
                  repositionnés correctement sur la nouvelle image ou après
                  suppression.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Cette action ne supprimera pas vos articles, mais leur
                positionnement devra être ajusté.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={performUpdate}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Continuer la modification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
