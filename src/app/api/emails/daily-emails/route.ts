// src/app/api/emails/daily-tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailService, TaskWithDetails } from "@/lib/email";

export async function POST(req: NextRequest) {
  console.log("Email API endpoint called");
  try {
    // Vérifier le secret d'API pour sécuriser cet endpoint
    const apiSecret = req.headers.get("x-api-secret");
    console.log(`Received API secret: ${apiSecret ? "Yes" : "No"}`);
    console.log(
      `Expected API secret: ${process.env.EMAIL_API_SECRET ? process.env.EMAIL_API_SECRET.substring(0, 3) + "..." : "Not set"}`
    );
    if (apiSecret !== process.env.EMAIL_API_SECRET) {
      console.log("API secret mismatch");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer la date d'hier (pour les tâches assignées la veille)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(
      `Looking for notifications between ${yesterday.toISOString()} and ${today.toISOString()}`
    );

    // Récupérer les notifications non lues pour les tâches assignées
    const notifications = await prisma.notification.findMany({
      where: {
        category: "TASK_ASSIGNED",
        read: false,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            notificationsEnabled: true,
          },
        },
      },
    });

    console.log(`Found ${notifications.length} notifications`);

    // Regrouper les notifications par utilisateur
    const userNotifications: Record<
      string,
      {
        user: { id: string; name: string; email: string };
        taskIds: string[];
      }
    > = {};

    notifications.forEach((notification) => {
      // Ne traiter que les utilisateurs avec email et notifications activées
      if (!notification.user.email || !notification.user.notificationsEnabled) {
        return;
      }

      // Extraire l'ID de tâche des données de notification
      let taskId: string | undefined;
      if (
        notification.data &&
        typeof notification.data === "object" &&
        "taskId" in notification.data
      ) {
        taskId = (notification.data as { taskId?: unknown }).taskId as
          | string
          | undefined;
      }
      if (!taskId) return;

      if (!userNotifications[notification.userId]) {
        userNotifications[notification.userId] = {
          user: {
            id: notification.userId,
            name: notification.user.name || "Utilisateur",
            email: notification.user.email,
          },
          taskIds: [],
        };
      }

      userNotifications[notification.userId].taskIds.push(taskId);
    });

    // Envoyer un email à chaque utilisateur avec ses tâches
    const emailResults = [];
    for (const userId in userNotifications) {
      const { user, taskIds } = userNotifications[userId];
      console.log(`Processing user ${user.email} with ${taskIds.length} tasks`);

      // Vérifier les accès aux objets pour cet utilisateur
      const userObjectAccess = await prisma.objectAccess.findMany({
        where: {
          userId: userId,
          NOT: { accessLevel: "none" },
        },
        select: { objectId: true },
      });

      // Vérifier si l'utilisateur est admin de l'organisation
      const isOrgAdmin = await prisma.organizationUser.findFirst({
        where: {
          userId: userId,
          role: "admin",
        },
      });

      // Si l'utilisateur est admin, il a accès à tout
      let accessibleObjectIds: string[];
      if (isOrgAdmin) {
        console.log(`User ${user.email} is admin - access to all objects`);
        // Admin : récupérer tous les objets de l'organisation
        const orgObjects = await prisma.objet.findMany({
          where: { organizationId: isOrgAdmin.organizationId },
          select: { id: true },
        });
        accessibleObjectIds = orgObjects.map((obj) => obj.id);
      } else {
        console.log(
          `User ${user.email} is member - access to ${userObjectAccess.length} objects`
        );
        // Membre : seulement les objets avec accès explicite
        accessibleObjectIds = userObjectAccess.map((access) => access.objectId);
      }

      // Récupérer les détails des tâches en filtrant par accès aux objets
      const tasks = (await prisma.task.findMany({
        where: {
          id: { in: taskIds },
          article: {
            sector: {
              objectId: { in: accessibleObjectIds },
            },
          },
        },
        include: {
          article: {
            include: {
              sector: {
                include: {
                  object: true,
                },
              },
            },
          },
          assignedTo: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })) as unknown as TaskWithDetails[];

      console.log(
        `User ${user.email}: filtered from ${taskIds.length} to ${tasks.length} accessible tasks`
      );

      // Envoyer l'email seulement s'il y a des tâches accessibles
      if (tasks.length > 0) {
        const result = await EmailService.sendTaskAssignmentEmail(
          user.email,
          user.name,
          tasks
        );

        emailResults.push({
          userId: user.id,
          email: user.email,
          success: result.success,
          taskCount: tasks.length,
          filteredByAccess: taskIds.length - tasks.length > 0, // Indique si des tâches ont été filtrées
        });
      } else {
        // Aucune tâche accessible, ne pas envoyer d'email
        emailResults.push({
          userId: user.id,
          email: user.email,
          success: true,
          taskCount: 0,
          filteredByAccess: true,
          reason: "Aucune tâche accessible selon les permissions",
        });
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailResults.length,
      details: emailResults,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails quotidiens:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des emails quotidiens" },
      { status: 500 }
    );
  }
}
