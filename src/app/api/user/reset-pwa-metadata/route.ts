import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer les métadonnées actuelles
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metadata: true },
    });

    const metadata = (currentUser?.metadata as Record<string, unknown>) || {};

    // Supprimer les métadonnées PWA
    delete metadata.hasSeenPwaPrompt;
    delete metadata.firstPwaPromptAt;

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: JSON.parse(JSON.stringify(metadata)),
      },
    });

    console.log(
      `✅ Métadonnées PWA réinitialisées pour l'utilisateur ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Métadonnées PWA réinitialisées avec succès",
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la réinitialisation des métadonnées PWA:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation des métadonnées PWA" },
      { status: 500 }
    );
  }
}
