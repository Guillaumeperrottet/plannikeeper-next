"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeleteObjetButtonProps {
  objetId: string;
  objetNom: string;
}

export default function DeleteObjetButton({
  objetId,
  objetNom,
}: DeleteObjetButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/objet/${objetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "Une erreur est survenue lors de la suppression"
        );
      }

      toast.success("L'objet a été supprimé avec succès");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isConfirmOpen) {
    return (
      <div className="border rounded-md p-4 bg-red-50">
        <p className="mb-3 font-medium text-red-800">
          Êtes-vous sûr de vouloir supprimer{" "}
          <span className="font-bold">{objetNom}</span> ?
        </p>
        <p className="mb-4 text-sm text-red-700">
          Cette action est irréversible et supprimera définitivement toutes les
          données associées à cet objet.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Suppression..." : "Confirmer la suppression"}
          </button>
          <button
            onClick={() => setIsConfirmOpen(false)}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirmOpen(true)}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
    >
      <Trash2 size={18} />
      <span>Supprimer cet objet</span>
    </button>
  );
}
