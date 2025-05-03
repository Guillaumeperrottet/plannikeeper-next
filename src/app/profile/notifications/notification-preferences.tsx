"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Switch from "@/app/components/ui/switch";
import { Bell, BellOff, RefreshCw } from "lucide-react";
import { useNotifications } from "@/app/components/notification-provider";
import { Button } from "@/app/components/ui/button";

interface NotificationPreferencesProps {
  initialEnabled: boolean;
}

export function NotificationPreferences({
  initialEnabled,
}: NotificationPreferencesProps) {
  const { hasPermission, requestPermission } = useNotifications();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  // Vérifie si un token d'appareil existe
  useEffect(() => {
    const checkDeviceToken = async () => {
      try {
        // Vérification de la présence d'un token dans localStorage
        const storedToken = localStorage.getItem("fcmToken");
        if (storedToken) {
          setDeviceToken(storedToken);
          console.log("Token trouvé en local:", storedToken);
        } else {
          console.log("Aucun token FCM trouvé en local");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
      }
    };

    checkDeviceToken();
  }, []);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const newState = !enabled;

      // Si on active les notifications
      if (newState) {
        console.log(
          "Demande d'activation des notifications, statut permission:",
          hasPermission
        );

        // Demander la permission pour les notifications push (qu'on ait déjà la permission ou non)
        // Cette étape va générer un nouveau token
        console.log("Demande de permission pour les notifications...");
        const granted = await requestPermission();

        console.log("Réponse de la demande de permission:", granted);

        if (!granted) {
          // Si la permission n'est pas accordée, ne pas activer les notifications
          toast.error(
            "Les notifications ne peuvent pas être activées sans votre permission"
          );
          setLoading(false);
          return;
        }

        // Vérification du nouveau token après la demande de permission
        const storedToken = localStorage.getItem("fcmToken");
        setDeviceToken(storedToken);
        console.log("Nouveau token après demande de permission:", storedToken);
      }

      // Mise à jour de la préférence utilisateur dans la base de données
      console.log("Mise à jour de la préférence utilisateur:", newState);
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationsEnabled: newState,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des préférences");
      }

      setEnabled(newState);
      toast.success(
        newState
          ? "Les notifications ont été activées"
          : "Les notifications ont été désactivées"
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

  // Fonction pour forcer le rafraichissement du token
  const forceRefreshToken = async () => {
    try {
      setLoading(true);
      console.log("Demande de rafraîchissement du token...");

      // Force une nouvelle demande de token
      const newToken = await requestPermission();
      console.log("Résultat du rafraîchissement:", newToken);

      // Mettre à jour l'état local
      const storedToken = localStorage.getItem("fcmToken");
      setDeviceToken(storedToken);

      if (newToken) {
        toast.success("Le token a été rafraîchi avec succès");
      } else {
        toast.error("Impossible de rafraîchir le token");
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      toast.error("Erreur lors du rafraîchissement du token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Bell className="h-5 w-5 text-[color:var(--primary)]" />
          ) : (
            <BellOff className="h-5 w-5 text-[color:var(--muted-foreground)]" />
          )}
          <div>
            <p className="font-medium">Notifications</p>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {enabled
                ? "Vous recevez des notifications"
                : "Vous ne recevez pas de notifications"}
            </p>
          </div>
        </div>
        <div className="relative">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
            checkedIcon={<Bell className="h-4 w-4 text-blue-800" />}
            uncheckedIcon={<BellOff className="h-4 w-4 text-gray-500" />}
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {/* Statut du token */}
        <div
          className={`p-4 rounded-lg ${deviceToken ? "bg-[color:var(--success-background)]" : "bg-[color:var(--warning-background)]"} text-sm mb-4`}
        >
          <h3 className="font-medium mb-2">Statut du token d&apos;appareil</h3>
          <p className="mb-2">
            {deviceToken
              ? "Un token d'appareil est enregistré pour ce navigateur."
              : "Aucun token d'appareil n'est enregistré pour ce navigateur."}
          </p>
          {deviceToken && (
            <div className="mt-2 overflow-x-auto">
              <p className="text-xs font-mono break-all bg-black/10 p-2 rounded">
                {deviceToken.substring(0, 20)}...
                {deviceToken.substring(deviceToken.length - 20)}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3 flex items-center gap-1"
            onClick={forceRefreshToken}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Rafraîchir le token
          </Button>
        </div>

        {hasPermission === false && (
          <div className="p-4 rounded-lg bg-[color:var(--destructive-background)] text-sm mb-4">
            <h3 className="font-medium mb-2 text-[color:var(--destructive-foreground)]">
              Permissions de notification bloquées
            </h3>
            <p className="text-[color:var(--destructive-foreground)] mb-2">
              Vous avez bloqué les notifications pour ce site. Pour les
              recevoir, vous devez modifier les paramètres de votre navigateur.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                window.open(
                  "https://support.google.com/chrome/answer/3220216?hl=fr",
                  "_blank"
                );
              }}
            >
              Comment activer les notifications
            </Button>
          </div>
        )}

        <div className="p-4 rounded-lg bg-[color:var(--muted)] text-sm">
          <h3 className="font-medium mb-2">À propos des notifications</h3>
          <p className="text-[color:var(--muted-foreground)] mb-2">
            Les notifications vous informent des événements importants comme :
          </p>
          <ul className="space-y-2 list-disc pl-5 text-[color:var(--muted-foreground)]">
            <li>Lorsque vous êtes assigné à une tâche</li>
            <li>Lorsqu&apos;une tâche est terminée</li>
            <li>Lorsque quelqu&apos;un commente une tâche que vous suivez</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
