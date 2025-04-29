// src/app/api/articles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { checkArticleAccess } from "@/lib/auth-session";

// Utilisez le type correct pour les paramètres de route dans Next.js
type RouteParams = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const articleId = params.id;
  const { title, description, positionX, positionY, width, height } =
    await request.json();

  // Vérifier que l'article existe
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
  }

  // Vérifier que l'utilisateur a un accès en écriture à cet article
  const hasWriteAccess = await checkArticleAccess(user.id, articleId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cet article" },
      { status: 403 }
    );
  }

  // Mettre à jour l'article
  const updatedArticle = await prisma.article.update({
    where: { id: articleId },
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
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const articleId = params.id;

  // Vérifier que l'article existe
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
  }

  // Vérifier que l'utilisateur a un accès en écriture pour supprimer l'article
  const hasWriteAccess = await checkArticleAccess(user.id, articleId, "write");
  if (!hasWriteAccess) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cet article" },
      { status: 403 }
    );
  }

  // Supprimer l'article
  await prisma.article.delete({
    where: { id: articleId },
  });

  return NextResponse.json({ success: true });
}
