import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, email, password, name } = await req.json();

    console.log("🎯 Acceptation invitation:", { inviteCode, email, name });

    // 1. Valider l'invitation
    const invitation = await prisma.invitationCode.findFirst({
      where: {
        code: inviteCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { organization: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Code d'invitation invalide ou expiré" },
        { status: 400 }
      );
    }

    // 2. Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // 3. TRANSACTION ATOMIQUE pour éviter les états incohérents
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur - MARQUER COMME VÉRIFIÉ DIRECTEMENT
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          emailVerified: true, // ✅ PAS BESOIN DE VÉRIFICATION EMAIL
          organizationId: invitation.organizationId,
          metadata: {
            inviteCode,
            invitedBy: invitation.createdBy,
            invitedAt: new Date().toISOString(),
            acceptedAt: new Date().toISOString(),
          },
        },
      });

      // Créer le compte d'authentification
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

      // Créer l'association OrganizationUser
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      // Créer les accès par défaut aux objets
      const objects = await tx.objet.findMany({
        where: { organizationId: invitation.organizationId },
        select: { id: true },
      });

      if (objects.length > 0) {
        const accessLevel = invitation.role === "admin" ? "admin" : "read";
        await tx.objectAccess.createMany({
          data: objects.map((object) => ({
            userId: user.id,
            objectId: object.id,
            accessLevel,
          })),
          skipDuplicates: true,
        });
      }

      // Marquer l'invitation comme utilisée
      await tx.invitationCode.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      });

      return user;
    });

    // 4. CRÉER UNE SESSION PROPRE avec Better Auth
    const ctx = await auth.$context;

    // Créer une session via Better Auth (méthode correcte)
    const sessionData = await ctx.internalAdapter.createSession(
      result.id, // userId
      req.headers, // request headers
      false, // dontRememberMe
      {
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 heures
        ipAddress:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      } // override session data
    );

    // 5. Définir les cookies de session
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 4 * 60 * 60,
      path: "/",
    };

    cookieStore.set(
      "better-auth.session_token",
      sessionData.token,
      cookieOptions
    );

    console.log("✅ Invitation acceptée avec succès:", result.email);

    return NextResponse.json({
      success: true,
      message: "Compte créé et connecté avec succès",
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        organizationName: invitation.organization.name,
        role: invitation.role,
      },
      redirect: "/dashboard",
    });
  } catch (error) {
    console.error("❌ Erreur acceptation invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
