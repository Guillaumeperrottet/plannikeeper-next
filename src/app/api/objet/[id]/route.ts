// src/app/api/objet/[id]/route.ts - Optimized for performance
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkObjectAccess } from "@/lib/auth-session";

// Import types
type RouteParams = {
  params: Promise<{ id: string }>;
};

// Improved caching constants
const CACHE_MAX_AGE = 60; // 60 seconds
const CACHE_STALE_WHILE_REVALIDATE = 300; // 5 minutes

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Get ID from promise more efficiently
  const { id: objectId } = await params;

  // Get user from session (implement caching if this is called frequently)
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Check access rights (consider caching this result)
  const hasReadAccess = await checkObjectAccess(user.id, objectId, "read");
  if (!hasReadAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour accéder à cet objet" },
      { status: 403 }
    );
  }

  // Smart ETag handling
  const requestETag = req.headers.get("if-none-match");
  const today = new Date().toISOString().split("T")[0];
  const etag = `"tasks-${objectId}-${today}"`;

  // If ETag matches, return 304 Not Modified immediately
  if (requestETag === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": `max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`,
        Vary: "Authorization",
      },
    });
  }

  try {
    // Efficient DB query - only fetch what's needed
    const tasks = await prisma.task.findMany({
      where: {
        article: {
          sector: {
            objectId,
          },
        },
        // Only fetch non-archived tasks for better performance
        archived: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        realizationDate: true,
        taskType: true,
        color: true,
        recurring: true,
        period: true,
        createdAt: true,
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

    // Create response with proper headers
    const response = NextResponse.json(tasks);

    // Add cache headers
    response.headers.set("ETag", etag);
    response.headers.set(
      "Cache-Control",
      `max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`
    );
    response.headers.set("Vary", "Authorization");

    // Return response that respects browser cache
    return response;
  } catch (error) {
    console.error(`Error fetching tasks for object ${objectId}:`, error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des tâches" },
      { status: 500 }
    );
  }
}
