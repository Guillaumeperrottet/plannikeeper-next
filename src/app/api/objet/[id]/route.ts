import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkObjectAccess } from "@/lib/auth-session";
import { withCacheHeaders, CacheDurations } from "@/lib/cache-config";

// Typage mis à jour : params est une Promise qui résout { objectId: string }
type RouteParams = {
  params: Promise<{ objectId: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { objectId } = await params;

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
      archived: false, // Ajouter cette condition pour exclure les tâches archivées
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

  // Valider l'ETag pour optimiser les réponses
  const tasksETag = `"tasks-${objectId}-${new Date().toISOString().split("T")[0]}"`;
  const ifNoneMatch = req.headers.get("if-none-match");

  if (ifNoneMatch === tasksETag) {
    // Si l'ETag correspond, renvoyer 304 Not Modified
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: tasksETag,
        "Cache-Control": "max-age=60, stale-while-revalidate=300",
      },
    });
  }

  // Sinon, renvoyer les données avec un en-tête ETag
  const response = NextResponse.json(tasks);
  response.headers.set("ETag", tasksETag);

  // Les tâches changent fréquemment, utiliser un cache court avec SWR
  return withCacheHeaders(response, CacheDurations.SWR_QUICK);
}
