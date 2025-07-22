"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Trash, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  compressImage,
  validateImageFile,
  formatFileSize,
} from "@/lib/image-utils";

export default function NewSectorForm({ objetId }: { objetId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
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
        const preview = URL.createObjectURL(compressedFile);
        setImagePreview(preview);
      } catch (error) {
        console.error("Erreur lors de la compression:", error);
        toast.error("Erreur lors de la compression de l'image");
      } finally {
        setIsCompressing(false);
      }
    } else {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImage(null);
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
    setUploadProgress(0);

    // Simuler une progression d'upload pour une meilleure UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 95);
      });
    }, 300);

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

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Secteur créé avec succès !", { id: toastId });
      router.push(`/dashboard/objet/${objetId}/edit`);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Nom du secteur *</Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Cuisine, Salle de bain..."
          required
          disabled={isSubmitting}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium mb-1">
          Image du secteur *
        </Label>
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
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleImageChange(null)}
                  className="absolute top-2 right-2 p-1 h-8 w-8"
                  disabled={isSubmitting || isCompressing}
                >
                  <Trash size={16} />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="image-upload"
                className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors ${
                  isSubmitting || isCompressing
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
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
                  disabled={isSubmitting || isCompressing}
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              L&apos;image doit être au format JPG, PNG, GIF ou WebP. Les images
              volumineuses seront automatiquement compressées pour optimiser
              l&apos;upload. Choisissez une image qui représente bien le secteur
              pour faciliter son identification.
            </p>

            {isCompressing && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-sm text-foreground mb-2">
                  Compression de l&apos;image en cours...
                </p>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse w-1/2"></div>
                </div>
              </div>
            )}

            {isSubmitting && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Téléchargement en cours...
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" asChild>
          <Link
            href={`/dashboard/objet/${objetId}/edit`}
            aria-disabled={isSubmitting}
            tabIndex={isSubmitting ? -1 : undefined}
            onClick={(e) => isSubmitting && e.preventDefault()}
          >
            Annuler
          </Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Créer le secteur"
          )}
        </Button>
      </div>
    </form>
  );
}
