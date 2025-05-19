// src/app/layout.tsx (optimized version)
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
import ServiceWorkerRegistration from "./service-worker";
import { Suspense } from "react";

export const metadata = {
  title: {
    default: "PlanniKeeper - Gestion Immobilière Simplifiée",
    template: "%s | PlanniKeeper",
  },
  description:
    "PlanniKeeper est la solution tout-en-un pour la gestion de vos projets immobiliers. Organisez vos propriétés, planifiez vos tâches et maximisez votre efficacité.",
  keywords:
    "plannikeeper, planikeeper, gestion immobilière, logiciel immobilier, gestion de biens, gestion de propriétés",
  openGraph: {
    title: "PlanniKeeper - Gestion Immobilière Simplifiée",
    description: "Simplifiez la gestion de vos projets immobiliers",
    url: "https://plannikeeper.ch",
    siteName: "PlanniKeeper",
    images: [
      {
        url: "https://plannikeeper.ch/images/logo.png",
        width: 1200,
        height: 630,
        alt: "PlanniKeeper Dashboard",
      },
    ],
  },
};

// Add a loading fallback component for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

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

        {/* Preload critical resources */}
        <link rel="preload" href="/icons/favicon.ico" as="image" />
        <link rel="preconnect" href="https://res.cloudinary.com" />

        {/* Defer non-critical styles/scripts */}
        <link
          rel="preload"
          as="style"
          href="/_next/static/css/app/layout.css"
          onLoad={(e) =>
            ((e.currentTarget as HTMLLinkElement).rel = "stylesheet")
          }
        />

        {/* Favicon et icônes */}
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Google tag (gtag.js) - load with low priority */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-291XG7LXT7"
          strategy="afterInteractive"
          data-priority="low"
        />
        <Script id="gtag-init" strategy="afterInteractive" data-priority="low">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-291XG7LXT7');
          `}
        </Script>

        {/* Load essential scripts with higher priority */}
        <Script id="performance-optimization" strategy="beforeInteractive">
          {`
            // Critical performance optimizations
            (function() {
              // Mark the start time to measure TTI
              window.perfStartTime = performance.now();
              
              // Add class to indicate JS is available
              document.documentElement.classList.add('js-enabled');
              
              // Optimize rendering in lower priority
              if ('requestIdleCallback' in window) {
                requestIdleCallback(function() {
                  // Enhance perceived performance
                  document.documentElement.classList.add('render-optimized');
                });
              }
            })();
          `}
        </Script>

        <Analytics />
        <SpeedInsights />
        <ServiceWorkerRegistration />
      </head>
      <body className="bg-background" suppressHydrationWarning>
        {/* Use Suspense for improved loading experience */}
        <Suspense fallback={<LoadingFallback />}>
          <LoadingSystemProvider>
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
          </LoadingSystemProvider>
        </Suspense>
      </body>
    </html>
  );
}
