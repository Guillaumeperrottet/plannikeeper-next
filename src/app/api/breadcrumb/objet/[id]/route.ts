// src/app/api/breadcrumb/objet/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const objetId = params.id;

  try {
    // Récupérer l'objet
    const objet = await prisma.objet.findUnique({
      where: { id: objetId },
      select: {
        id: true,
        nom: true,
        adresse: true,
        secteur: true,
        organizationId: true,
      },
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
        { error: "Vous n'avez pas les droits pour accéder à cet objet" },
        { status: 403 }
      );
    }

    // Retourner l'objet sans l'ID de l'organisation
    const { ...objetData } = objet;
    return NextResponse.json(objetData);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'objet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'objet" },
      { status: 500 }
    );
  }
}
