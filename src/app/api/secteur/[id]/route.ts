// src/app/api/secteur/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { CloudinaryService } from "@/lib/cloudinary";

type RouteParams = { params: Promise<{ id: string }> };

// Mettre à jour un secteur
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: sectorId } = await params;
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const image = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") === "true";

    if (!name) {
      return NextResponse.json(
        { error: "Le nom du secteur est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le secteur existe et appartient à l'organisation de l'utilisateur
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
      include: {
        object: {
          include: { organization: true },
        },
      },
    });

    if (!sector) {
      return NextResponse.json(
        { error: "Secteur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation
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

    const updateData: {
      name: string;
      image?: string | null;
      imageWidth?: number;
      imageHeight?: number;
    } = { name };

    // Si une nouvelle image est fournie, l'uploader
    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());

      // Upload de la nouvelle image vers Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(
        buffer,
        image.name,
        {
          folder: `plannikeeper/objets/${sector.objectId}/secteurs`,
          resourceType: "image",
          tags: ["secteur", `objet_${sector.objectId}`],
        }
      );

      // Supprimer l'ancienne image de Cloudinary si elle existe
      if (sector.image) {
        const oldPublicId = CloudinaryService.extractPublicIdFromUrl(
          sector.image
        );
        if (oldPublicId) {
          await CloudinaryService.deleteFile(oldPublicId, "image");
        }
      }

      updateData.image = uploadResult.secureUrl;
      updateData.imageWidth = uploadResult.width || 0;
      updateData.imageHeight = uploadResult.height || 0;
    } else if (removeImage) {
      // L'utilisateur veut supprimer l'image actuelle
      if (sector.image) {
        const oldPublicId = CloudinaryService.extractPublicIdFromUrl(
          sector.image
        );
        if (oldPublicId) {
          await CloudinaryService.deleteFile(oldPublicId, "image");
        }
      }

      updateData.image = null;
      updateData.imageWidth = 0;
      updateData.imageHeight = 0;
    }

    // Mettre à jour le secteur
    const updatedSector = await prisma.sector.update({
      where: { id: sectorId },
      data: updateData,
    });

    return NextResponse.json(updatedSector);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du secteur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du secteur" },
      { status: 500 }
    );
  }
}

// Supprimer un secteur
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: sectorId } = await params;

    // Vérifier que le secteur existe et appartient à l'organisation de l'utilisateur
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
      include: {
        object: {
          include: { organization: true },
        },
        articles: {
          include: {
            tasks: {
              include: {
                documents: true,
                comments: true,
              },
            },
          },
        },
      },
    });

    if (!sector) {
      return NextResponse.json(
        { error: "Secteur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour supprimer ce secteur" },
        { status: 403 }
      );
    }

    // Collecter tous les fichiers à supprimer de Cloudinary
    const filesToDelete: Array<{
      publicId: string;
      resourceType: "image" | "raw";
    }> = [];

    // Image du secteur
    if (sector.image) {
      const publicId = CloudinaryService.extractPublicIdFromUrl(sector.image);
      if (publicId) {
        filesToDelete.push({ publicId, resourceType: "image" });
      }
    }

    // Documents des tâches
    for (const article of sector.articles) {
      for (const task of article.tasks) {
        for (const document of task.documents) {
          const publicId = CloudinaryService.extractPublicIdFromUrl(
            document.filePath
          );
          if (publicId) {
            const resourceType = document.fileType.startsWith("image/")
              ? "image"
              : "raw";
            filesToDelete.push({ publicId, resourceType });
          }
        }
      }
    }

    // Supprimer en cascade dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer tous les documents liés aux tâches
      for (const article of sector.articles) {
        for (const task of article.tasks) {
          if (task.documents.length > 0) {
            await tx.document.deleteMany({
              where: { taskId: task.id },
            });
          }

          // Supprimer les commentaires
          if (task.comments.length > 0) {
            await tx.comment.deleteMany({
              where: { taskId: task.id },
            });
          }
        }

        // Supprimer les tâches de l'article
        await tx.task.deleteMany({
          where: { articleId: article.id },
        });
      }

      // Supprimer les articles du secteur
      await tx.article.deleteMany({
        where: { sectorId: sectorId },
      });

      // Supprimer le secteur
      await tx.sector.delete({
        where: { id: sectorId },
      });
    });

    // Supprimer les fichiers de Cloudinary après la suppression en base
    if (filesToDelete.length > 0) {
      try {
        await Promise.all(
          filesToDelete.map(({ publicId, resourceType }) =>
            CloudinaryService.deleteFile(publicId, resourceType)
          )
        );
      } catch (cloudinaryError) {
        console.error(
          "Erreur lors de la suppression des fichiers Cloudinary:",
          cloudinaryError
        );
        // On continue même si la suppression Cloudinary échoue
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du secteur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du secteur" },
      { status: 500 }
    );
  }
}
