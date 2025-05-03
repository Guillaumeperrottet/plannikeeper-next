// src/app/api/notifications/register-device/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { token, platform = "WEB" } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token non fourni" }, { status: 400 });
    }

    // Vérifier si le token existe déjà
    const existingToken = await prisma.deviceToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Mettre à jour le token existant
      await prisma.deviceToken.update({
        where: { id: existingToken.id },
        data: {
          userId: user.id,
          platform,
          isActive: true,
          lastActive: new Date(),
        },
      });
    } else {
      // Créer un nouveau token
      await prisma.deviceToken.create({
        data: {
          token,
          userId: user.id,
          platform,
          device: req.headers.get("user-agent") || undefined,
          isActive: true,
          lastActive: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du token:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du token" },
      { status: 500 }
    );
  }
}
