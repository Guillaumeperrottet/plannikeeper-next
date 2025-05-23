// src/lib/auth.ts - Version compatible avec Better Auth actuel
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { EmailService } from "./email";
import { PlanType } from "@prisma/client";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

// Fonction utilitaire pour valider et normaliser le type de plan
function validatePlanType(planType: string): PlanType {
  const validPlans: PlanType[] = [
    "FREE",
    "PERSONAL",
    "PROFESSIONAL",
    "ENTERPRISE",
    "SUPER_ADMIN",
    "ILLIMITE",
    "CUSTOM",
  ];
  return validPlans.includes(planType as PlanType)
    ? (planType as PlanType)
    : "FREE";
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: isDev
    ? "http://localhost:3000/api/auth"
    : `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`,
  trustedOrigins: isDev
    ? ["http://localhost:3000", "localhost:3000", "127.0.0.1:3000"]
    : [
        "https://plannikeeper-next.vercel.app",
        "*",
        "https://www.plannikeeper.ch",
      ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true, // Connexion automatique après vérification de l'email
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log(
        "📧 Envoi d'email de vérification à:",
        user.email,
        "avec URL:",
        url
      );
      const name = user.name || user.email.split("@")[0];
      const subject = "Finalisez votre inscription à PlanniKeeper";
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset=\"utf-8\">
          <title>Finalisez votre inscription</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #d9840d; color: white; padding: 24px; text-align: center; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; background-color: #d9840d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class=\"container\">
            <div class=\"header\">
              <h1>🏠 PlanniKeeper</h1>
              <h2>Finaliser votre inscription</h2>
            </div>
            <div class=\"content\">
              <p>Bonjour ${name},</p>
              <p>Merci de votre intérêt pour PlanniKeeper ! Pour finaliser votre inscription et activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              <div style=\"text-align: center; margin: 30px 0;\">
                <a href=\"${url}\" class=\"button\">
                  Activer mon compte
                </a>
              </div>
              <p><strong>Important :</strong> Ce lien expire dans 24 heures.</p>
            </div>
            <div class=\"footer\">
              <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
      `;
      await EmailService.sendEmail({
        to: user.email,
        subject,
        html,
      });
      console.log("✅ Email de vérification envoyé avec succès à:", user.email);
    },
  },

  hooks: {
    // Utilisation du hook 'after' au lieu de hooks spécifiques
    after: async (inputContext) => {
      // Correction : accès explicite aux propriétés du contexte sans utiliser 'any'
      const path =
        ((inputContext as Record<string, unknown>)["path"] as string) ||
        ((
          (inputContext as Record<string, unknown>)["req"] as Record<
            string,
            unknown
          >
        )?.["path"] as string) ||
        ((
          (inputContext as Record<string, unknown>)["req"] as Record<
            string,
            unknown
          >
        )?.["url"] as string) ||
        "";
      const returned = (inputContext as Record<string, unknown>)["returned"] as
        | Record<string, unknown>
        | undefined;

      console.log("🔄 Hook after déclenché pour path:", path);

      // 1. Hook équivalent à afterSignUp
      if (path.includes("sign-up")) {
        try {
          if (returned && typeof returned === "object" && "user" in returned) {
            const user = returned["user"] as {
              id: string;
              email: string;
              name?: string;
            };
            console.log("📝 Traitement inscription pour:", user.email);

            // Extraire les données depuis metadata ou userOptions
            let metadata: Record<string, unknown> = {};
            let inviteCode: string | undefined,
              planType: string | undefined,
              image: string | undefined;

            if ("metadata" in returned && returned["metadata"]) {
              metadata = returned["metadata"] as Record<string, unknown>;
            } else if ("userOptions" in returned && returned["userOptions"]) {
              metadata = returned["userOptions"] as Record<string, unknown>;
            }

            if (typeof metadata === "object" && metadata !== null) {
              inviteCode =
                typeof metadata["inviteCode"] === "string"
                  ? (metadata["inviteCode"] as string)
                  : undefined;
              planType =
                typeof metadata["planType"] === "string"
                  ? (metadata["planType"] as string)
                  : "FREE";
              image =
                typeof metadata["image"] === "string"
                  ? (metadata["image"] as string)
                  : undefined;
            }

            if (inviteCode) {
              // Cas d'une invitation - l'utilisateur rejoindra une organisation existante
              console.log("🔗 Traitement avec code d'invitation:", inviteCode);
              const invitation = await prisma.invitationCode.findFirst({
                where: {
                  code: String(inviteCode),
                  isUsed: false,
                  expiresAt: { gt: new Date() },
                },
                include: { organization: true },
              });

              if (invitation) {
                // IMPORTANT: Associer l'utilisateur à l'organisation de l'invitation
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    organizationId: invitation.organizationId,
                    metadata: { inviteCode, image, joinedViaInvitation: true },
                  },
                });

                console.log(
                  "👤 Utilisateur associé à l'organisation via invitation:",
                  invitation.organizationId,
                  "- Organisation:",
                  invitation.organization.name
                );
                // Vérifier si l'invitation ajoute déjà l'utilisateur à l'organisation
                const existingOrgUser = await prisma.organizationUser.findFirst(
                  {
                    where: {
                      userId: user.id,
                      organizationId: invitation.organizationId,
                    },
                  }
                );
                // Si l'association n'existe pas encore, la créer
                if (!existingOrgUser) {
                  await prisma.organizationUser.create({
                    data: {
                      userId: user.id,
                      organizationId: invitation.organizationId,
                      role: invitation.role,
                    },
                  });
                  console.log(
                    "✅ Association utilisateur-organisation créée directement avec rôle:",
                    invitation.role
                  );
                }
              } else {
                console.warn(
                  "⚠️ Code d'invitation invalide ou expiré:",
                  inviteCode
                );
              }
            } else {
              // Cas d'un nouvel utilisateur - créer une nouvelle organisation
              console.log(
                "🆕 Création d'une nouvelle organisation pour:",
                user.email
              );

              const organization = await prisma.organization.create({
                data: {
                  name: `${user.name || user.email.split("@")[0]}'s Organization`,
                },
              });

              await prisma.user.update({
                where: { id: user.id },
                data: {
                  organizationId: organization.id,
                  metadata: { planType, image },
                },
              });

              console.log(
                "🏢 Organisation créée avec succès:",
                organization.id
              );
            }
          }
        } catch (error) {
          console.error("❌ Erreur dans hook après inscription:", error);
        }
      }

      // 2. Hook équivalent à afterEmailVerified
      else if (path.includes("verify-email")) {
        try {
          if (returned && typeof returned === "object" && "user" in returned) {
            const user = returned["user"] as {
              id: string;
              email: string;
              name?: string;
            };
            console.log("🔍 Vérification email réussie pour:", user.email);

            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                Organization: true,
              },
            });

            const metadata: Record<string, unknown> =
              dbUser?.metadata && typeof dbUser.metadata === "object"
                ? (dbUser.metadata as Record<string, unknown>)
                : {};
            const inviteCode =
              typeof metadata["inviteCode"] === "string"
                ? (metadata["inviteCode"] as string)
                : undefined;

            if (inviteCode) {
              const invitation = await prisma.invitationCode.findFirst({
                where: {
                  code: String(inviteCode),
                  isUsed: false,
                  expiresAt: { gt: new Date() },
                },
              });

              if (invitation) {
                await prisma.invitationCode.update({
                  where: { id: invitation.id },
                  data: { isUsed: true },
                });

                await prisma.organizationUser.create({
                  data: {
                    userId: user.id,
                    organizationId: invitation.organizationId,
                    role: invitation.role,
                  },
                });

                console.log("✅ Invitation finalisée pour:", user.email);
              }
            } else if (dbUser?.Organization) {
              await prisma.organizationUser.create({
                data: {
                  userId: user.id,
                  organizationId: dbUser.Organization.id,
                  role: "admin",
                },
              });

              const planType =
                typeof metadata["planType"] === "string"
                  ? (metadata["planType"] as string)
                  : "FREE";
              const validatedPlanType = validatePlanType(planType || "FREE");

              let plan = await prisma.plan.findFirst({
                where: { name: validatedPlanType },
              });

              if (!plan) {
                plan = await prisma.plan.findFirst({
                  where: { name: "FREE" as PlanType },
                });
              }

              if (plan) {
                await prisma.subscription.create({
                  data: {
                    organizationId: dbUser.Organization.id,
                    planId: plan.id,
                    status: "ACTIVE",
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(
                      Date.now() + 365 * 24 * 60 * 60 * 1000
                    ),
                  },
                });

                console.log("💰 Abonnement créé avec plan:", plan.name);
              }
            } else {
              // 3. Mécanisme de récupération - si l'organisation n'a pas été créée
              console.log(
                "⚠️ Organisation manquante, tentative de récupération"
              );

              const organization = await prisma.organization.create({
                data: {
                  name: `${user.name || user.email.split("@")[0]}'s Organization`,
                },
              });

              await prisma.user.update({
                where: { id: user.id },
                data: { organizationId: organization.id },
              });

              await prisma.organizationUser.create({
                data: {
                  userId: user.id,
                  organizationId: organization.id,
                  role: "admin",
                },
              });

              const freePlan = await prisma.plan.findFirst({
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
                    ),
                  },
                });
              }

              console.log(
                "🔄 Organisation récupérée avec succès:",
                organization.id
              );
            }

            // 4. Envoyer l'email de bienvenue
            await sendWelcomeEmailAfterVerification(user);
          }
        } catch (error) {
          console.error("❌ Erreur dans hook après vérification email:", error);
        }
      }

      return {};
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: isDev ? "lax" : "none",
      secure: !isDev,
      domain: isDev ? "localhost" : undefined,
      maxAge: 60 * 60 * 4,
      httpOnly: true,
      path: "/",
    },
  },
});

// Fonction pour envoyer l'email de bienvenue après vérification
async function sendWelcomeEmailAfterVerification(user: {
  id: string;
  email: string;
  name?: string;
}) {
  try {
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (userWithOrg?.Organization) {
      await EmailService.sendWelcomeEmail(
        userWithOrg,
        userWithOrg.Organization.name
      );
      console.log("✅ Email de bienvenue envoyé à:", user.email);
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}
