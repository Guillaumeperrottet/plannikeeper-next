// src/app/api/…/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkObjectAccess } from "@/lib/auth-session";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: objetId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que l'utilisateur a un accès admin à cet objet
  const hasAdminAccess = await checkObjectAccess(user.id, objetId, "admin");
  if (!hasAdminAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cet objet" },
      { status: 403 }
    );
  }

  try {
    // Supprimer les accès à l'objet
    await prisma.objectAccess.deleteMany({
      where: { objectId: objetId },
    });

    // Supprimer l'objet
    await prisma.objet.delete({
      where: { id: objetId },
    });

    // Plus idiomatique : 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'objet :", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'objet" },
      { status: 500 }
    );
  }
}
