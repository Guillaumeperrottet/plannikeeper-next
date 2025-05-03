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
  if (!messaging) return null;

  try {
    // Demander la permission Notification au navigateur
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    // Obtenir le token FCM
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      // Enregistrer le token sur le serveur
      await registerDeviceToken(currentToken);
      return currentToken;
    } else {
      console.log("No registration token available");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token", error);
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
