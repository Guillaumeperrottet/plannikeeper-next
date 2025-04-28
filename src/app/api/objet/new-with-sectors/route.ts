// src/app/api/objet/new-with-sectors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp"; // Ajoutez Sharp pour manipuler les images

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (!userDb?.Organization) {
      return NextResponse.json(
        { error: "Aucune organisation trouvée" },
        { status: 400 }
      );
    }

    // Créer un dossier pour les uploads si nécessaire
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    const formData = await req.formData();

    // Extraire les données principales de l'objet
    const nom = formData.get("nom") as string;
    const adresse = formData.get("adresse") as string;
    const secteur = formData.get("secteur") as string;
    const sectorsCount = parseInt(formData.get("sectorsCount") as string, 10);

    if (!nom || !adresse || !secteur) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // 1. Créer l'objet
    const objet = await prisma.objet.create({
      data: {
        nom,
        adresse,
        secteur,
        organizationId: userDb.Organization.id,
      },
    });

    // Après avoir créé l'objet, créer des entrées d'accès pour tous les membres non-admin
    const nonAdminUsers = await prisma.organizationUser.findMany({
      where: {
        organizationId: userDb.Organization.id,
        role: { not: "admin" },
      },
      select: { userId: true },
    });

    if (nonAdminUsers.length > 0) {
      await prisma.objectAccess.createMany({
        data: nonAdminUsers.map((ou) => ({
          userId: ou.userId,
          objectId: objet.id,
          accessLevel: "none",
        })),
      });
    }

    // Récupérer tous les utilisateurs de l'organisation qui ne sont pas admin
    const orgUsers = await prisma.organizationUser.findMany({
      where: {
        organizationId: userDb.Organization.id,
        role: { not: "admin" },
      },
      select: { userId: true },
    });

    // Créer des entrées d'accès "none" pour chaque utilisateur
    if (orgUsers.length > 0) {
      await prisma.objectAccess.createMany({
        data: orgUsers.map((ou) => ({
          userId: ou.userId,
          objectId: objet.id,
          accessLevel: "none",
        })),
      });
    }

    // 2. Traiter les secteurs
    const sectorsData = [];

    for (let i = 0; i < sectorsCount; i++) {
      const sectorName = formData.get(`sector_${i}_name`) as string;
      const sectorImage = formData.get(`sector_${i}_image`) as File;

      if (!sectorName || !sectorImage) {
        continue; // Ignorer les secteurs incomplets
      }

      // Générer un nom de fichier unique avec UUID
      const fileExtension = sectorImage.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      const publicPath = `/uploads/${fileName}`;

      // Lire l'image et obtenir ses dimensions
      const buffer = Buffer.from(await sectorImage.arrayBuffer());

      // Obtenir les dimensions de l'image avec sharp
      const imageMetadata = await sharp(buffer).metadata();
      const imageWidth = imageMetadata.width || 0;
      const imageHeight = imageMetadata.height || 0;

      // Écrire l'image dans le dossier public/uploads
      await writeFile(filePath, buffer);

      // Ajouter le secteur aux données à créer
      sectorsData.push({
        name: sectorName,
        image: publicPath,
        imageWidth,
        imageHeight,
        objectId: objet.id,
      });
    }

    // 3. Créer tous les secteurs
    if (sectorsData.length > 0) {
      await prisma.sector.createMany({
        data: sectorsData,
      });
    }

    // 4. Récupérer l'objet complet avec ses secteurs
    const objetAvecSecteurs = await prisma.objet.findUnique({
      where: { id: objet.id },
      include: { sectors: true },
    });

    return NextResponse.json(objetAvecSecteurs);
  } catch (error) {
    console.error("Erreur lors de la création de l'objet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'objet" },
      { status: 500 }
    );
  }
}
