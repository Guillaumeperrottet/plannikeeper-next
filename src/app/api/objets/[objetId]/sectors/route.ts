import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, checkObjectAccess } from "@/lib/auth-session";

/**
 * GET /api/objets/[objetId]/sectors
 * Récupère tous les secteurs d'un objet
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ objetId: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { objetId } = await context.params;

    // Vérifier que l'utilisateur a accès à cet objet
    const hasAccess = await checkObjectAccess(user.id, objetId, "read");

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les secteurs de l'objet
    const sectors = await prisma.sector.findMany({
      where: { objectId: objetId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(sectors);
  } catch (error) {
    console.error("Erreur récupération secteurs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
