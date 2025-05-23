// src/lib/auth.ts - Version corrigée pour inscription avec vérification email préalable
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { EmailService } from "./email";
import { PlanType } from "@prisma/client";

// Types pour Better Auth context

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
    : ["https://plannikeeper-next.vercel.app", "*"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
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
                <p>Merci de votre intérêt pour PlanniKeeper ! Pour finaliser votre inscription et créer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
                <div style=\"text-align: center; margin: 30px 0;\">
                  <a href=\"${url}\" class=\"button\">
                    Créer mon compte
                  </a>
                </div>
                <p><strong>Important :</strong> Ce lien expire dans 24 heures. Votre compte ne sera créé qu'après avoir cliqué sur ce lien.</p>
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
    },
    redirectUrl: (data: {
      user: {
        id: string;
        metadata?: { planType?: string; inviteCode?: string };
      };
    }) => {
      // Construire l'URL de redirection avec les paramètres nécessaires
      const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verification-success`;
      const params = new URLSearchParams();

      // Toujours inclure l'ID utilisateur
      params.set("userId", data.user.id);

      // Ajouter les paramètres personnalisés si disponibles
      if (data.user.metadata) {
        const metadata = data.user.metadata;
        if (metadata.planType) params.set("plan", metadata.planType);
        if (metadata.inviteCode) params.set("code", metadata.inviteCode);
      }

      console.log(
        `🔄 Redirection après vérification vers: ${baseUrl}?${params.toString()}`
      );
      return `${baseUrl}?${params.toString()}`;
    },
  },

  hooks: {
    afterSignUp: async ({
      user,
      userOptions,
    }: {
      user: {
        id: string;
        email: string;
        name?: string;
        metadata?: Record<string, unknown>;
      };
      userOptions?: { inviteCode?: string; planType?: string; image?: string };
    }) => {
      try {
        console.log(
          "📝 afterSignUp hook exécuté pour:",
          user.email,
          "avec options:",
          userOptions
        );

        // Stocker les métadonnées importantes
        const metadata = {
          inviteCode: userOptions?.inviteCode,
          planType: userOptions?.planType || "FREE",
          image: userOptions?.image,
        };

        // Mettre à jour l'utilisateur avec les métadonnées
        await prisma.user.update({
          where: { id: user.id },
          data: {
            metadata,
            // Ne pas mettre à jour l'organizationId ici, c'est fait dans afterEmailVerified
          },
        });

        console.log("✅ Métadonnées utilisateur mises à jour:", metadata);
        return { user };
      } catch (error) {
        console.error("❌ Erreur dans afterSignUp:", error);
        return { user };
      }
    },
    afterEmailVerified: async ({
      user,
    }: {
      user: {
        id: string;
        email: string;
        name?: string;
        metadata?: Record<string, unknown>;
      };
    }) => {
      console.log(
        "🔍 Hook afterEmailVerified DÉCLENCHÉ pour:",
        user.email,
        "avec metadata:",
        JSON.stringify(user.metadata)
      );
      try {
        // Récupérer l'utilisateur complet depuis la base de données
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { metadata: true, organizationId: true },
        });

        console.log("📊 Utilisateur en base:", JSON.stringify(dbUser));

        // Vérifier si l'utilisateur a déjà une organisation
        if (dbUser?.organizationId) {
          console.log(
            "🏢 L'utilisateur a déjà une organisation:",
            dbUser.organizationId
          );
          return { user };
        }

        // Fusionner les métadonnées de l'utilisateur
        const metadata = {
          ...(user.metadata || {}),
          ...(typeof dbUser?.metadata === "object" && dbUser?.metadata !== null
            ? dbUser.metadata
            : {}),
        };
        console.log("🧩 Métadonnées fusionnées:", JSON.stringify(metadata));

        // Extraire le code d'invitation et le type de plan
        const inviteCode =
          typeof metadata === "object" &&
          metadata !== null &&
          "inviteCode" in metadata
            ? (metadata as { inviteCode?: string }).inviteCode
            : undefined;

        const planType =
          typeof metadata === "object" &&
          metadata !== null &&
          "planType" in metadata
            ? (metadata as { planType?: string }).planType || "FREE"
            : "FREE";

        // Traiter en fonction du code d'invitation
        if (inviteCode) {
          console.log("🔗 Traitement invitation:", inviteCode);
          await handleInviteSignup(user, inviteCode);
        } else {
          console.log("🆕 Création organisation avec plan:", planType);
          await handleNewUserSignup(user, planType);
        }

        // Vérifier que l'organisation a bien été créée
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { organizationId: true },
        });

        console.log(
          "✅ Organisation créée?",
          updatedUser?.organizationId ? "Oui" : "Non"
        );

        await sendWelcomeEmailAfterVerification(user);
        return { user };
      } catch (error) {
        console.error("❌ Erreur critique dans afterEmailVerified:", error);

        // Tentative de récupération forcée
        try {
          console.log("🔄 Tentative de récupération...");
          await handleNewUserSignup(user, "FREE");
          console.log("✅ Récupération réussie");
        } catch (recoveryError) {
          console.error("💥 Échec de la récupération:", recoveryError);
        }

        return { user };
      }
    },
    after: async (ctx) => {
      console.log("BetterAuth after hook context:", ctx);
      // TODO: Adapter la logique métier ici après inspection du contexte
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

// Fonction pour gérer l'inscription avec invitation
async function handleInviteSignup(
  user: {
    id: string;
    email: string;
    name?: string;
  },
  inviteCode: string
) {
  try {
    console.log(
      "Handling invite signup for user:",
      user.id,
      "with code:",
      inviteCode
    );

    const invitation = await prisma.invitationCode.findFirst({
      where: {
        code: inviteCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { organization: true },
    });

    if (!invitation) {
      console.error("Invalid or expired invitation code:", inviteCode);
      // Fallback : créer une organisation gratuite
      await handleNewUserSignup(user, "FREE");
      return;
    }

    // Marquer l'invitation comme utilisée
    await prisma.invitationCode.update({
      where: { id: invitation.id },
      data: { isUsed: true },
    });

    // Associer l'utilisateur à l'organisation
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: invitation.organizationId },
    });

    // Créer l'association OrganizationUser
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    // Créer les accès aux objets pour les non-admins
    if (invitation.role !== "admin") {
      const objects = await prisma.objet.findMany({
        where: { organizationId: invitation.organizationId },
        select: { id: true },
      });

      if (objects.length > 0) {
        await prisma.objectAccess.createMany({
          data: objects.map((obj) => ({
            userId: user.id,
            objectId: obj.id,
            accessLevel: "none",
          })),
          skipDuplicates: true,
        });
      }
    }

    console.log(
      "Successfully added user to organization:",
      invitation.organization.name
    );
  } catch (error) {
    console.error("Error handling invite signup:", error);
  }
}

// Fonction pour gérer l'inscription d'un nouvel utilisateur
async function handleNewUserSignup(
  user: {
    id: string;
    email: string;
    name?: string;
  },
  planType: string = "FREE"
) {
  console.log("🚀 Début handleNewUserSignup pour:", user.email);
  try {
    // Vérifier si l'utilisateur existe et n'a pas déjà une organisation
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    console.log("👤 État utilisateur:", existingUser);

    if (existingUser?.organizationId) {
      console.log(
        "⚠️ L'utilisateur a déjà une organisation:",
        existingUser.organizationId
      );
      return;
    }

    // Créer une nouvelle organisation
    console.log("📝 Création organisation pour:", user.email);
    const organization = await prisma.organization.create({
      data: {
        name: `${user.name || user.email.split("@")[0]}'s Organization`,
      },
    });

    console.log("🏢 Organisation créée:", organization.id);

    // Associer l'utilisateur à l'organisation
    console.log("🔄 Association utilisateur-organisation");
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    // Créer l'association OrganizationUser avec le rôle admin
    console.log("👑 Création rôle admin");
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "admin",
      },
    });

    // Créer l'abonnement selon le plan choisi
    console.log("💰 Création abonnement:", planType);
    await createSubscriptionForPlan(organization.id, planType);

    console.log("✅ Organisation complète créée:", organization.name);
  } catch (error) {
    console.error("❌ Erreur dans handleNewUserSignup:", error);
    throw error; // Remonter l'erreur pour la gérer au niveau supérieur
  }
}

// Fonction pour créer l'abonnement selon le plan
async function createSubscriptionForPlan(
  organizationId: string,
  planType: string
) {
  try {
    const validatedPlanType = validatePlanType(planType);

    let plan = await prisma.plan.findFirst({
      where: { name: validatedPlanType },
    });

    if (!plan) {
      plan = await prisma.plan.findFirst({
        where: { name: "FREE" as PlanType },
      });

      if (!plan) {
        console.error("No FREE plan found in database");
        return;
      }
    }

    // Créer l'abonnement
    await prisma.subscription.create({
      data: {
        organizationId,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(
      "Successfully created subscription with plan:",
      validatedPlanType
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
  }
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
