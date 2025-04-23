"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function UserRoleSelector({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleRoleChange = async () => {
    if (role === currentRole) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Une erreur est survenue");
      }

      toast.success(`Le rôle a été mis à jour avec succès.`);
      router.refresh();
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
      setRole(currentRole); // Reset to original value on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="px-3 py-2 border rounded-md"
        disabled={isSubmitting}
      >
        <option value="admin">Administrateur</option>
        <option value="member">Membre</option>
      </select>

      {role !== currentRole && (
        <button
          onClick={handleRoleChange}
          disabled={isSubmitting}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      )}
    </div>
  );
}
