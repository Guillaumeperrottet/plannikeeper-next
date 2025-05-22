// src/app/api/auth/verify-email-custom/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Stockage temporaire (même que dans auth.ts)
const pendingUsers = new Map<
  string,
  {
    email: string;
    name: string;
    password: string;
    image?: string;
    inviteCode?: string;
    planType?: string;
    token: string;
    expiresAt: Date;
  }
>();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const email = url.searchParams.get("email");
    const callbackURL = url.searchParams.get("callbackURL");

    if (!token || !email) {
      console.error("❌ Token ou email manquant");
      return NextResponse.redirect(
        new URL("/auth/verification-failed", req.url)
      );
    }

    console.log("🔍 Vérification du token pour:", email);

    // Vérifier si les données temporaires existent
    const pendingUser = pendingUsers.get(email);

    if (!pendingUser) {
      console.error("❌ Aucune donnée temporaire trouvée pour:", email);
      return NextResponse.redirect(
        new URL("/auth/verification-failed?error=expired", req.url)
      );
    }

    // Vérifier le token
    if (pendingUser.token !== token) {
      console.error("❌ Token invalide pour:", email);
      return NextResponse.redirect(
        new URL("/auth/verification-failed?error=invalid", req.url)
      );
    }

    // Vérifier l'expiration
    if (pendingUser.expiresAt < new Date()) {
      console.error("❌ Token expiré pour:", email);
      pendingUsers.delete(email);
      return NextResponse.redirect(
        new URL("/auth/verification-failed?error=expired", req.url)
      );
    }

    console.log("✅ Token valide, création de l'utilisateur");

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("👤 Utilisateur existe déjà, connexion directe");
      pendingUsers.delete(email);

      // L'utilisateur existe déjà, rediriger simplement
      if (callbackURL) {
        return NextResponse.redirect(callbackURL);
      }
      return NextResponse.redirect(
        new URL("/auth/verification-success", req.url)
      );
    }

    // Créer l'utilisateur avec Better Auth
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: pendingUser.email,
          name: pendingUser.name,
          password: pendingUser.password,
        },
      });

      if (!result.token) {
        console.error(
          "❌ Erreur création utilisateur: token manquant ou invalide",
          result
        );
        return NextResponse.redirect(
          new URL("/auth/verification-failed?error=creation", req.url)
        );
      }

      console.log("✅ Utilisateur créé avec succès");

      // Les hooks Better Auth vont se déclencher automatiquement
      // pour créer l'organisation

      // Nettoyer les données temporaires
      pendingUsers.delete(email);

      // Rediriger vers la page de succès
      if (callbackURL) {
        return NextResponse.redirect(callbackURL);
      }

      return NextResponse.redirect(
        new URL("/auth/verification-success", req.url)
      );
    } catch (error) {
      console.error("❌ Exception création utilisateur:", error);
      return NextResponse.redirect(
        new URL("/auth/verification-failed?error=server", req.url)
      );
    }
  } catch (error) {
    console.error("❌ Erreur dans verify-email-custom:", error);
    return NextResponse.redirect(new URL("/auth/verification-failed", req.url));
  }
}
