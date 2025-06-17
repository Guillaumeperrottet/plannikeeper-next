import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: taskId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        article: {
          select: {
            id: true,
            sector: {
              select: {
                id: true,
                object: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      path: {
        objectId: task.article.sector.object.id,
        sectorId: task.article.sector.id,
        articleId: task.article.id,
        taskId: task.id,
      },
    });
  } catch (error) {
    console.error("Error checking task existence:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
