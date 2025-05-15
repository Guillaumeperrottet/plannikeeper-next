"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface SignupImageUploadProps {
  onImageSelect: (file: File | null) => void;
}

export default function SignupImageUpload({
  onImageSelect,
}: SignupImageUploadProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si l'appareil est mobile (simplifié pour le signup)
  useState(() => {
    if (typeof window !== "undefined") {
      setIsMobile(
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          (!!navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
      );
    }
  });

  // Fonction pour ouvrir le sélecteur de fichier
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (fileInputRef.current) {
      if (isMobile) {
        fileInputRef.current.removeAttribute("capture");
      }
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 10);
    }
  };

  // Gestion de la sélection d'une image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image valide");
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    // Créer une URL pour la prévisualisation
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    setShowControls(true);
    onImageSelect(file);

    // Nettoyage de l'input pour permettre de sélectionner à nouveau le même fichier
    e.target.value = "";
  };

  // Fonction pour annuler la sélection
  const handleCancel = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
    setShowControls(false);
    onImageSelect(null);
  };

  // Détermine les initiales pour l'avatar par défaut
  const getInitials = () => {
    return "?";
  };

  return (
    <div className="flex flex-col items-center mb-4">
      {/* Input file caché */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Avatar avec image ou initiales */}
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
            <span>{getInitials()}</span>
          )}

          {/* Overlay intégré dans le bouton */}
          {!showControls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Boutons de contrôle uniquement quand une image est sélectionnée */}
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
