"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeleteUserButton({
  userId,
  userName,
  isCurrentUser,
}: {
  userId: string;
  userName: string;
  isCurrentUser: boolean;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Une erreur est survenue lors de la suppression"
        );
      }

      toast.success(`L'utilisateur a été supprimé avec succès.`);

      // Si l'utilisateur se supprime lui-même, redirigez vers la déconnexion
      if (isCurrentUser) {
        router.push("/signout");
      } else {
        router.push("/profile/edit");
      }
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
      setShowConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="border rounded-md p-4 bg-red-50">
        <p className="mb-4 font-medium">
          Êtes-vous sûr de vouloir supprimer {userName} ?
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
            onClick={() => setShowConfirmation(false)}
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
      onClick={() => setShowConfirmation(true)}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
    >
      Supprimer l&apos;utilisateur
    </button>
  );
}
