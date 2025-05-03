// src/app/test-notifications/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";

export default function TestNotifications() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    success: boolean;
    message: string;
  }>(null);

  const testVAPIDKey = () => {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    console.log("VAPID Key disponible:", !!vapidKey);
    console.log(
      "VAPID Key (premiers caractères):",
      vapidKey ? vapidKey.substring(0, 10) + "..." : "non définie"
    );

    // La clé VAPID doit commencer par 'B' pour être au format correct
    if (vapidKey && !vapidKey.startsWith("B")) {
      console.error("VAPID Key invalide: doit commencer par 'B'");
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: "Notification envoyée avec succès!",
        });
      } else {
        setResult({ success: false, message: data.error || "Erreur inconnue" });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Test des notifications</h1>

      <Button
        onClick={sendTestNotification}
        disabled={loading}
        className="w-full mb-4"
      >
        {loading ? "Envoi en cours..." : "Envoyer une notification de test"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          testVAPIDKey();
          console.log("Test d'environnement...");
          console.log("Mode:", process.env.NODE_ENV);
          console.log("Domaine:", window.location.origin);
        }}
      >
        Tester la configuration
      </Button>

      {result && (
        <div
          className={`p-4 rounded-md ${
            result.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded-md text-sm">
        <p className="font-medium mb-2">Instructions:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Assurez-vous d&apos;avoir activé les notifications dans votre profil
          </li>
          <li>Cliquez sur le bouton pour envoyer une notification de test</li>
          <li>Vérifiez que vous recevez la notification sur votre appareil</li>
          <li>
            Vérifiez la base de données pour confirmer l&apos;enregistrement
          </li>
        </ol>
      </div>
    </div>
  );
}
