import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

// Mettre à jour un article
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { title, description, width, height } = await req.json();
    const articleId = params.id;

    // Récupérer l'article pour vérifier l'accès
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { 
        sector: {
          include: { object: true }
        } 
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à cet objet (même organisation)
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== article.sector.object.organizationId
    ) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier les droits d'édition
    const objectAccess = await prisma.objectAccess.findFirst({
      where: {
        userId: user.id,
        objectId: article.sector.objectId,
      },
    });

    const isAdmin = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: article.sector.object.organizationId,
        role: "admin",
      },
    });

    if (
      !objectAccess?.accessLevel === "write" &&
      !objectAccess?.accessLevel === "admin" &&
      !isAdmin
    ) {
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }

    // Mettre à jour l'article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title,
        description,
        width: Number(width) || 8,
        height: Number(height) || 8,
      },
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'article" },
      { status: 500 }
    );
  }
}

// Supprimer un article
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const articleId = params.id;

    // Récupérer l'article pour vérifier l'accès
    const article =