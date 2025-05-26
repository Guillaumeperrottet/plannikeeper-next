import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, email, password, name } = await req.json();

    console.log("🔐 NOUVEAU FLUX: Acceptation invitation sécurisée:", {
      inviteCode,
      email,
      name,
    });

    // Validation des données
    if (!inviteCode || !email || !password || !name) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Transaction atomique complète
    const result = await prisma.$transaction(async (tx) => {
      // 1. Valider l'invitation
      const invitation = await tx.invitationCode.findFirst({
        where: {
          code: inviteCode,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        include: { organization: true },
      });

      if (!invitation) {
        throw new Error("Code d'invitation invalide ou expiré");
      }

      // 2. Vérifier que l'email n'existe pas déjà
      const existingUser = await tx.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        throw new Error("Un compte avec cet email existe déjà");
      }

      // 3. Créer l'utilisateur (VERIFIED directement)
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          emailVerified: true, // ✅ DIRECTEMENT VÉRIFIÉ
          organizationId: invitation.organizationId,
          metadata: {
            inviteCode,
            invitedBy: invitation.createdBy,
            invitedAt: new Date().toISOString(),
            acceptedAt: new Date().toISOString(),
            directVerification: true, // Flag pour indiquer vérification directe
          },
        },
      });

      // 4. Créer le compte d'authentification
      const hashedPassword = await bcrypt.hash(password, 12);
      await tx.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 5. Créer l'association OrganizationUser
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      // 6. Créer les accès par défaut aux objets
      const objects = await tx.objet.findMany({
        where: { organizationId: invitation.organizationId },
        select: { id: true },
      });

      if (objects.length > 0) {
        const accessLevel = invitation.role === "admin" ? "admin" : "read";
        const accessData = objects.map((obj) => ({
          userId: user.id,
          objectId: obj.id,
          accessLevel,
        }));

        await tx.objectAccess.createMany({
          data: accessData,
          skipDuplicates: true,
        });
      }

      // 7. Marquer l'invitation comme utilisée
      await tx.invitationCode.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      });

      return { user, organization: invitation.organization };
    });

    // 8. Créer la session utilisateur avec Better Auth
    const session = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
      },
    });

    if (!session || "error" in session) {
      throw new Error("Erreur lors de la création de la session");
    }

    console.log("✅ Invitation acceptée et session créée avec succès");

    // 9. Réponse avec redirection
    return NextResponse.json({
      success: true,
      message: "Compte créé et connecté avec succès",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        organizationName: result.organization.name,
        role: (
          await prisma.organizationUser.findFirst({
            where: { userId: result.user.id },
          })
        )?.role,
      },
      redirect: "/dashboard",
    });
  } catch (error) {
    console.error("❌ Erreur acceptation invitation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création du compte",
      },
      { status: 500 }
    );
  }
}
