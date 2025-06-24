"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import ObjectIcon from "./ObjectIcon";
import {
  Building,
  Tent,
  Car,
  Home,
  MapPin,
  Utensils,
  Bed,
  Waves,
  TreePine,
  Store,
  Warehouse,
  School,
  Hospital,
} from "lucide-react";

interface EditableIconFieldProps {
  initialValue: string | null;
  objectId: string;
  onSave?: (newValue: string) => void;
}

// Configuration des icônes disponibles
const AVAILABLE_ICONS = [
  { key: "building", icon: Building, label: "Bâtiment" },
  { key: "tent", icon: Tent, label: "Camping" },
  { key: "bed", icon: Bed, label: "Hôtellerie" },
  { key: "home", icon: Home, label: "Résidentiel" },
  { key: "utensils", icon: Utensils, label: "Restaurant" },
  { key: "store", icon: Store, label: "Commerce" },
  { key: "warehouse", icon: Warehouse, label: "Entrepôt" },
  { key: "car", icon: Car, label: "Automobile" },
  { key: "waves", icon: Waves, label: "Aquatique" },
  { key: "tree-pine", icon: TreePine, label: "Nature" },
  { key: "map-pin", icon: MapPin, label: "Lieu" },
  { key: "school", icon: School, label: "Éducation" },
  { key: "hospital", icon: Hospital, label: "Santé" },
] as const;

export default function EditableIconField({
  initialValue,
  objectId,
  onSave,
}: EditableIconFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(initialValue || "building");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (selectedIcon === initialValue) {
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
          icon: selectedIcon,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      toast.success("Icône mise à jour avec succès");
      setIsEditing(false);
      onSave?.(selectedIcon);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour de l'icône");
      setSelectedIcon(initialValue || "building");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedIcon(initialValue || "building");
    setIsEditing(false);
  };

  const handleIconSelect = (iconKey: string) => {
    setSelectedIcon(iconKey);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {AVAILABLE_ICONS.map((iconConfig) => {
            const IconComponent = iconConfig.icon;
            const isSelected = selectedIcon === iconConfig.key;

            return (
              <button
                key={iconConfig.key}
                type="button"
                onClick={() => handleIconSelect(iconConfig.key)}
                disabled={isLoading}
                className={`relative p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                  isSelected
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 shadow-md"
                    : "border-[color:var(--border)] hover:border-[color:var(--primary)]/50 hover:bg-[color:var(--muted)]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title={iconConfig.label}
              >
                <IconComponent
                  size={20}
                  className={`mx-auto ${
                    isSelected
                      ? "text-[color:var(--primary)]"
                      : "text-[color:var(--muted-foreground)]"
                  }`}
                />
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-[color:var(--primary)] rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>

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
      className="flex items-center gap-3 p-3 rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--muted)] cursor-pointer transition-colors group"
    >
      <ObjectIcon
        iconKey={selectedIcon}
        size={24}
        className="text-[color:var(--foreground)]"
      />
      <span className="text-sm text-[color:var(--muted-foreground)] group-hover:text-[color:var(--foreground)]">
        Cliquer pour modifier l&apos;icône
      </span>
    </div>
  );
}
