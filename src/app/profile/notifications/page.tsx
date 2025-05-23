// src/app/profile/notifications/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationsList } from "@/app/profile/notifications/notifications-list";
import { NotificationPreferences } from "@/app/profile/notifications/notification-preferences";
import { EmailPreferences } from "@/app/profile/email-preferences";

import { ArrowLeft } from "lucide-react";

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
    // Removed 'task' relation from include as it does not exist on the notification model
  });

  // Récupérer les préférences de notifications
  const userWithPrefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      notificationsEnabled: true,
      emailNotificationsEnabled: true,
    },
  });

  const notificationsEnabled = userWithPrefs?.notificationsEnabled ?? true;
  const emailNotificationsEnabled =
    userWithPrefs?.emailNotificationsEnabled ?? true;

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
    // Map the fields correctly
    type: n.category ?? "default",
    content: n.message,
    isRead: n.read,
    read: n.read, // Add this line to satisfy Notification type
  }));
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link
          href="/profile"
          className="flex items-center text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Retour au profil
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[color:var(--foreground)]">
          Notifications
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
                <h2 className="text-lg font-medium text-[color:var(--foreground)]">
                  Préférences
                </h2>
              </div>
              <div className="p-5">
                <NotificationPreferences
                  initialEnabled={notificationsEnabled}
                />
                <div className="mt-8 pt-8 border-t border-[color:var(--border)]">
                  <EmailPreferences
                    initialEnabled={emailNotificationsEnabled}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
                <h2 className="text-lg font-medium text-[color:var(--foreground)]">
                  Historique des notifications
                </h2>
              </div>
              <div className="p-1 sm:p-2">
                <NotificationsList notifications={mappedNotifications} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
