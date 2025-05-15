import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "./prisma";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,

  // URL pour l'API d'authentification - utilisez celle de .env.local en dev
  baseURL: isDev
    ? "http://localhost:3000/api/auth"
    : process.env.BETTER_AUTH_URL,

  trustedOrigins: isDev
    ? ["http://localhost:3000", "localhost:3000", "127.0.0.1:3000"]
    : ["https://plannikeeper-next.vercel.app", "*"],

  emailAndPassword: { enabled: true },

  advanced: {
    defaultCookieAttributes: {
      // En dev ou mode local, toujours lax et HTTP
      sameSite: isDev ? "lax" : "none",
      secure: !isDev, // Important: false en dev, true en prod
      domain: isDev ? "localhost" : undefined,
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      httpOnly: true,
      path: "/",
    },

    cookies: {
      session_token: {
        name: "session", // Garder ce nom cohérent
        attributes: {
          sameSite: isDev ? "lax" : "none",
          secure: !isDev, // CRITIQUE: false en dev
          path: "/",
          domain: isDev ? "localhost" : undefined,
          maxAge: 60 * 60 * 24 * 30,
          httpOnly: true,
        },
      },
    },

    cookiePrefix: "",
  },

  // Le reste de votre configuration
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      console.log("Auth hook after triggered", {
        path: ctx.path,
        method: ctx.method,
        newSession: !!ctx.context.newSession,
        user: ctx.context.newSession?.user?.id,
      });

      try {
        if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
          // Votre logique existante
        }
      } catch (error) {
        console.error("Erreur dans le hook after signup:", error);
      }
    }),
    before: createAuthMiddleware(async (ctx) => {
      console.log("Auth hook before triggered", {
        path: ctx.path,
        method: ctx.method,
      });
      return ctx;
    }),
  },
});
