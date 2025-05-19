"use client";

import { useState, useRef, memo, useEffect } from "react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

// Utilisez next/dynamic pour l'image
import dynamic from "next/dynamic";
const Image = dynamic(() => import("next/image"), {
  loading: () => (
    <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
  ),
});

interface SignupImageUploadProps {
  onImageSelect: (file: File | null) => void;
}

function SignupImageUpload({ onImageSelect }: SignupImageUploadProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Déplacer la détection mobile dans useEffect pour éviter l'hydration mismatch
  useEffect(() => {
    setIsMobile(
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    );
  }, []);

  // Fonction optimisée pour ouvrir le sélecteur de fichier
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      if (isMobile) {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  // Version optimisée pour la sélection de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Utiliser un seul if avec conditions combinées pour réduire le branching
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error(
        !file.type.startsWith("image/")
          ? "Veuillez sélectionner une image valide"
          : "L'image ne doit pas dépasser 5MB"
      );
      e.target.value = "";
      return;
    }

    // Créer une URL pour la prévisualisation
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setShowControls(true);
    onImageSelect(file);

    // Nettoyage
    e.target.value = "";
  };

  // Fonction optimisée pour annuler la sélection
  const handleCancel = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
    setShowControls(false);
    onImageSelect(null);
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="relative group">
        <button
          type="button"
          onClick={handleAvatarClick}
          className="w-24 h-24 rounded-full overflow-hidden bg-[color:var(--muted)] flex items-center justify-center text-2xl text-[color:var(--muted-foreground)] font-bold border-2 border-[color:var(--border)] group-hover:border-[color:var(--primary)] cursor-pointer relative p-0 m-0"
          style={{ appearance: "none" }}
        >
          {previewImage ? (
            <Image
              src={previewImage}
              alt="Prévisualisation"
              fill
              className="object-cover"
            />
          ) : (
            <span>?</span>
          )}

          {!showControls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
          )}
        </button>
      </div>

      {showControls && (
        <div className="mt-2 flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleCancel}
            type="button"
          >
            <X size={14} />
            <span>Annuler</span>
          </Button>
        </div>
      )}

      <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
        Ajouter une photo de profil (optionnel)
      </p>
    </div>
  );
}

// Mémoriser le composant pour éviter les rendus inutiles
export default memo(SignupImageUpload);
