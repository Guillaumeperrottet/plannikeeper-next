// Vérifiez dans public/firebase-messaging-sw.js
// Ajoutez des logs détaillés
console.log("[firebase-messaging-sw.js] Script de service worker chargé");

importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"
);
console.log("[firebase-messaging-sw.js] Script firebase-app-compat.js chargé");

importScripts(
  "https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js"
);
console.log(
  "[firebase-messaging-sw.js] Script firebase-messaging-compat.js chargé"
);

// Récupérer les variables d'environnement exposées
self.firebaseConfig = {
  apiKey: "AIzaSyCLfw4jnCT-OD3wUjLKLZa4TaJf-4lngvA",
  authDomain: "plannikeeper-next.firebaseapp.com",
  databaseURL:
    "https://plannikeeper-next-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "plannikeeper-next",
  storageBucket: "plannikeeper-next.firebasestorage.app",
  messagingSenderId: "1037649122480",
  appId: "1:1037649122480:web:d66ab9101b7b5d61fb5775",
  measurementId: "G-291XG7LXT7",
};

console.log(
  "[firebase-messaging-sw.js] Configuration Firebase disponible:",
  !!self.firebaseConfig
);

// Initialiser Firebase
try {
  firebase.initializeApp(self.firebaseConfig);
  console.log("[firebase-messaging-sw.js] Firebase initialisé avec succès");

  // Récupérer une instance de Firebase Messaging
  const messaging = firebase.messaging();
  console.log("[firebase-messaging-sw.js] Instance de messaging créée");

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
} catch (error) {
  console.error(
    "[firebase-messaging-sw.js] Erreur lors de l'initialisation de Firebase:",
    error
  );
}

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

console.log("[firebase-messaging-sw.js] Service worker configuré avec succès");
