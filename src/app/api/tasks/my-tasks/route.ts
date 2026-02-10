import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tasks/my-tasks
 * Récupère toutes les tâches assignées à l'utilisateur connecté
 * Optimisé : 1 seule requête principale, pagination, _count au lieu de charger tous les docs/comments
 */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // ✅ OPTIMISATION 1: Une seule requête pour récupérer toutes les infos utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        Organization: {
          select: { id: true },
        },
        OrganizationUser: {
          select: { role: true },
        },
        objectAccess: {
          select: { objectId: true },
        },
      },
    });

    if (!userData?.Organization) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 400 },
      );
    }

    // ✅ OPTIMISATION 2: Déterminer les objets accessibles efficacement
    const isAdmin = userData.OrganizationUser?.role === "admin";
    const accessibleObjectIds = isAdmin
      ? undefined // Admin = tous les objets (pas de filtre)
      : userData.objectAccess.map((access) => access.objectId);

    // ✅ OPTIMISATION 3: Pagination
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    // ✅ OPTIMISATION 4: Requête optimisée avec _count au lieu de charger tous les documents/commentaires
    const tasks = await prisma.task.findMany({
      where: {
        archived: false,
        status: { not: "completed" }, // Exclure les tâches terminées
        article: {
          sector: {
            object: {
              organizationId: userData.Organization.id,
              ...(accessibleObjectIds && { id: { in: accessibleObjectIds } }),
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        executantComment: true,
        status: true,
        realizationDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        taskType: true,
        color: true,
        recurring: true,
        article: {
          select: {
            id: true,
            title: true,
            sector: {
              select: {
                id: true,
                name: true,
                image: true,
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
        // ✅ OPTIMISATION 5: Utiliser _count au lieu de charger toutes les données
        _count: {
          select: {
            documents: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { realizationDate: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: skip,
    });

    // ✅ OPTIMISATION 6: Compter le total en parallèle uniquement si nécessaire
    const total =
      page === 1 && tasks.length < limit
        ? tasks.length
        : await prisma.task.count({
            where: {
              archived: false,
              status: { not: "completed" }, // Exclure les tâches terminées du comptage
              article: {
                sector: {
                  object: {
                    organizationId: userData.Organization.id,
                    ...(accessibleObjectIds && {
                      id: { in: accessibleObjectIds },
                    }),
                  },
                },
              },
            },
          });

    // Extraire les membres uniques qui ont des tâches sur les objets accessibles
    const uniqueMembers = Array.from(
      new Map(
        tasks
          .filter((task) => task.assignedTo)
          .map((task) => [task.assignedTo!.id, task.assignedTo!]),
      ).values(),
    );

    return NextResponse.json({
      tasks,
      members: uniqueMembers,
      currentUserId: user.id,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches" },
      { status: 500 },
    );
  }
}
