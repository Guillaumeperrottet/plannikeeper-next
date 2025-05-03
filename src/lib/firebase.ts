// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialiser Firebase
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialiser Firebase Cloud Messaging
let messaging: Messaging | null = null;

// Firebase Messaging n'est disponible que dans le navigateur
if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Messaging", error);
  }
}

// Fonction pour demander la permission et obtenir un token FCM
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  if (!messaging) {
    console.error("Messaging n'est pas initialisé");
    return null;
  }

  try {
    // Demander la permission Notification au navigateur
    console.log("Demande de permission de notification...");
    const permission = await Notification.requestPermission();
    console.log("Statut de permission reçu:", permission);

    if (permission !== "granted") {
      console.log("Permission de notification non accordée");
      return null;
    }

    // Vérifier que la clé VAPID est bien définie
    console.log(
      "VAPID key disponible:",
      !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    );

    try {
      // Obtenir le token FCM avec plus de détails sur l'erreur
      console.log("Tentative d'obtention du token FCM...");
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      }).catch((error) => {
        console.error("Erreur détaillée getToken:", error);
        throw error;
      });

      if (currentToken) {
        console.log("Token FCM obtenu:", currentToken);
        // Stocker le token localement
        localStorage.setItem("fcmToken", currentToken);

        // Enregistrer le token sur le serveur
        console.log("Enregistrement du token sur le serveur...");
        await registerDeviceToken(currentToken).catch((error) => {
          console.error(
            "Erreur lors de l'enregistrement du token sur le serveur:",
            error
          );
          throw error;
        });

        console.log("Token enregistré avec succès!");
        return currentToken;
      } else {
        console.log("Aucun token d'enregistrement disponible");
        return null;
      }
    } catch (error) {
      console.error("Erreur complète de getToken:", error);
      return null;
    }
  } catch (error) {
    console.error("Erreur complète de requestNotificationPermission:", error);
    return null;
  }
};

// Enregistrer le token sur le serveur
const registerDeviceToken = async (token: string) => {
  try {
    const response = await fetch("/api/notifications/register-device", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Failed to register device token");
    }
  } catch (error) {
    console.error("Error registering device token:", error);
  }
};

// Configurer les écouteurs pour les messages entrants
import type { MessagePayload } from "firebase/messaging";

export const setupMessageListeners = (
  callback: (payload: MessagePayload) => void
) => {
  if (!messaging) return;

  // Gestionnaire des messages au premier plan
  onMessage(messaging, (payload) => {
    console.log("Message received in the foreground:", payload);
    callback(payload);
  });
};

export { app, messaging };
