// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = params.id;

  // Récupérer la tâche avec l'article associé
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: {
            include: { object: true },
          },
        },
      },
      assignedTo: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour accéder à cette tâche" },
      { status: 403 }
    );
  }

  return NextResponse.json(task);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = params.id;
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
  } = await req.json();

  // Vérifier que le nom de la tâche est présent
  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Le nom de la tâche est requis" },
      { status: 400 }
    );
  }

  // Récupérer la tâche avec l'article associé
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: {
            include: { object: true },
          },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  // Mettre à jour la tâche
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
      // Si le statut est "completed", marquer comme terminée
      done: status === "completed",
    },
  });

  return NextResponse.json(updatedTask);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = params.id;
  const updateData = await req.json();

  // Récupérer la tâche avec l'article associé
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: {
            include: { object: true },
          },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  // Mettre à jour la tâche avec seulement les champs fournis
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  return NextResponse.json(updatedTask);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = params.id;

  // Récupérer la tâche avec l'article associé
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: {
            include: { object: true },
          },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cette tâche" },
      { status: 403 }
    );
  }

  // Supprimer la tâche
  await prisma.task.delete({
    where: { id: taskId },
  });

  return NextResponse.json({ success: true });
}
