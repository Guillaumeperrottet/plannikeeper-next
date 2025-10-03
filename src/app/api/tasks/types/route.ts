import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";

/**
 * GET /api/tasks/types
 * Récupère tous les types de tâches uniques utilisés dans l'organisation
 */
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const organizationUser = await prisma.organizationUser.findUnique({
      where: { userId: user.id },
    });

    if (!organizationUser) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 403 }
      );
    }

    // Récupérer tous les types de tâches uniques de l'organisation
    const tasks = await prisma.task.findMany({
      where: {
        article: {
          sector: {
            object: {
              organizationId: organizationUser.organizationId,
            },
          },
        },
        taskType: {
          not: null,
        },
      },
      select: {
        taskType: true,
      },
      distinct: ["taskType"],
      orderBy: {
        taskType: "asc",
      },
    });

    // Extraire les types et filtrer les valeurs nulles
    const taskTypes = tasks
      .map((task) => task.taskType)
      .filter((type): type is string => type !== null && type !== "");

    return NextResponse.json({
      types: taskTypes,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des types de tâches:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
