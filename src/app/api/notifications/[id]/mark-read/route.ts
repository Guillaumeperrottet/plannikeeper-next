// src/app/api/notifications/[id]/mark-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: notificationId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(notificationId) },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette notification" },
        { status: 403 }
      );
    }

    // Marquer comme lue
    await prisma.notification.update({
      where: { id: parseInt(notificationId) },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du marquage de la notification:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage de la notification" },
      { status: 500 }
    );
  }
}
