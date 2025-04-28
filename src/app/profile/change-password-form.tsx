"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation côté client
    if (newPassword.length < 8) {
      toast.error(
        "Le nouveau mot de passe doit contenir au moins 8 caractères"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Modification du mot de passe en cours...");

    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      toast.success("Votre mot de passe a été mis à jour avec succès", {
        id: toastId,
      });
      resetForm();
      setIsFormVisible(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification du mot de passe",
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFormVisible) {
    return (
      <Button
        onClick={() => setIsFormVisible(true)}
        variant="outline"
        className="mt-2"
      >
        Modifier mon mot de passe
      </Button>
    );
  }

  return (
    <div className="mt-4 p-4 border border-border rounded-lg bg-background">
      <h3 className="text-lg font-medium mb-4">Modifier mon mot de passe</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1"
            minLength={8}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Le mot de passe doit contenir au moins 8 caractères
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">
            Confirmer le nouveau mot de passe
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setIsFormVisible(false);
            }}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Modification en cours..."
              : "Modifier le mot de passe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
