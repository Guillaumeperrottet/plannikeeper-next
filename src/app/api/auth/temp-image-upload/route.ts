// src/app/api/auth/temp-image-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CloudinaryService } from "@/lib/cloudinary";
import crypto from "crypto";

/**
 * Route temporaire pour l'upload d'images de profil pendant l'inscription
 * Cette route ne nécessite pas d'authentification, mais utilise un jeton temporaire
 * pour limiter les abus.
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier le rate limiting (optionnel mais recommandé en production)

    // Recevoir le fichier depuis le formData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Valider le type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Type de fichier non pris en charge. Seuls les formats JPG, PNG et WebP sont acceptés.",
        },
        { status: 400 }
      );
    }

    // Valider la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 5MB)" },
        { status: 400 }
      );
    }

    // Lire le fichier
    const buffer = Buffer.from(await file.arrayBuffer());

    // Générer un ID temporaire unique pour cet utilisateur en cours d'inscription
    const tempUserId = crypto.randomBytes(16).toString("hex");

    // Upload vers Cloudinary avec un dossier spécial pour les uploads temporaires
    const uploadResult = await CloudinaryService.uploadFile(buffer, file.name, {
      folder: `plannikeeper/temp_signup/${tempUserId}`,
      resourceType: "image",
      tags: ["profile", "temp_signup"],
      // Optimiser l'image
      transformation: {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        fetch_format: "auto",
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secureUrl,
      tempId: tempUserId,
    });
  } catch (error) {
    console.error("Erreur lors du traitement de l'image de profil:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
