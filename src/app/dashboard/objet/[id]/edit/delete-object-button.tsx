"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";

export default function DeleteObjectButton({
  objetId,
  objetName,
}: {
  objetId: string;
  objetName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Suppression en cours...");

    try {
      const response = await fetch(`/api/objet/${objetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Une erreur est survenue");
      }

      toast.success("Objet supprimé avec succès", { id: toastId });
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`,
        { id: toastId }
      );
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isOpen) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <p className="mb-4 font-medium">
            Êtes-vous sûr de vouloir supprimer l&apos;objet &quot;{objetName}
            &quot; ? Cette action est irréversible et supprimera tous les
            secteurs associés.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
            >
              {isDeleting ? "Suppression..." : "Confirmer la suppression"}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
              variant="outline"
              size="sm"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      onClick={() => setIsOpen(true)}
      variant="destructive"
      size="sm"
      className="gap-2"
    >
      <Trash size={16} />
      <span>Supprimer cet objet</span>
    </Button>
  );
}
