// src/app/api/users/[userId]/route.ts
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Typage mis à jour : params est une Promise qui résout { userId: string }
type RouteParams = {
  params: Promise<{ userId: string }>;
};

export async function DELETE(req: Request, { params }: RouteParams) {
  // Récupération de l'userId depuis la promesse
  const { userId } = await params;
  const currentUser = await getUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est administrateur (sauf s'il se supprime lui-même)
  if (userId !== currentUser.id) {
    const userOrg = await prisma.organizationUser.findFirst({
      where: { userId: currentUser.id, role: "admin" },
    });

    if (!userOrg) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que l'utilisateur à supprimer appartient à la même organisation
    const targetUserOrg = await prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId: userOrg.organizationId,
      },
    });

    if (!targetUserOrg) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans cette organisation" },
        { status: 404 }
      );
    }
  }

  try {
    // Supprimer les accès aux objets (à implémenter plus tard)

    // Supprimer l'association avec l'organisation
    await prisma.organizationUser.deleteMany({
      where: { userId },
    });

    // Si l'utilisateur se supprime lui-même, on le déconnecte
    // Sinon, on peut optionnellement supprimer complètement l'utilisateur
    if (userId !== currentUser.id) {
      // Optionnel: supprimer complètement l'utilisateur
      // await prisma.user.delete({ where: { id: userId } });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
