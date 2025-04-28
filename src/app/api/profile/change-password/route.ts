import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    // Validation des champs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error: "Le nouveau mot de passe doit contenir au moins 8 caractères",
        },
        { status: 400 }
      );
    }

    // Récupérer le compte utilisateur avec son mot de passe hashé
    // Nous cherchons le compte de type "credentials" ou celui qui a un mot de passe
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        // Soit un compte avec providerId="credentials" (si vous utilisez ce fournisseur)
        // soit tout compte avec un mot de passe non-null
        OR: [{ providerId: "credentials" }, { password: { not: null } }],
      },
      select: {
        id: true,
        password: true,
        providerId: true,
      },
    });

    if (!account || !account.password) {
      return NextResponse.json(
        {
          error:
            "Aucun compte avec authentification par mot de passe trouvé pour cet utilisateur",
        },
        { status: 404 }
      );
    }

    // Vérifier si le mot de passe actuel est correct
    const passwordValid = await compare(currentPassword, account.password);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 403 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedNewPassword,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}
