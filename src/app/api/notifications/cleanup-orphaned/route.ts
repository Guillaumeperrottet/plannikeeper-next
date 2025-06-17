import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer toutes les notifications de l'utilisateur
    const notificationsWithTasks = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
    });

    const orphanedNotifications: string[] = [];

    // Vérifier chaque notification pour voir si la tâche existe encore
    for (const notification of notificationsWithTasks) {
      const data = notification.data as { taskId?: string } | null;
      const taskId = data?.taskId;

      if (taskId) {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { id: true },
        });

        if (!task) {
          orphanedNotifications.push(notification.id);
        }
      }
    }

    // Supprimer les notifications orphelines
    if (orphanedNotifications.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: { in: orphanedNotifications },
          userId: user.id, // Sécurité supplémentaire
        },
      });
    }

    return NextResponse.json({
      success: true,
      cleaned: orphanedNotifications.length,
      message: `${orphanedNotifications.length} notification(s) obsolète(s) supprimée(s)`,
    });
  } catch (error) {
    console.error("Error cleaning orphaned notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors du nettoyage des notifications" },
      { status: 500 }
    );
  }
}
