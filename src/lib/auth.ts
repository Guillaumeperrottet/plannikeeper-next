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
    after: async (inputContext) => {
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
              image: string | undefined,
              organizationId: string | undefined;

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
              organizationId =
                typeof metadata["organizationId"] === "string"
                  ? (metadata["organizationId"] as string)
                  : undefined;
            }

            // Enregistrer systématiquement les informations importantes comme métadonnées
            await prisma.user.update({
              where: { id: user.id },
              data: {
                metadata: {
                  inviteCode,
                  organizationId,
                  planType,
                  image,
                  signupPath: path,
                  signupTimestamp: new Date().toISOString(),
                },
              },
            });

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
                // Associer l'utilisateur à l'organisation de l'invitation
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    organizationId: invitation.organizationId,
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
                // Ne pas marquer l'invitation comme utilisée maintenant, mais après vérification email
              }
            } else if (organizationId) {
              // Traitement spécifique pour organizationId explicite (cas de l'API directe)
              console.log(
                "🆔 OrganizationId spécifié directement:",
                organizationId
              );
              const organization = await prisma.organization.findUnique({
                where: { id: organizationId },
              });
              if (organization) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { organizationId },
                });
                console.log(
                  "👤 Utilisateur associé directement à l'organisation:",
                  organizationId
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
                data: { organizationId: organization.id },
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
              include: { Organization: true },
            });

            // Extraire les métadonnées
            const metadata: Record<string, unknown> =
              dbUser?.metadata && typeof dbUser.metadata === "object"
                ? (dbUser.metadata as Record<string, unknown>)
                : {};

            const inviteCode =
              typeof metadata["inviteCode"] === "string"
                ? (metadata["inviteCode"] as string)
                : undefined;
            const organizationId =
              typeof metadata["organizationId"] === "string"
                ? (metadata["organizationId"] as string)
                : undefined;

            console.log("🔄 Métadonnées utilisateur:", {
              metadata,
              inviteCode,
              organizationId,
              hasOrg: !!dbUser?.Organization,
            });

            if (inviteCode) {
              console.log(
                "🔍 Recherche de l'invitation avec code:",
                inviteCode
              );
              const invitation = await prisma.invitationCode.findFirst({
                where: {
                  code: String(inviteCode),
                  expiresAt: { gt: new Date() },
                },
                include: { organization: true },
              });

              if (invitation) {
                console.log("✅ Invitation trouvée:", {
                  orgId: invitation.organizationId,
                  orgName: invitation.organization.name,
                  role: invitation.role,
                  isUsed: invitation.isUsed,
                });
                // Marquer l'invitation comme utilisée
                await prisma.invitationCode.update({
                  where: { id: invitation.id },
                  data: { isUsed: true },
                });
                // Associer l'utilisateur à l'organisation si ce n'est pas déjà fait
                if (
                  !dbUser?.Organization ||
                  dbUser.Organization.id !== invitation.organizationId
                ) {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: { organizationId: invitation.organizationId },
                  });
                  console.log(
                    "👤 Utilisateur associé à l'organisation:",
                    invitation.organizationId
                  );
                }
                // Vérifier si l'association OrganizationUser existe déjà
                const existingOrgUser = await prisma.organizationUser.findFirst(
                  {
                    where: {
                      userId: user.id,
                      organizationId: invitation.organizationId,
                    },
                  }
                );
                if (!existingOrgUser) {
                  await prisma.organizationUser.create({
                    data: {
                      userId: user.id,
                      organizationId: invitation.organizationId,
                      role: invitation.role,
                    },
                  });
                  console.log(
                    "🔗 Association utilisateur-organisation créée avec rôle:",
                    invitation.role
                  );
                } else {
                  console.log(
                    "ℹ️ Association utilisateur-organisation existe déjà"
                  );
                }
              } else {
                console.warn(
                  "⚠️ Invitation non trouvée ou expirée:",
                  inviteCode
                );
                await createDefaultOrganizationForUser(user);
              }
            } else if (organizationId) {
              // Gérer le cas où l'organizationId est explicitement défini
              const organization = await prisma.organization.findUnique({
                where: { id: organizationId },
              });
              if (organization) {
                if (
                  !dbUser?.Organization ||
                  dbUser.Organization.id !== organizationId
                ) {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: { organizationId },
                  });
                }
                const existingOrgUser = await prisma.organizationUser.findFirst(
                  {
                    where: {
                      userId: user.id,
                      organizationId,
                    },
                  }
                );
                if (!existingOrgUser) {
                  await prisma.organizationUser.create({
                    data: {
                      userId: user.id,
                      organizationId,
                      role: "admin",
                    },
                  });
                }
                console.log(
                  "✅ Association utilisateur-organisation complétée pour organizationId spécifié"
                );
              } else {
                console.warn(
                  "⚠️ OrganizationId spécifié mais introuvable:",
                  organizationId
                );
                await createDefaultOrganizationForUser(user);
              }
            } else if (dbUser?.Organization) {
              // Cas d'un nouvel utilisateur avec une organisation déjà associée
              const existingOrgUser = await prisma.organizationUser.findFirst({
                where: {
                  userId: user.id,
                  organizationId: dbUser.Organization.id,
                },
              });
              if (!existingOrgUser) {
                await prisma.organizationUser.create({
                  data: {
                    userId: user.id,
                    organizationId: dbUser.Organization.id,
                    role: "admin",
                  },
                });
                console.log(
                  "✅ Association utilisateur-organisation créée pour propriétaire"
                );
              }
              const planType =
                typeof metadata["planType"] === "string"
                  ? (metadata["planType"] as string)
                  : "FREE";
              const validatedPlanType = validatePlanType(planType || "FREE");
              const existingSubscription = await prisma.subscription.findFirst({
                where: { organizationId: dbUser.Organization.id },
              });
              if (!existingSubscription) {
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
                  console.log("💰 Abonnement créé aavec plan:", plan.name);
                }
              }
            } else {
              // Mécanisme de récupération - si l'organisation n'a pas été créée
              await createDefaultOrganizationForUser(user);
            }

            // Vérification de l'état final
            const finalState = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                Organization: true,
                OrganizationUser: true,
              },
            });

            console.log("📊 État final de l'utilisateur:", {
              hasOrg: !!finalState?.Organization,
              orgId: finalState?.Organization?.id,
              hasOrgUser: !!finalState?.OrganizationUser,
              role: finalState?.OrganizationUser?.role,
            });

            // Envoyer l'email de bienvenue
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

// NOUVELLE FONCTION UTILITAIRE: Créer une organisation par défaut pour un utilisateur
async function createDefaultOrganizationForUser(user: {
  id: string;
  email: string;
  name?: string;
}) {
  console.log(
    "⚠️ Organisation manquante, création d'une organisation par défaut"
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
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log("🔄 Organisation par défaut créée avec succès:", organization.id);
  return organization;
}

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
