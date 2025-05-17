// src/app/api/tasks/archives/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer les paramètres de filtrage/tri
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "archivedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const objectFilter = searchParams.get("objectId") || null;
    const fromDate = searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate") as string)
      : null;
    const toDate = searchParams.get("toDate")
      ? new Date(searchParams.get("toDate") as string)
      : null;

    // Récupérer l'organisation de l'utilisateur
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

    // Si l'utilisateur est admin, il peut voir toutes les tâches archivées de l'organisation
    // Sinon, il ne voit que les tâches des objets auxquels il a accès
    const isAdmin = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: userWithOrg.Organization.id,
        role: "admin",
      },
    });
    const whereClause: Prisma.TaskWhereInput = {
      archived: true,
      article: {
        sector: {
          object: {
            organizationId: userWithOrg.Organization.id,
          },
        },
      },
    };

    // Si l'utilisateur n'est pas admin, filtrer selon ses accès aux objets
    if (!isAdmin) {
      const objectAccess = await prisma.objectAccess.findMany({
        where: {
          userId: user.id,
          NOT: { accessLevel: "none" },
        },
        select: { objectId: true },
      });

      const objectIds = objectAccess.map((access) => access.objectId);

      whereClause.AND = [
        {
          article: {
            sector: {
              object: {
                id: { in: objectIds },
              },
            },
          },
        },
      ];
    }

    // Ajouter les filtres de recherche
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtre par objet spécifique
    if (objectFilter) {
      const existingConditions = Array.isArray(whereClause.AND)
        ? whereClause.AND
        : whereClause.AND
          ? [whereClause.AND]
          : [];

      whereClause.AND = [
        ...existingConditions,
        {
          article: {
            sector: {
              object: {
                id: objectFilter,
              },
            },
          },
        },
      ];
    }

    // Filtres de date
    if (fromDate) {
      whereClause.archivedAt = {
        ...(typeof whereClause.archivedAt === "object" &&
        whereClause.archivedAt !== null
          ? (whereClause.archivedAt as object)
          : {}),
        gte: fromDate,
      };
    }

    if (toDate) {
      // Ajouter un jour pour inclure tout le jour de fin
      const adjustedToDate = new Date(toDate);
      adjustedToDate.setDate(adjustedToDate.getDate() + 1);
      whereClause.archivedAt = {
        ...(typeof whereClause.archivedAt === "object" &&
        whereClause.archivedAt !== null
          ? (whereClause.archivedAt as object)
          : {}),
        lt: adjustedToDate,
      };
    }

    // Récupérer les tâches archivées
    const archivedTasks = await prisma.task.findMany({
      where: whereClause,
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
      orderBy: {
        [sortBy]: sortOrder === "asc" ? "asc" : "desc",
      },
    });

    return NextResponse.json({
      tasks: archivedTasks,
      total: archivedTasks.length,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des tâches archivées:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches archivées" },
      { status: 500 }
    );
  }
}
