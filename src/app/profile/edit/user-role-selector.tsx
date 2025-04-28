"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Shield, User as UserIcon, Check, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

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

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en "${
          newRole === "admin" ? "Administrateur" : "Membre"
        }" ?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Une erreur est survenue");
      }

      toast.success(`Le rôle a été mis à jour avec succès.`);
      setRole(newRole);
      router.refresh();
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        variant={role === "admin" ? "default" : "outline"}
        disabled={isSubmitting || role === "admin"}
        onClick={() => handleRoleChange("admin")}
        className="flex items-center justify-center gap-2 py-2 relative"
      >
        {isSubmitting && role !== "admin" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Shield size={16} />
        )}
        <span>Administrateur</span>
        {role === "admin" && (
          <Check
            size={16}
            className="absolute right-2 text-[color:var(--primary-foreground)]"
          />
        )}
      </Button>

      <Button
        variant={role === "member" ? "default" : "outline"}
        disabled={isSubmitting || role === "member"}
        onClick={() => handleRoleChange("member")}
        className="flex items-center justify-center gap-2 py-2 relative"
      >
        {isSubmitting && role !== "member" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <UserIcon size={16} />
        )}
        <span>Membre</span>
        {role === "member" && (
          <Check
            size={16}
            className="absolute right-2 text-[color:var(--primary-foreground)]"
          />
        )}
      </Button>
    </div>
  );
}
