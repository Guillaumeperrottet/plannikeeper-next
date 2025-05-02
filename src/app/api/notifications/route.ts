// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

// Récupérer les notifications de l'utilisateur
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Paramètres optionnels
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const onlyUnread = req.nextUrl.searchParams.get("unread") === "true";

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        task: {
          select: {
            id: true,
            name: true,
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
          },
        },
      },
    });

    // Compter les notifications non lues
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// Créer une notification (pour les tests principalement, normalement les notifications
// sont créées par d'autres processus)
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { type, content, link, userId, taskId } = await req.json();

  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        content,
        link,
        userId: userId || user.id,
        taskId,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification" },
      { status: 500 }
    );
  }
}
