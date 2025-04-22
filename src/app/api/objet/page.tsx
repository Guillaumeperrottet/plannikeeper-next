import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nom, adresse, secteur } = await req.json();

  // On récupère l'organisation de l'utilisateur
  const userDb = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true },
  });

  if (!userDb?.organization) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const objet = await prisma.objet.create({
    data: {
      nom,
      adresse,
      secteur,
      organizationId: userDb.organization.id,
    },
  });

  return NextResponse.json(objet);
}
