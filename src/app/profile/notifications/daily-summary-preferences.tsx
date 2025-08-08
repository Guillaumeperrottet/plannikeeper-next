// src/app/profile/notifications/daily-summary-preferences.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import Switch from "@/app/components/ui/switch";
import { Calendar, CalendarX } from "lucide-react";

interface DailySummaryPreferencesProps {
  initialEnabled: boolean;
}

export function DailySummaryPreferences({
  initialEnabled,
}: DailySummaryPreferencesProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const newState = !enabled;

      const response = await fetch("/api/profile/daily-summary-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailySummaryEnabled: newState,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des préférences");
      }

      setEnabled(newState);
      toast.success(
        newState
          ? "Les récapitulatifs quotidiens ont été activés"
          : "Les récapitulatifs quotidiens ont été désactivés"
      );
    } catch (error) {
      console.error("Erreur complète:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Calendar className="h-5 w-5 text-[color:var(--primary)]" />
          ) : (
            <CalendarX className="h-5 w-5 text-[color:var(--muted-foreground)]" />
          )}
          <div>
            <p className="font-medium text-[color:var(--foreground)]">
              Récapitulatif quotidien
            </p>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {enabled
                ? "Bulletin quotidien de l'activité de toute l'équipe"
                : "Pas de rapport quotidien d'activité"}
            </p>
          </div>
        </div>
        <div className="relative">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
            checkedIcon={
              <Calendar className="h-4 w-4 text-[color:var(--primary-foreground)]" />
            }
            uncheckedIcon={
              <CalendarX className="h-4 w-4 text-[color:var(--muted-foreground)]" />
            }
          />
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-[color:var(--muted)] text-sm">
        <h3 className="font-medium mb-2 text-[color:var(--foreground)]">
          📊 Ce que vous recevez
        </h3>
        <p className="text-[color:var(--muted-foreground)] mb-2">
          <strong>Bulletin d&apos;activité global :</strong> Un rapport
          quotidien de tout ce qui s&apos;est passé dans votre organisation.
        </p>
        <ul className="space-y-2 list-disc pl-5 text-[color:var(--muted-foreground)]">
          <li>📧 Envoyé vers 7h du matin</li>
          <li>📈 Toutes les tâches créées par tout le monde</li>
          <li>✅ Toutes les tâches terminées par l&apos;équipe</li>
          <li>📋 Un rappel de vos tâches en cours à vous</li>
          <li>🏢 Organisé par objet et secteur pour une vue claire</li>
          <li>📬 Envoyé même s&apos;il n&apos;y a eu aucune activité</li>
        </ul>

        <div className="mt-3 space-y-2">
          <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded border-l-4 border-green-400">
            <p className="text-xs text-green-700 dark:text-green-300">
              💡 <strong>Parfait si :</strong> Vous supervisez une équipe et
              voulez suivre l&apos;avancement général
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
