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
    // S'assurer que le service worker est prêt
    console.log("Attente du service worker...");
    const registration = await navigator.serviceWorker.ready;
    console.log("Service Worker prêt:", registration);

    // Demander la permission
    console.log("Demande de permission de notification...");
    const permission = await Notification.requestPermission();
    console.log("Statut de permission reçu:", permission);

    if (permission !== "granted") {
      console.log("Permission de notification non accordée");
      return null;
    }

    // Vérifier explicitement la clé VAPID
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    console.log("VAPID key disponible:", !!vapidKey);
    console.log("VAPID key format check:", vapidKey?.substring(0, 3));

    try {
      // Obtenir le token avec le service worker existant
      console.log(
        "Tentative d'obtention du token FCM avec service worker spécifié..."
      );
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        console.log("Token FCM obtenu:", currentToken);
        localStorage.setItem("fcmToken", currentToken);
        await registerDeviceToken(currentToken);
        return currentToken;
      } else {
        console.error("Aucun token généré malgré une exécution réussie");
        return null;
      }
    } catch (error) {
      console.error("Erreur détaillée getToken:", error);
      return null;
    }
  } catch (error) {
    console.error("Erreur globale:", error);
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
