// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkTaskAccess } from "@/lib/auth-session";
import { hasUserObjectAccess } from "@/lib/object-access-utils";
import { calculateReminderDate } from "@/lib/utils";
import { NotificationService } from "@/lib/notification-serice";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/tasks/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
      assignedTo: true,
      documents: true, // Inclure les documents
    },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }
  const hasReadAccess = await checkTaskAccess(user.id, taskId, "read");
  if (!hasReadAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour accéder à cette tâche" },
      { status: 403 }
    );
  }

  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
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
    executantComment,
    recurrenceReminderDate,
  } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Le nom de la tâche est requis" },
      { status: 400 }
    );
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  const hasWriteAccess = await checkTaskAccess(user.id, taskId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  // Si un utilisateur est assigné, vérifier qu'il a accès à l'objet
  if (assignedToId) {
    const hasObjectAccess = await hasUserObjectAccess(
      assignedToId,
      task.article.sector.object.id
    );
    if (!hasObjectAccess) {
      return NextResponse.json(
        {
          error: "L'utilisateur assigné n'a pas accès à cet objet",
        },
        { status: 400 }
      );
    }
  }

  // Avant la mise à jour, récupérer l'état actuel
  const currentTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      name: true,
      description: true,
      status: true,
      realizationDate: true,
      assignedToId: true,
      done: true,
    },
  });

  // Détecter si l'assignation change
  const isReassignment =
    currentTask && currentTask.assignedToId !== (assignedToId || null);

  // Gérer la date de rappel pour les tâches récurrentes
  let reminderDate = recurrenceReminderDate;

  // Si la tâche devient récurrente ou change de période vers trimestrielle/annuelle
  if (
    realizationDate &&
    // La tâche devient récurrente
    ((recurring && !task.recurring) ||
      // Ou la période change vers un type qui nécessite un rappel
      (recurring &&
        task.recurring &&
        (period === "quarterly" || period === "yearly") &&
        task.period !== "quarterly" &&
        task.period !== "yearly"))
  ) {
    // Si aucune date de rappel n'est fournie explicitement
    if (recurrenceReminderDate === undefined) {
      // Calculer automatiquement si c'est une période qui nécessite un rappel
      if (period === "quarterly" || period === "yearly") {
        reminderDate = calculateReminderDate(
          new Date(realizationDate),
          period,
          10 // 10 jours avant l'échéance
        );
      } else {
        reminderDate = null;
      }
    }
  }
  // Si la tâche n'est plus récurrente ou change vers une période qui ne nécessite pas de rappel
  else if (
    !recurring ||
    (recurring && period !== "quarterly" && period !== "yearly")
  ) {
    reminderDate = null;
  }

  // Gérer completedAt basé sur le changement de statut
  let completedAtValue = task.completedAt; // Garder la valeur actuelle par défaut

  // Si le statut change vers "completed", enregistrer la date
  if (status === "completed" && currentTask?.status !== "completed") {
    completedAtValue = new Date();
  }
  // Si le statut n'est plus "completed", réinitialiser completedAt
  else if (status !== "completed" && currentTask?.status === "completed") {
    completedAtValue = null;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
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
      executantComment,
      done: status === "completed",
      recurrenceReminderDate: reminderDate,
      completedAt: completedAtValue,
    },
  });

  // 🆕 NOTIFICATIONS POUR LES MISES À JOUR
  if (currentTask) {
    const changes: string[] = [];

    // Détecter les changements
    if (currentTask.name !== name) changes.push("nom");
    if (currentTask.description !== description) changes.push("description");
    if (currentTask.status !== status) changes.push("statut");
    if (
      currentTask.realizationDate?.getTime() !==
      new Date(realizationDate || "").getTime()
    ) {
      changes.push("date d'échéance");
    }

    // 🔄 GÉRER LA RÉ-ASSIGNATION
    if (isReassignment && assignedToId && assignedToId !== user.id) {
      // Créer une notification TASK_ASSIGNED pour la nouvelle personne assignée
      // Cette notification sera automatiquement incluse dans l'email quotidien du matin
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: "Nouvelle tâche assignée",
          message: `${user.name || "Un utilisateur"} vous a assigné la tâche "${name}"`,
          category: "TASK_ASSIGNED",
          link: `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}`,
          data: {
            taskId: taskId,
            taskName: name,
            objectName: task.article.sector.object.nom,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            assignerName: user.name || "Un utilisateur",
            isReassignment: true,
          },
        },
      });
      console.log(
        `✅ Notification de ré-assignation créée pour ${assignedToId}`
      );
    }

    // Si la tâche passe à "terminée"
    if (!currentTask.done && status === "completed") {
      await NotificationService.notifyTaskCompleted(
        taskId,
        user.id,
        user.name || "Utilisateur"
      );
    }
    // Sinon, si il y a d'autres changements (mais pas une ré-assignation seule)
    else if (changes.length > 0) {
      await NotificationService.notifyTaskUpdated(
        taskId,
        user.id,
        user.name || "Utilisateur",
        changes
      );
    }
  }

  // Stocker l'ID de l'objet et du secteur pour les invalidations de cache
  const objectId = task.article.sector.object.id;
  const sectorId = task.article.sector.id;

  // Ajouter des headers spécifiques pour indiquer quels caches doivent être invalidés
  const response = NextResponse.json(updatedTask);
  response.headers.set("X-Invalidate-Cache", `tasks_${objectId}`);
  response.headers.set(
    "X-Invalidate-Cache-Keys",
    JSON.stringify([
      `tasks_${objectId}`,
      `article_tasks_${task.article.id}`,
      `sector_tasks_${sectorId}`,
    ])
  );

  return response;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const updateData = await req.json();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
    },
  });
  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  const hasWriteAccess = await checkTaskAccess(user.id, taskId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  // Si l'assignation est mise à jour, vérifier que l'utilisateur assigné a accès à l'objet
  if (updateData.assignedToId) {
    const hasObjectAccess = await hasUserObjectAccess(
      updateData.assignedToId,
      task.article.sector.object.id
    );
    if (!hasObjectAccess) {
      return NextResponse.json(
        {
          error: "L'utilisateur assigné n'a pas accès à cet objet",
        },
        { status: 400 }
      );
    }
  }

  // Détecter si l'assignation change
  const isPatchReassignment =
    "assignedToId" in updateData &&
    task.assignedToId !== (updateData.assignedToId || null);

  // Gérer completedAt si le statut est dans updateData
  if ("status" in updateData) {
    const currentStatus = task.status;
    const newStatus = updateData.status;

    // Si le statut devient "completed", ajouter completedAt
    if (newStatus === "completed" && currentStatus !== "completed") {
      updateData.completedAt = new Date();
    }
    // Si le statut n'est plus "completed", réinitialiser completedAt
    else if (newStatus !== "completed" && currentStatus === "completed") {
      updateData.completedAt = null;
    }

    // S'assurer que done est cohérent avec status
    if (newStatus === "completed") {
      updateData.done = true;
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  // 🔄 GÉRER LA RÉ-ASSIGNATION via PATCH
  if (
    isPatchReassignment &&
    updateData.assignedToId &&
    updateData.assignedToId !== user.id
  ) {
    // Créer une notification TASK_ASSIGNED pour la nouvelle personne assignée
    await prisma.notification.create({
      data: {
        userId: updateData.assignedToId,
        title: "Nouvelle tâche assignée",
        message: `${user.name || "Un utilisateur"} vous a assigné la tâche "${task.name}"`,
        category: "TASK_ASSIGNED",
        link: `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}`,
        data: {
          taskId: taskId,
          taskName: task.name,
          objectName: task.article.sector.object.nom,
          sectorName: task.article.sector.name,
          articleTitle: task.article.title,
          assignerName: user.name || "Un utilisateur",
          isReassignment: true,
        },
      },
    });
    console.log(
      `✅ Notification de ré-assignation créée pour ${updateData.assignedToId} (PATCH)`
    );
  }

  return NextResponse.json(updatedTask);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: { include: { object: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  const hasWriteAccess = await checkTaskAccess(user.id, taskId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cette tâche" },
      { status: 403 }
    );
  }

  // Stocker l'ID de l'objet pour les invalidations de cache
  const objectId = task.article.sector.object.id;

  try {
    // Supprimer les notifications liées à cette tâche
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        data: {
          path: ["taskId"],
          equals: taskId,
        },
      },
    });

    console.log(
      `Suppression tâche ${taskId}: ${deletedNotifications.count} notification(s) supprimée(s)`
    );

    // Supprimer la tâche
    await prisma.task.delete({ where: { id: taskId } });

    console.log(
      `Tâche ${taskId} supprimée avec succès par l'utilisateur ${user.id}`
    );

    // Inclure des métadonnées sur les données à rafraichir
    // Ces informations seront utilisées côté client
    const responseData = {
      success: true,
      deletedTaskId: taskId,
      objectId: objectId,
      refreshKeys: [`tasks_${objectId}`, "agenda_tasks"],
      notificationsDeleted: deletedNotifications.count,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error(
      `Erreur lors de la suppression de la tâche ${taskId}:`,
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la tâche" },
      { status: 500 }
    );
  }
}
