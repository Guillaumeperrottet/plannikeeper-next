import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationsList } from "@/app/profile/notifications/notifications-list";
import { NotificationPreferences } from "@/app/profile/notifications/notification-preferences";
import { EmailPreferences } from "@/app/profile/email-preferences";
import { DailySummaryPreferences } from "@/app/profile/notifications/daily-summary-preferences";

import { ArrowLeft, Bell, Settings, Sparkles, Zap } from "lucide-react";

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/signin");
  }

  // Récupérer les notifications récentes
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Récupérer les préférences de notifications
  const userWithPrefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      notificationsEnabled: true,
      emailNotificationsEnabled: true,
      dailySummaryEnabled: true,
    },
  });

  const notificationsEnabled = userWithPrefs?.notificationsEnabled ?? true;
  const emailNotificationsEnabled =
    userWithPrefs?.emailNotificationsEnabled ?? true;
  const dailySummaryEnabled = userWithPrefs?.dailySummaryEnabled ?? false;

  const mappedNotifications = notifications.map((n) => ({
    id: typeof n.id === "string" ? parseInt(n.id, 10) : n.id,
    createdAt:
      n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
    userId: n.userId,
    link: n.link,
    title: n.title,
    message: n.message,
    category: n.category,
    data: n.data,
    type: n.category ?? "default",
    content: n.message,
    isRead: n.read,
    read: n.read,
  }));

  const unreadCount = mappedNotifications.filter((n) => !n.read).length;
  const totalCount = mappedNotifications.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[color:var(--background)] via-[color:var(--muted)]/10 to-[color:var(--background)]">
      {/* Header avec effet glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[color:var(--primary)]/10 via-[color:var(--primary)]/5 to-transparent border-b border-[color:var(--border)]/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--primary)]/5 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[color:var(--primary)]/10 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/profile"
            className="group inline-flex items-center text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)] mb-6 transition-all duration-300"
          >
            <ArrowLeft
              size={16}
              className="mr-1 transition-transform group-hover:-translate-x-1"
            />
            Retour au profil
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--primary)]/60 rounded-2xl blur opacity-20"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--primary)]/80 rounded-2xl flex items-center justify-center shadow-lg">
                <Bell
                  size={28}
                  className="text-[color:var(--primary-foreground)]"
                />
              </div>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--foreground)] mb-2">
                Centre de notifications
              </h1>
              <p className="text-[color:var(--muted-foreground)] text-lg">
                Gérez vos préférences et consultez votre historique
              </p>

              {/* Stats cards mini */}
              <div className="flex items-center gap-4 mt-4">
                <div className="bg-[color:var(--card)]/80 backdrop-blur-sm border border-[color:var(--border)]/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[color:var(--primary)] rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-[color:var(--foreground)]">
                      {unreadCount} non lues
                    </span>
                  </div>
                </div>
                <div className="bg-[color:var(--card)]/80 backdrop-blur-sm border border-[color:var(--border)]/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    {totalCount} au total
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Section préférences - horizontale */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[color:var(--foreground)] mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[color:var(--primary)]/10">
              <Settings size={24} className="text-[color:var(--primary)]" />
            </div>
            Préférences de notifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Notifications générales */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--primary)]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-xl shadow-sm backdrop-blur-sm overflow-hidden h-full">
                <div className="p-4 border-b border-[color:var(--border)]/50 bg-gradient-to-r from-[color:var(--muted)]/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[color:var(--primary)]/10">
                      <Bell size={18} className="text-[color:var(--primary)]" />
                    </div>
                    <h3 className="font-semibold text-[color:var(--foreground)]">
                      Notifications
                    </h3>
                  </div>
                </div>
                <div className="p-5">
                  <NotificationPreferences
                    initialEnabled={notificationsEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Notifications email */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--primary)]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-xl shadow-sm backdrop-blur-sm overflow-hidden h-full">
                <div className="p-4 border-b border-[color:var(--border)]/50 bg-gradient-to-r from-[color:var(--muted)]/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[color:var(--primary)]/10">
                      <Zap size={18} className="text-[color:var(--primary)]" />
                    </div>
                    <h3 className="font-semibold text-[color:var(--foreground)]">
                      Emails
                    </h3>
                  </div>
                </div>
                <div className="p-5">
                  <EmailPreferences
                    initialEnabled={emailNotificationsEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Récapitulatifs quotidiens */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--primary)]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-xl shadow-sm backdrop-blur-sm overflow-hidden h-full">
                <div className="p-4 border-b border-[color:var(--border)]/50 bg-gradient-to-r from-[color:var(--muted)]/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[color:var(--primary)]/10">
                      <Sparkles
                        size={18}
                        className="text-[color:var(--primary)]"
                      />
                    </div>
                    <h3 className="font-semibold text-[color:var(--foreground)]">
                      Récapitulatifs
                    </h3>
                  </div>
                </div>
                <div className="p-5">
                  <DailySummaryPreferences
                    initialEnabled={dailySummaryEnabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats compactes */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--primary)]">
                {unreadCount}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Non lues
              </div>
            </div>
            <div className="bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--foreground)]">
                {totalCount}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Total
              </div>
            </div>
            <div className="bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--foreground)]">
                {totalCount > 0
                  ? Math.round(((totalCount - unreadCount) / totalCount) * 100)
                  : 0}
                %
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Lues
              </div>
            </div>
            <div className="bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--primary)]">
                {Math.min(unreadCount + 3, totalCount)}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Semaine
              </div>
            </div>
            <div className="bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--foreground)]">
                {totalCount}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Mois
              </div>
            </div>
            <div className="bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-[color:var(--primary)]">
                {notificationsEnabled &&
                emailNotificationsEnabled &&
                dailySummaryEnabled
                  ? "🔔"
                  : "🔕"}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                État
              </div>
            </div>
          </div>
        </div>

        {/* Section historique - pleine largeur */}
        <div className="mb-8">
          {/* Main content area */}
          <div>
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--primary)]/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-[color:var(--card)] to-[color:var(--card)]/95 border border-[color:var(--border)] rounded-xl shadow-sm backdrop-blur-sm overflow-hidden min-h-[600px]">
                <div className="p-4 sm:p-6 border-b border-[color:var(--border)]/50 bg-gradient-to-r from-[color:var(--muted)]/30 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[color:var(--primary)]/10">
                        <Bell
                          size={20}
                          className="text-[color:var(--primary)]"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                          Historique des notifications
                        </h2>
                        <p className="text-sm text-[color:var(--muted-foreground)]">
                          Vos {totalCount} dernières notifications
                        </p>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--primary)]/80 text-[color:var(--primary-foreground)] rounded-full text-sm font-medium shadow-lg">
                        <div className="w-2 h-2 bg-[color:var(--primary-foreground)] rounded-full animate-pulse"></div>
                        {unreadCount} nouvelles
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  {/* Effet de gradient pour le scroll */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[color:var(--card)] to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[color:var(--card)] to-transparent z-10 pointer-events-none"></div>

                  <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                    <NotificationsList notifications={mappedNotifications} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
