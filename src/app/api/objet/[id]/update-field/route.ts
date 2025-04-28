import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const objectId = params.id;
  const { field, value } = await req.json();

  // Vérifier que le champ est valide
  const validFields = ["nom", "adresse", "secteur"];
  if (!validFields.includes(field)) {
    return NextResponse.json({ error: "Champ non valide" }, { status: 400 });
  }

  // Récupérer l'objet
  const objet = await prisma.objet.findUnique({
    where: { id: objectId },
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
      { error: "Vous n'avez pas les droits pour modifier cet objet" },
      { status: 403 }
    );
  }

  // Mettre à jour le champ
  try {
    const updatedObject = await prisma.objet.update({
      where: { id: objectId },
      data: {
        [field]: value,
      },
    });

    return NextResponse.json({ success: true, object: updatedObject });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'objet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'objet" },
      { status: 500 }
    );
  }
}
