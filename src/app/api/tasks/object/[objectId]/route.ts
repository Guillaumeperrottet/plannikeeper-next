// src/app/api/tasks/object/[objectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function GET(
  req: NextRequest,
  { params }: { params: { objectId: Promise<string> } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const objectId = await params.objectId;

  // Vérifier que l'utilisateur a accès à cet objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    return NextResponse.json(
      { error: "Aucune organisation trouvée" },
      { status: 404 }
    );
  }

  // Vérifier que l'objet appartient à l'organisation de l'utilisateur
  const object = await prisma.objet.findUnique({
    where: { id: objectId },
  });

  if (!object || object.organizationId !== userWithOrg.Organization.id) {
    return NextResponse.json(
      { error: "Objet non trouvé ou accès refusé" },
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
