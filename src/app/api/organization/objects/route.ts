// src/app/api/organization/objects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifiez si l'utilisateur est admin
  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId: user.id, role: "admin" },
  });

  if (!userOrg) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    // Récupérer tous les objets de l'organisation
    const objects = await prisma.objet.findMany({
      where: {
        organizationId: userOrg.organizationId,
      },
      select: {
        id: true,
        nom: true,
        adresse: true,
        secteur: true,
        icon: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      objects,
    });
  } catch (error) {
    console.error("Error fetching organization objects:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des objets",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
