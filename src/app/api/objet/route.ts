// src/app/api/objet/route.ts (simplifié)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function GET() {
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

  // Vérifier si l'utilisateur est admin de l'organisation
  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: user.id,
      organizationId: userWithOrg.Organization.id,
      role: "admin",
    },
  });

  // Si l'utilisateur est admin, retourner tous les objets
  if (isAdmin) {
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

    // Retourner simplement les données
    return NextResponse.json(objects);
  }

  // Sinon, uniquement retourner les objets auxquels l'utilisateur a accès
  // On récupère tous les accès spécifiques de l'utilisateur
  const objectAccess = await prisma.objectAccess.findMany({
    where: {
      userId: user.id,
      NOT: { accessLevel: "none" },
    },
    select: { objectId: true },
  });

  // Extrait la liste des IDs d'objets
  const objectIds = objectAccess.map((access) => access.objectId);

  // Récupère uniquement les objets auxquels l'utilisateur a accès (niveau différent de "none")
  const objects = await prisma.objet.findMany({
    where: {
      id: { in: objectIds }, // Ne contiendra que les IDs avec accessLevel != "none"
      organizationId: userWithOrg.Organization.id,
    },
    orderBy: { nom: "asc" },
    select: {
      id: true,
      nom: true,
      adresse: true,
      secteur: true,
    },
  });

  // Retourner simplement les données
  return NextResponse.json(objects);
}
