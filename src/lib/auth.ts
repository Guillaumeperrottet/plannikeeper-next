import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { createAuthMiddleware } from "better-auth/api";

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,

  // Origines autorisées
  trustedOrigins: isProd
    ? ["https://plannikeeper-next.vercel.app"]
    : [
        "https://plannikeeper-next.vercel.app",
        "http://localhost:3000",
        "127.0.0.1:3000",
      ],

  emailAndPassword: { enabled: true },

  // Passage des options avancées, dont les cookies
  advanced: {
    // Appliquer ces attributs à TOUS les cookies
    defaultCookieAttributes: {
      sameSite: isProd ? "none" : "lax",
      secure: isProd, // true en prod (HTTPS), false en dev
      domain: isProd ? ".plannikeeper-next.vercel.app" : undefined, // pas de domain en local
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      httpOnly: true,
    },

    // (Optionnel) Surcharge pour chaque cookie individuellement
    cookies: {
      // par exemple pour renommer ou personnaliser un cookie spécifique
      session_token: {
        name: "plannikeeper_session_token", // nouveau nom si besoin
        attributes: {
          sameSite: isProd ? "none" : "lax",
          secure: isProd,
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          httpOnly: true,
        },
      },
      // tu peux ajouter d'autres cookies (session_data, dont_remember…) ici
    },

    // (Optionnel) Préfixe commun pour tous tes cookies
    cookiePrefix: "better-auth",
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
        const userId = ctx.context.newSession.user.id;
        const inviteCode = ctx.context.meta?.inviteCode as string | undefined;

        if (!inviteCode) {
          // Création d'une org si pas d'invitation
          const organization = await prisma.organization.create({
            data: { name: "Mon Organisation" },
          });
          await prisma.organizationUser.create({
            data: {
              userId,
              organizationId: organization.id,
              role: "admin",
            },
          });
          await prisma.user.update({
            where: { id: userId },
            data: { organizationId: organization.id },
          });
        }
      }
    }),
  },
});
