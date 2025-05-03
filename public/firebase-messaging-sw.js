// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js"
);

// Récupérer les variables d'environnement exposées
self.firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  storageBucket: self.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
};

// Initialiser Firebase
firebase.initializeApp(self.firebaseConfig);

// Récupérer une instance de Firebase Messaging
const messaging = firebase.messaging();

// Gestionnaire pour les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png", // Assurez-vous d'avoir cette icône dans votre dossier public
    badge: "/badge.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gestionnaire pour le clic sur une notification
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click:", event);
  event.notification.close();

  // Récupérer l'URL depuis les données de la notification ou utiliser l'URL par défaut
  const urlToOpen = event.notification.data?.link || "/dashboard";

  // Ouvrir l'URL
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // Vérifier si une fenêtre est déjà ouverte
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Si aucune fenêtre n'est ouverte, en ouvrir une nouvelle
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
