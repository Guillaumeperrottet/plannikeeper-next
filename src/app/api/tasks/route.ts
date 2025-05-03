// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkArticleAccess } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const {
    name,
    description,
    status,
    taskType,
    color,
    realizationDate,
    assignedToId,
    recurring,
    period,
    endDate,
    articleId,
  } = await req.json();

  // Vérifier que le nom de la tâche est présent
  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Le nom de la tâche est requis" },
      { status: 400 }
    );
  }

  // Vérifier que l'article existe
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
  }

  // Vérifier que l'utilisateur a un accès en écriture à cet article
  const hasWriteAccess = await checkArticleAccess(user.id, articleId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      {
        error:
          "Vous n'avez pas les droits pour créer une tâche dans cet article",
      },
      { status: 403 }
    );
  }

  // Créer la tâche
  const task = await prisma.task.create({
    data: {
      name,
      description,
      status,
      taskType,
      color,
      realizationDate: realizationDate ? new Date(realizationDate) : null,
      assignedToId: assignedToId || null,
      recurring,
      period,
      endDate: endDate ? new Date(endDate) : null,
      articleId,
    },
  });

  // Si un utilisateur est assigné et ce n'est pas l'utilisateur actuel
  if (assignedToId && assignedToId !== user.id) {
    // Vérifier que l'utilisateur existe
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { notificationsEnabled: true, name: true },
    });

    if (assignedUser?.notificationsEnabled) {
      // Préparer les données pour la notification
      const notificationData = {
        userId: assignedToId,
        title: "Nouvelle tâche assignée",
        message: `Vous avez été assigné à la tâche "${name}"`,
        category: "TASK_ASSIGNED",
        link: `/dashboard/objet/${article.sector.object.id}/secteur/${article.sector.id}/article/${article.id}`,
        data: {
          taskId: task.id,
          objectName: article.sector.object.nom,
          sectorName: article.sector.name,
          articleTitle: article.title,
        },
      };

      // Créer la notification en base de données
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: notificationData.title,
          message: notificationData.message,
          category: notificationData.category,
          link: notificationData.link,
          data: notificationData.data,
        },
      });

      // Envoyer la notification via Firebase
      try {
        const response = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notificationData),
        });

        if (!response.ok) {
          console.error("Failed to send notification:", await response.json());
        }
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
  }

  return NextResponse.json(task);
}
