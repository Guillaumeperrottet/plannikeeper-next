import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

/**
 * GET /api/users
 * Récupère tous les utilisateurs de l'organisation de l'utilisateur connecté
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

    // Récupérer tous les utilisateurs de l'organisation
    const users = await prisma.user.findMany({
      where: {
        organizationId: userWithOrg.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erreur récupération utilisateurs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
