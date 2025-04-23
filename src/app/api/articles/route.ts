// src/app/api/articles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const {
    id,
    title,
    description,
    positionX,
    positionY,
    width,
    height,
    sectorId,
  } = await req.json();

  // Si un ID est fourni, c'est une mise à jour
  if (id) {
    // Vérifier que l'article existe et que l'utilisateur y a accès
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: {
        sector: {
          include: { object: true },
        },
      },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation que l'objet
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !==
        existingArticle.sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour modifier cet article" },
        { status: 403 }
      );
    }

    // Mettre à jour l'article
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        title,
        description,
        positionX,
        positionY,
        width,
        height,
      },
    });

    return NextResponse.json(updatedArticle);
  } else {
    // Sinon, c'est une création
    // Vérifier que l'utilisateur a accès au secteur
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

    // Vérifier que l'utilisateur appartient à la même organisation que l'objet
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour modifier ce secteur" },
        { status: 403 }
      );
    }

    // Créer l'article
    const article = await prisma.article.create({
      data: {
        title,
        description,
        positionX,
        positionY,
        width,
        height,
        sectorId,
      },
    });

    return NextResponse.json(article);
  }
}
