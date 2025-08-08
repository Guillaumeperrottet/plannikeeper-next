import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import {
  NotificationService,
  NotificationType,
} from "@/lib/notification-serice";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier les métadonnées de l'utilisateur
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metadata: true },
    });

    const metadata = (dbUser?.metadata as Record<string, unknown>) || {};
    const hasSeenPwaPrompt = metadata.hasSeenPwaPrompt === true;

    // Si l'utilisateur a déjà vu le prompt PWA, ne rien faire
    if (hasSeenPwaPrompt) {
      return NextResponse.json({
        success: true,
        message: "PWA prompt already shown",
      });
    }

    // Créer la notification PWA
    await NotificationService.createNotification({
      userId: user.id,
      type: "PWA_INSTALL_PROMPT" as NotificationType,
      title: "📱 Installez PlanniKeeper sur votre téléphone",
      message:
        "Pour une meilleure expérience mobile, installez notre application sur votre écran d'accueil !",
      link: "/install-pwa",
      data: {
        category: "pwa_installation",
        priority: "medium",
        isDismissible: true,
      },
    });

    // Marquer que l'utilisateur a vu le prompt PWA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...metadata,
          hasSeenPwaPrompt: true,
          firstPwaPromptAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "PWA notification created successfully",
    });
  } catch (error) {
    console.error("Erreur lors de la création de la notification PWA:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification PWA" },
      { status: 500 }
    );
  }
}
