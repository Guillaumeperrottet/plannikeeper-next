// src/app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  // Vérifier l'authentification et les permissions
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { userId, title, message, category, link, data } = await req.json();

    // Vérifier si l'utilisateur existe et a activé les notifications
    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
        notificationsEnabled: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          error: "Utilisateur introuvable ou notifications désactivées",
        },
        { status: 404 }
      );
    }

    // Créer la notification dans la base de données
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        category,
        link,
        data: data || {},
      },
    });

    // Envoyer la notification via Firebase
    await sendNotificationToUser(userId, title, message, {
      ...data,
      notificationId: notification.id.toString(),
      category: category || "",
      link: link || "",
    });

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}
