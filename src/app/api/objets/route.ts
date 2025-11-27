import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, getAccessibleObjects } from "@/lib/auth-session";

/**
 * GET /api/objets
 * Récupère tous les objets accessibles par l'utilisateur connecté
 */
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (!userWithOrg?.organizationId) {
      return NextResponse.json(
        { error: "Utilisateur sans organisation" },
        { status: 400 }
      );
    }

    // Utiliser la fonction getAccessibleObjects qui gère les permissions
    const objets = await getAccessibleObjects(
      user.id,
      userWithOrg.organizationId
    );

    // Retourner uniquement les champs nécessaires
    const objetsList = objets.map((objet) => ({
      id: objet.id,
      name: objet.nom, // Le champ s'appelle "nom" dans la base
      icon: objet.icon,
    }));

    return NextResponse.json(objetsList);
  } catch (error) {
    console.error("Erreur récupération objets:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
