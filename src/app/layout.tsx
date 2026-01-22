import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import { getUser } from "../lib/auth-session";
import "./globals.css";
import TodoListAgendaWrapper from "./components/TodoListAgendaWrapper";
import { prisma } from "@/lib/prisma";
import { NotificationProvider } from "./components/notification-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { LoadingSystemProvider } from "./components/LoadingSystem";
import { SessionManager } from "./components/SessionManager";
import { InactivityManager } from "./components/InactivityManager";
import { FirstLoginDetector } from "./components/FirstLoginDetector";
import { GlobalTaskButton } from "./components/GlobalTaskButton";
import { MobileSpeedDial } from "./components/MobileSpeedDial";

export const metadata = {
  title: {
    default: "Plannikeeper - Gestion Immobilière Simplifiée",
    template: "%s | Plannikeeper",
  },
  description:
    "Plannikeeper est la solution tout-en-un pour la gestion de vos projets immobiliers. Organisez vos propriétés, planifiez vos tâches et maximisez votre efficacité.",
  keywords:
    "plannikeeper, planikeeper, gestion immobilière, logiciel immobilier, gestion de biens, gestion de propriétés",
  openGraph: {
    title: "Plannikeeper - Gestion Immobilière Simplifiée",
    description: "Simplifiez la gestion de vos projets immobiliers",
    url: "https://plannikeeper.ch",
    siteName: "Plannikeeper",
    images: [
      {
        url: "https://plannikeeper.ch/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Plannikeeper Dashboard",
      },
    ],
  },
};

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
    <html lang="fr" data-user-id={user?.id || ""}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d9840d" />
        <meta name="robots" content="index, follow" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Favicon et icônes */}
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-291XG7LXT7"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-291XG7LXT7');
  `}
        </Script>
        <Analytics />
        <SpeedInsights />
        {/* ServiceWorkerRegistration retiré pour désactiver le cache */}
      </head>
      <body className="bg-background" suppressHydrationWarning>
        {/* Wrapper pour les indicateurs de navigation et de chargement */}
        <LoadingSystemProvider>
          {userWithRole ? (
            <NotificationProvider userId={userWithRole.id}>
              {/* Gestionnaires de session pour déconnexion après fermeture et inactivité */}
              <SessionManager />
              <InactivityManager />
              {/* Détecteur de première connexion pour prompt PWA */}
              <FirstLoginDetector />
              <Navbar user={userWithRole} />
              <div className="pb-16 md:pb-14">{children}</div>
              <TodoListAgendaWrapper />

              {/* Speed Dial pour mobile - Regroupe Agenda + Création tâche */}
              <MobileSpeedDial />

              {/* Bouton flottant desktop uniquement - Création tâche */}
              <div className="hidden md:block">
                <GlobalTaskButton />
              </div>
            </NotificationProvider>
          ) : (
            <>{children}</>
          )}
          <Toaster position="top-center" richColors />
        </LoadingSystemProvider>
      </body>
    </html>
  );
}
