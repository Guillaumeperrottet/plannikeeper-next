// src/app/api/objects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupérer l'organisation de l'utilisateur
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    return NextResponse.json(
      { error: "Aucune organisation trouvée" },
      { status: 404 }
    );
  }

  // Récupérer tous les objets de l'organisation
  const objects = await prisma.objet.findMany({
    where: { organizationId: userWithOrg.Organization.id },
    orderBy: { nom: "asc" },
    select: {
      id: true,
      nom: true,
      adresse: true,
      secteur: true,
    },
  });

  return NextResponse.json(objects);
}
