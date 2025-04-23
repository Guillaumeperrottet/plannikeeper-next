import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const {
      title,
      description,
      sectorId,
      positionX,
      positionY,
      width,
      height,
    } = await req.json();

    // Récupérer le secteur pour vérifier l'accès
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
      include: { object: true },
    });

    if (!sector) {
      return NextResponse.json(
        { error: "Secteur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à cet objet (même organisation)
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== sector.object.organizationId
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier les droits d'édition
    const objectAccess = await prisma.objectAccess.findFirst({
      where: {
        userId: user.id,
        objectId: sector.objectId,
      },
    });

    const isAdmin = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: sector.object.organizationId,
        role: "admin",
      },
    });

    if (
      !objectAccess?.accessLevel === "write" &&
      !objectAccess?.accessLevel === "admin" &&
      !isAdmin
    ) {
      return NextResponse.json(
        { error: "Droits insuffisants" },
        { status: 403 }
      );
    }

    // Créer l'article
    const article = await prisma.article.create({
      data: {
        title,
        description,
        sectorId,
        positionX: positionX !== null ? Number(positionX) : null,
        positionY: positionY !== null ? Number(positionY) : null,
        width: width !== null ? Number(width) : 8,
        height: height !== null ? Number(height) : 8,
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'article" },
      { status: 500 }
    );
  }
}
