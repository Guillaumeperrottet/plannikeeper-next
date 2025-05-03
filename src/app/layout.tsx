// src/app/layout.tsx (mise à jour)
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import { getUser } from "../lib/auth-session";
import "./globals.css";
import TodoListAgendaWrapper from "./components/TodoListAgendaWrapper";
import { prisma } from "@/lib/prisma";
import { NotificationProvider } from "./components/notification-provider";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Récupérer des informations supplémentaires comme le rôle si l'utilisateur est connecté
  let userWithRole = user;

  if (user) {
    // Obtenir le rôle de l'utilisateur
    const orgUser = await prisma.organizationUser.findFirst({
      where: { userId: user.id },
      select: { role: true },
    });

    // Ajouter le rôle aux informations de l'utilisateur
    userWithRole = {
      ...user,
      isAdmin: orgUser?.role === "admin",
      role: orgUser?.role,
    } as typeof user & { isAdmin: boolean; role?: string };
  }

  return (
    <html lang="en">
      <body className="bg-background" suppressHydrationWarning>
        {userWithRole ? (
          <NotificationProvider userId={userWithRole.id}>
            <Navbar user={userWithRole} />
            <div className="pb-16 md:pb-14">{children}</div>
            <TodoListAgendaWrapper />
          </NotificationProvider>
        ) : (
          <>{children}</>
        )}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

<script
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        // Charger la configuration Firebase
        fetch('/api/firebase-config')
          .then(response => response.json())
          .then(config => {
            // Exposer la configuration à self pour le service worker
            window.FIREBASE_API_KEY = config.apiKey;
            window.FIREBASE_AUTH_DOMAIN = config.authDomain;
            window.FIREBASE_PROJECT_ID = config.projectId;
            window.FIREBASE_STORAGE_BUCKET = config.storageBucket;
            window.FIREBASE_MESSAGING_SENDER_ID = config.messagingSenderId;
            window.FIREBASE_APP_ID = config.appId;

            // Enregistrer le service worker
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
              .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
              })
              .catch(err => {
                console.error('Service Worker registration failed:', err);
              });
          })
          .catch(err => {
            console.error('Failed to load Firebase config:', err);
          });
      }
    `,
  }}
/>;
