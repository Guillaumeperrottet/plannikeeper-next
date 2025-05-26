// src/app/api/invitations/accept/route.ts - VERSION CORRIGÉE FINALE
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, email, password, name } = await req.json();

    console.log("🎯 Acceptation invitation:", { inviteCode, email, name });

    // Validation des données
    if (!inviteCode || !email || !password || !name) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

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
      console.log("❌ Invitation invalide:", { inviteCode });
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
      console.log("❌ Email déjà utilisé:", email);
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // 3. CORRECTION PRINCIPALE : Transaction atomique avec structure Better Auth correcte
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur - MARQUER COMME VÉRIFIÉ
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          emailVerified: true, // ✅ Pas besoin de vérification email
          organizationId: invitation.organizationId,
          metadata: {
            inviteCode,
            invitedBy: invitation.createdBy,
            invitedAt: new Date().toISOString(),
            acceptedAt: new Date().toISOString(),
          },
        },
      });

      console.log("✅ Utilisateur créé:", { id: user.id, email: user.email });

      // CORRECTION CRITIQUE : Créer le compte d'authentification avec la structure Better Auth
      const hashedPassword = await bcrypt.hash(password, 12);
      const accountId = crypto.randomUUID();

      await tx.account.create({
        data: {
          id: accountId,
          userId: user.id,
          accountId: user.id, // ✅ IMPORTANT : accountId = userId pour Better Auth
          providerId: "credential", // ✅ Correct pour Better Auth email/password
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("✅ Compte d'authentification créé");

      // Créer l'association OrganizationUser
      await tx.organizationUser.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      console.log("✅ Association OrganizationUser créée:", invitation.role);

      // Créer les accès par défaut aux objets existants
      const objects = await tx.objet.findMany({
        where: { organizationId: invitation.organizationId },
        select: { id: true, nom: true },
      });

      if (objects.length > 0) {
        const accessLevel = invitation.role === "admin" ? "admin" : "read";

        const accessPromises = objects.map((object) =>
          tx.objectAccess.create({
            data: {
              userId: user.id,
              objectId: object.id,
              accessLevel,
            },
          })
        );

        await Promise.all(accessPromises);
        console.log(
          `✅ Accès ${accessLevel} créés pour ${objects.length} objets`
        );
      }

      // Marquer l'invitation comme utilisée
      await tx.invitationCode.update({
        where: { id: invitation.id },
        data: { isUsed: true },
      });

      console.log("✅ Invitation marquée comme utilisée");

      return user;
    });

    // 4. CORRECTION : Créer une session compatible Better Auth
    const sessionToken = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 heures

    await prisma.session.create({
      data: {
        id: sessionId,
        token: sessionToken,
        userId: result.id,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    console.log("✅ Session créée:", { sessionId, expiresAt });

    // 5. CORRECTION : Créer la réponse avec cookies Better Auth compatibles
    const response = NextResponse.json({
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
      timestamp: new Date().toISOString(),
    });

    // 6. CORRECTION : Définir les cookies avec les bonnes options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 4 * 60 * 60, // 4 heures
      path: "/",
    };

    // Cookie principal Better Auth (nom exact)
    response.cookies.set(
      "better-auth.session_token",
      sessionToken,
      cookieOptions
    );

    // Cookie de sauvegarde
    response.cookies.set("session", sessionToken, cookieOptions);

    console.log("✅ Cookies de session définis");
    console.log("🎉 Invitation acceptée avec succès pour:", result.email);

    return response;
  } catch (error) {
    console.error("❌ Erreur acceptation invitation:", error);

    // Log détaillé pour debug
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la création du compte",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Erreur inconnue"
            : undefined,
      },
      { status: 500 }
    );
  }
}

// BONUS: Route pour debug (à supprimer en production)
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Route de debug uniquement" },
      { status: 404 }
    );
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Paramètre email requis" },
      { status: 400 }
    );
  }

  try {
    // Récupérer les informations de l'utilisateur pour debug
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true,
        OrganizationUser: {
          include: { organization: true },
        },
      },
    });

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
            organizationId: user.organizationId,
            hasAccount: user.accounts.length > 0,
            accountProviderId: user.accounts[0]?.providerId,
            hasSession: user.sessions.length > 0,
            organization: user.OrganizationUser?.organization?.name,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur debug", details: String(error) },
      { status: 500 }
    );
  }
}
