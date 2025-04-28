// src/app/api/articles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const articleId = await params.id;
  const { title, description, positionX, positionY, width, height } =
    await req.json();

  // Vérifier que l'article existe et que l'utilisateur y a accès
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const articleId = await params.id;

  // Vérifier que l'article existe et que l'utilisateur y a accès
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
