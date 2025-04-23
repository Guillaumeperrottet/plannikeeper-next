import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const objetId = params.id;

  // Récupérer l'objet
  const objet = await prisma.objet.findUnique({
    where: { id: objetId },
  });

  if (!objet) {
    return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== objet.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cet objet" },
      { status: 403 }
    );
  }

  // Vérifier si l'utilisateur a le rôle d'administrateur
  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: user.id,
      organizationId: objet.organizationId,
      role: "admin",
    },
  });

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Seuls les administrateurs peuvent supprimer des objets" },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'objet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'objet" },
      { status: 500 }
    );
  }
}
