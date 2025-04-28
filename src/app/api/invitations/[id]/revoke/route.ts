import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifiez si l'utilisateur est admin
  const userOrg = await prisma.organizationUser.findFirst({
    where: { userId: user.id, role: "admin" },
  });

  if (!userOrg) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const invitationId = await params.id;

  // Vérifiez que l'invitation appartient à l'organisation de l'utilisateur
  const invitation = await prisma.invitationCode.findFirst({
    where: {
      id: invitationId,
      organizationId: userOrg.organizationId,
    },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Invitation non trouvée" },
      { status: 404 }
    );
  }

  // Supprimez l'invitation
  await prisma.invitationCode.delete({
    where: { id: invitationId },
  });

  return NextResponse.json({ success: true });
}
