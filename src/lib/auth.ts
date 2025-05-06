import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PlanType, PrismaClient } from "@prisma/client";
import { createAuthMiddleware } from "better-auth/api";
import { EmailService } from "@/lib/email";

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,

  // Origines autorisées - Simplifier en prod
  trustedOrigins: isProd
    ? ["https://plannikeeper-next.vercel.app", "*"]
    : [
        "https://plannikeeper-next.vercel.app",
        "http://localhost:3000",
        "127.0.0.1:3000",
      ],

  emailAndPassword: { enabled: true },

  advanced: {
    // Simplifier la configuration des cookies pour la production
    defaultCookieAttributes: {
      sameSite: isProd ? "lax" : "lax", // Changé de "none" à "lax"
      secure: isProd,
      domain: undefined, // Retirer le domain pour éviter les problèmes
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
    },

    cookies: {
      session_token: {
        name: "plannikeeper_session_token",
        attributes: {
          sameSite: isProd ? "lax" : "lax",
          secure: isProd,
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          httpOnly: true,
        },
      },
    },

    cookiePrefix: "better-auth",
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      try {
        if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
          const userId = ctx.context.newSession.user.id;
          const inviteCode = ctx.context.meta?.inviteCode as string | undefined;
          const planType = (ctx.context.meta?.planType as string) || "FREE";

          if (!inviteCode) {
            // Vérifier si l'organisation existe déjà pour l'utilisateur
            const existingOrg = await prisma.user.findUnique({
              where: { id: userId },
              include: { Organization: true },
            });

            if (!existingOrg?.Organization) {
              // Créer l'organisation et associer l'utilisateur
              const organization = await prisma.organization.create({
                data: { name: "Mon Organisation" },
              });

              // Créer l'enregistrement OrganizationUser
              await prisma.organizationUser.create({
                data: {
                  userId,
                  organizationId: organization.id,
                  role: "admin",
                },
              });

              // Mettre à jour l'utilisateur avec l'ID de l'organisation
              await prisma.user.update({
                where: { id: userId },
                data: { organizationId: organization.id },
              });

              // Récupérer le plan choisi
              const plan = await prisma.plan.findUnique({
                where: { name: planType as PlanType },
              });

              // Si plan gratuit ou inexistant, créer abonnement gratuit
              if (planType === "FREE" || !plan) {
                const freePlan = await prisma.plan.findUnique({
                  where: { name: "FREE" },
                });

                if (freePlan) {
                  await prisma.subscription.create({
                    data: {
                      organizationId: organization.id,
                      planId: freePlan.id,
                      status: "ACTIVE",
                      currentPeriodStart: new Date(),
                      currentPeriodEnd: new Date(
                        Date.now() + 365 * 24 * 60 * 60 * 1000
                      ), // 1 an
                      cancelAtPeriodEnd: false,
                    },
                  });
                }
              } else {
                // Si plan payant, rediriger vers la page de paiement après connexion
                // Cette information sera utilisée à la prochaine étape
                await prisma.user.update({
                  where: { id: userId },
                  data: {
                    metadata: { pendingPlanUpgrade: planType },
                  },
                });
              }

              // Envoyer l'email de bienvenue après la création de l'organisation
              try {
                const user = await prisma.user.findUnique({
                  where: { id: userId },
                });

                if (user) {
                  await EmailService.sendWelcomeEmail(user, organization.name);
                  console.log(`Email de bienvenue envoyé à ${user.email}`);
                } else {
                  console.error(
                    "Utilisateur non trouvé pour l'envoi de l'email de bienvenue"
                  );
                }
              } catch (emailError) {
                console.error(
                  "Erreur lors de l'envoi de l'email de bienvenue:",
                  emailError
                );
                // Ne pas interrompre le flux d'inscription en cas d'erreur
              }
            }
          }
        }
      } catch (error) {
        console.error("Erreur dans le hook after signup:", error);
        // Ne pas interrompre le flux d'inscription en cas d'erreur
      }
    }),
  },
});
