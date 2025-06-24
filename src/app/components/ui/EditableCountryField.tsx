"use client";

import React, { useState } from "react";
import { toast } from "sonner";

interface EditableCountryFieldProps {
  initialValue: string;
  objectId: string;
  onSave?: (newValue: string) => void;
}

// Liste des pays les plus courants
const COUNTRIES = [
  "France",
  "Belgique",
  "Suisse",
  "Luxembourg",
  "Canada",
  "Allemagne",
  "Espagne",
  "Italie",
  "Portugal",
  "Pays-Bas",
  "Royaume-Uni",
  "États-Unis",
  "Autre",
] as const;

export default function EditableCountryField({
  initialValue,
  objectId,
  onSave,
}: EditableCountryFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (selectedCountry === initialValue) {
      setIsEditing(false);
      return;
    }

    if (!selectedCountry.trim()) {
      toast.error("Le pays ne peut pas être vide");
      setSelectedCountry(initialValue);
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`/api/objet/${objectId}/edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pays: selectedCountry,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      toast.success("Pays mis à jour avec succès");
      setIsEditing(false);
      onSave?.(selectedCountry);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour du pays");
      setSelectedCountry(initialValue);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedCountry(initialValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--background)] text-[color:var(--foreground)] disabled:opacity-50"
        >
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded hover:bg-[color:var(--primary)]/90 disabled:opacity-50"
          >
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-3 py-1 text-sm border border-[color:var(--border)] rounded hover:bg-[color:var(--muted)] disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="px-3 py-2 border border-[color:var(--border)] rounded-md hover:bg-[color:var(--muted)] cursor-pointer transition-colors"
    >
      <span className="text-[color:var(--foreground)]">{selectedCountry}</span>
    </div>
  );
}
