// src/app/api/breadcrumb/article/[id]/route.ts
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

  const articleId = params.id;

  try {
    // Récupérer l'article avec son secteur et l'objet associé
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        sector: {
          include: { object: true },
        },
      },
    });

    if (!article) {
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
      userWithOrg.Organization.id !== article.sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cet article" },
        { status: 403 }
      );
    }

    // Retourner les données de l'article nécessaires pour le breadcrumb
    return NextResponse.json({
      id: article.id,
      title: article.title,
      sectorId: article.sectorId,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'article" },
      { status: 500 }
    );
  }
}
