"use client";

import { useState } from "react";
import { Archive, Loader2, ChevronDown, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface ArchiveCompletedButtonProps {
  completedTasks: { id: string }[];
  onArchiveCompleted: () => void;
}

export default function ArchiveCompletedButton({
  completedTasks,
  onArchiveCompleted,
}: ArchiveCompletedButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleArchiveCompleted = async () => {
    // Vérifier s'il y a des tâches à archiver
    if (completedTasks.length === 0) {
      toast.info("Aucune tâche terminée à archiver");
      return;
    }

    // Demander confirmation
    if (
      !confirm(
        `Archiver ${completedTasks.length} tâche(s) terminée(s) ? Ces tâches seront déplacées vers les archives.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Archiver toutes les tâches terminées en parallèle
      const promises = completedTasks.map((task) =>
        fetch(`/api/tasks/${task.id}/archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archive: true }),
        })
      );

      // Attendre que toutes les requêtes soient terminées
      const results = await Promise.allSettled(promises);

      // Compter les succès et les échecs
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        toast.warning(`${succeeded} tâche(s) archivée(s), ${failed} échec(s)`);
      } else {
        toast.success(`${succeeded} tâche(s) archivée(s) avec succès`);
      }

      // Rafraîchir la liste des tâches
      onArchiveCompleted();
    } catch (error) {
      console.error("Erreur lors de l'archivage des tâches:", error);
      toast.error("Erreur lors de l'archivage des tâches");
    } finally {
      setLoading(false);
    }
  };

  const handleViewArchives = () => {
    router.push("/dashboard/archives");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          Archives
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleArchiveCompleted}
          disabled={loading || completedTasks.length === 0}
        >
          <Archive className="w-4 h-4 mr-2" />
          Archiver toutes les terminées
          {completedTasks.length > 0 && (
            <span className="ml-auto text-xs text-gray-500">
              ({completedTasks.length})
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewArchives}>
          <ArchiveRestore className="w-4 h-4 mr-2" />
          Voir les archives
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
