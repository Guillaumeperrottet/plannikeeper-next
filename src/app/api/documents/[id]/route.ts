// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { unlink } from "fs/promises";
import path from "path";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: documentId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Récupérer le document avec sa tâche associée
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        task: {
          include: {
            article: {
              include: {
                sector: {
                  include: { object: true },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
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
        document.task.article.sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour supprimer ce document" },
        { status: 403 }
      );
    }

    // Supprimer le fichier physique
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        document.filePath.startsWith("/")
          ? document.filePath.slice(1)
          : document.filePath
      );
      await unlink(filePath);
    } catch (err) {
      console.warn("Erreur lors de la suppression du fichier :", err);
      // On continue même si le fichier n'a pas pu être supprimé
    }

    // Supprimer l'entrée dans la base de données
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Plus idiomatique : 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erreur lors de la suppression du document :", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du document" },
      { status: 500 }
    );
  }
}
