// src/app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

// GET - Récupérer les préférences de notifications
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Créer une nouvelle table pour les préférences ou utiliser User pour stocker les préférences
    // Pour l'instant, nous utiliserons un champ notificationsEnabled dans la table User
    // qu'il faudra ajouter au schéma

    const userWithPrefs = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        notificationsEnabled: true, // Ce champ doit être ajouté au schema
      },
    });

    // Si les préférences n'existent pas encore, retourner une valeur par défaut
    return NextResponse.json({
      notificationsEnabled: userWithPrefs?.notificationsEnabled ?? true,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des préférences" },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour les préférences de notifications
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { notificationsEnabled } = await req.json();

    // Mettre à jour les préférences de l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationsEnabled: notificationsEnabled,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des préférences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des préférences" },
      { status: 500 }
    );
  }
}
