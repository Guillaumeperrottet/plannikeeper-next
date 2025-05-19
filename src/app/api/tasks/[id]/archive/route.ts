import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkTaskAccess } from "@/lib/auth-session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/tasks/[id]/archive - Archiver ou désarchiver une tâche
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupérer les données de la requête
  const { archive } = await req.json();

  try {
    // Vérifier que la tâche existe
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

    // Vérifier que l'utilisateur a les droits d'accès
    const hasWriteAccess = await checkTaskAccess(user.id, taskId, "write");
    if (!hasWriteAccess) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour modifier cette tâche" },
        { status: 403 }
      );
    }

    // Mettre à jour le statut d'archivage
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        archived: archive,
        archivedAt: archive ? new Date() : null,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Erreur lors de l'archivage de la tâche:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'archivage de la tâche" },
      { status: 500 }
    );
  }
}
