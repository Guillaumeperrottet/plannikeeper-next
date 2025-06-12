"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";

interface DeleteSectorButtonProps {
  sectorId: string;
  sectorName: string;
  className?: string;
}

export default function DeleteSectorButton({
  sectorId,
  sectorName,
  className = "",
}: DeleteSectorButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Suppression du secteur en cours...");

    try {
      const response = await fetch(`/api/secteur/${sectorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            "Une erreur est survenue lors de la suppression du secteur"
        );
      }

      toast.success("Secteur supprimé avec succès !", { id: toastId });
      setShowConfirm(false);
      router.refresh();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`,
        { id: toastId }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openConfirmDialog = () => {
    setShowConfirm(true);
  };

  const closeConfirmDialog = () => {
    if (!isDeleting) {
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={openConfirmDialog}
        className={`flex items-center gap-2 ${className}`}
        disabled={isDeleting}
      >
        <Trash2 size={16} />
        <span>Supprimer</span>
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[color:var(--background)] rounded-lg border border-[color:var(--border)] p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[color:var(--destructive)]/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[color:var(--destructive)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                  Supprimer le secteur
                </h3>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Cette action est irréversible
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[color:var(--foreground)]">
                Êtes-vous sûr de vouloir supprimer le secteur{" "}
                <span className="font-semibold">
                  &ldquo;{sectorName}&rdquo;
                </span>{" "}
                ?
              </p>
              <div className="mt-3 p-3 bg-[color:var(--destructive)]/5 border border-[color:var(--destructive)]/20 rounded-md">
                <p className="text-sm text-[color:var(--destructive)]">
                  <strong>Attention :</strong> Cette action supprimera
                  définitivement :
                </p>
                <ul className="text-sm text-[color:var(--destructive)] mt-2 ml-4 list-disc">
                  <li>Le secteur et son image</li>
                  <li>Tous les articles du secteur</li>
                  <li>Toutes les tâches associées</li>
                  <li>Tous les documents et commentaires</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeConfirmDialog}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
