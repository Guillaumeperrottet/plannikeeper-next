import { toast } from "sonner";

export type ErrorAction =
  | "déplacement"
  | "redimensionnement"
  | "modification"
  | "suppression"
  | "création";

/**
 * Affiche un toast d'erreur avec un message contextuel
 */
export function showErrorToast(action: ErrorAction): void {
  toast.error(`Échec ${action === "modification" ? "de la" : "du"} ${action}`, {
    description: `Une erreur s'est produite lors ${action === "modification" ? "de la" : "du"} ${action} de l'article. Veuillez réessayer.`,
    duration: 4000,
  });
}

/**
 * Affiche un toast de succès
 */
export function showSuccessToast(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  });
}
