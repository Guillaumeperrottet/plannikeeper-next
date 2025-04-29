// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkTaskAccess } from "@/lib/auth-session";

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
    },
  });

  return NextResponse.json(updatedTask);
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

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

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

  await prisma.task.delete({ where: { id: taskId } });
  return new NextResponse(null, { status: 204 });
}
