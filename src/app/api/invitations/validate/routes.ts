import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

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
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    organizationName: invitation.organization.name,
    role: invitation.role,
  });
}
