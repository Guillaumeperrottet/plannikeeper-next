import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { createAuthMiddleware } from "better-auth/api";

const prisma = new PrismaClient();

console.log("betterAuth config loaded");

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Vérifie que l'utilisateur vient d'être créé
      if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
        const userId = ctx.context.newSession.user.id;
        const organization = await prisma.organization.create({
          data: { name: "Mon Organisation" },
        });
      // Ajoute l'utilisateur comme admin de l'organisation
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
    }),
  },
});
