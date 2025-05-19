import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkObjectAccess } from "@/lib/auth-session";

// Nous n'utilisons plus de type personnalisé pour les paramètres
export async function GET(
  req: NextRequest,
  { params }: { params: { objectId: string } }
) {
  try {
    // Récupération directe de l'ID de l'objet
    const { objectId } = params;

    if (!objectId) {
      return NextResponse.json(
        { error: "ID d'objet manquant" },
        { status: 400 }
      );
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'objet existe
    const object = await prisma.objet.findUnique({
      where: { id: objectId },
    });

    if (!object) {
      return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a un accès en lecture à cet objet
    const hasReadAccess = await checkObjectAccess(user.id, objectId, "read");
    if (!hasReadAccess) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cet objet" },
        { status: 403 }
      );
    }

    // Récupérer toutes les tâches liées à cet objet, SAUF celles archivées
    const tasks = await prisma.task.findMany({
      where: {
        article: {
          sector: {
            objectId,
          },
        },
        archived: false,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            sector: {
              select: {
                id: true,
                name: true,
                object: {
                  select: {
                    id: true,
                    nom: true,
                  },
                },
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ realizationDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des tâches",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
