import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        valid: false,
        error: "Code d'invitation manquant",
      },
      { status: 400 }
    );
  }

  try {
    // Vérifier si le code est valide
    const invitation = await prisma.invitationCode.findFirst({
      where: {
        code,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: { organization: true },
    });

    if (!invitation) {
      return NextResponse.json({
        valid: false,
        error: "Code d'invitation invalide ou expiré",
      });
    }

    return NextResponse.json({
      valid: true,
      organizationName: invitation.organization.name,
      role: invitation.role,
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    console.error("Erreur lors de la validation de l'invitation:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Erreur lors de la validation",
      },
      { status: 500 }
    );
  }
}
