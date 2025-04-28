// src/app/api/tasks/object/[objectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkObjectAccess } from "@/lib/auth-session";

export async function GET(
  req: NextRequest,
  { params }: { params: { objectId: Promise<string> } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const objectId = await params.objectId;

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

  // Récupérer toutes les tâches liées à cet objet
  const tasks = await prisma.task.findMany({
    where: {
      article: {
        sector: {
          objectId: objectId,
        },
      },
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
}
