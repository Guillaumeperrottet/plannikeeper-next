import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tasks/my-tasks
 * Récupère toutes les tâches assignées à l'utilisateur connecté
 * avec toutes les informations nécessaires (article, secteur, objet, documents, commentaires)
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Vérifier l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (!userWithOrg?.Organization) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 400 },
      );
    }

    // Récupérer les objets accessibles (selon rôle et permissions)
    const orgUser = await prisma.organizationUser.findFirst({
      where: { userId: user.id },
      select: { role: true },
    });

    let accessibleObjectIds: string[] = [];

    if (orgUser?.role === "admin") {
      // Admin : accès à tous les objets de l'organisation
      const orgObjects = await prisma.objet.findMany({
        where: { organizationId: userWithOrg.Organization.id },
        select: { id: true },
      });
      accessibleObjectIds = orgObjects.map((obj) => obj.id);
    } else {
      // Membre : seulement les objets avec accès explicite
      const userObjectAccess = await prisma.objectAccess.findMany({
        where: { userId: user.id },
        select: { objectId: true },
      });
      accessibleObjectIds = userObjectAccess.map((access) => access.objectId);
    }

    // Récupérer toutes les tâches des objets accessibles
    const tasks = await prisma.task.findMany({
      where: {
        archived: false,
        article: {
          sector: {
            object: {
              organizationId: userWithOrg.Organization.id,
              id: { in: accessibleObjectIds },
            },
          },
        },
      },
      include: {
        article: {
          include: {
            sector: {
              include: {
                object: {
                  select: {
                    id: true,
                    nom: true,
                    adresse: true,
                    pays: true,
                    icon: true,
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
            email: true,
            image: true,
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            filePath: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [
        { status: "asc" }, // En cours d'abord
        { realizationDate: "asc" }, // Plus tôt en premier
        { createdAt: "desc" }, // Plus récent ensuite
      ],
    });

    // Extraire les membres uniques qui ont des tâches sur les objets accessibles
    const uniqueMembers = Array.from(
      new Map(
        tasks
          .filter((task) => task.assignedTo) // Filtrer les tâches avec assignedTo
          .map((task) => [task.assignedTo!.id, task.assignedTo!]),
      ).values(),
    );

    return NextResponse.json({
      tasks,
      members: uniqueMembers,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches" },
      { status: 500 },
    );
  }
}
