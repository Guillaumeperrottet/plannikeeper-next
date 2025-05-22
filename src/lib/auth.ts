// src/lib/auth.ts - Configuration corrigée avec redirections
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
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
    : process.env.BETTER_AUTH_URL,

  trustedOrigins: isDev
    ? ["http://localhost:3000", "localhost:3000", "127.0.0.1:3000"]
    : ["https://plannikeeper-next.vercel.app", "*"],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false, // Désactiver l'auto-connexion pour forcer la vérification
  },

  // ✅ Configuration corrigée de la vérification d'email
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true, // ✅ Connexion automatique après vérification
    // ✅ URLs de redirection corrigées
    verificationURL: isDev
      ? "http://localhost:3000/api/auth/verify-email"
      : `${process.env.BETTER_AUTH_URL}/verify-email`,

    sendVerificationEmail: async ({ user, url, token }) => {
      console.log(`📧 Envoi d'email de vérification vers: ${user.email}`);
      console.log(`🔗 URL de vérification: ${url}`);

      try {
        // ✅ Construire l'URL de vérification avec redirection correcte
        const baseUrl = isDev
          ? "http://localhost:3000"
          : process.env.NEXT_PUBLIC_APP_URL;

        const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(`${baseUrl}/auth/verification-success`)}`;

        console.log(`🔗 URL de vérification construite: ${verificationUrl}`);

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Vérifiez votre adresse email</title>
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
              <div class="container">
                <div class="header">
                  <h1>🏠 PlanniKeeper</h1>
                  <h2>Vérification de votre adresse email</h2>
                </div>
                
                <div class="content">
                  <p>Bonjour ${user.name || user.email.split("@")[0]},</p>
                  <p>Merci de vous être inscrit(e) sur PlanniKeeper. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email :</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" class="button">
                      Vérifier mon email
                    </a>
                  </div>
                  
                  <p>Ou copiez-collez ce lien dans votre navigateur :</p>
                  <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                    ${verificationUrl}
                  </p>
                  
                  <p>Ce lien expire dans 24 heures.</p>
                  <p>Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.</p>
                </div>
                
                <div class="footer">
                  <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const result = await EmailService.sendEmail({
          to: user.email,
          subject: "Vérifiez votre adresse email - PlanniKeeper",
          html: htmlContent,
        });

        if (!result.success) {
          console.error(
            "❌ Erreur lors de l'envoi de l'email de vérification:",
            result.error
          );
          throw new Error(`Échec de l'envoi: ${result.error}`);
        }

        console.log("✅ Email de vérification envoyé avec succès");
      } catch (error) {
        console.error("❌ Exception lors de l'envoi de l'email:", error);
        throw error;
      }
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
    cookies: {
      session_token: {
        name: "session",
        attributes: {
          sameSite: isDev ? "lax" : "none",
          secure: !isDev,
          path: "/",
          domain: isDev ? "localhost" : undefined,
          maxAge: 60 * 60 * 4,
          httpOnly: true,
        },
      },
    },
    cookiePrefix: "",
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      console.log("🔄 Hook après authentification:", {
        path: ctx.path,
        method: ctx.method,
        hasNewSession: !!ctx.context.newSession,
        userId: ctx.context.newSession?.user?.id,
      });

      try {
        // Hook après inscription réussie
        if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
          const user = ctx.context.newSession.user;
          console.log("👤 Traitement du nouvel utilisateur:", user.id);

          // Définir le type des métadonnées
          interface UserMetadata {
            inviteCode?: string;
            planType?: string;
            [key: string]: unknown;
          }

          // Traiter les métadonnées de l'inscription
          const metadata = user.metadata as UserMetadata;
          const inviteCode = metadata?.inviteCode;
          const planType = metadata?.planType || "FREE";

          if (inviteCode) {
            // Utilisateur invité - rejoindre une organisation existante
            await handleInviteSignup(user, inviteCode);
          } else {
            // Nouvel utilisateur - créer une nouvelle organisation
            await handleNewUserSignup(user, planType);
          }
        }

        // ✅ Hook après vérification d'email réussie
        if (ctx.path === "/verify-email" && ctx.context.newSession) {
          const user = ctx.context.newSession.user;
          console.log("✉️ Email vérifié pour l'utilisateur:", user.id);

          // Envoyer l'email de bienvenue après vérification
          await sendWelcomeEmailAfterVerification(user);
        }
      } catch (error) {
        console.error("❌ Erreur dans le hook après inscription:", error);
      }
    }),
  },
});

// ... (garder toutes les autres fonctions helper inchangées)
async function handleInviteSignup(
  user: {
    id: string;
    email: string;
    name?: string;
    metadata?: Record<string, unknown>;
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

    // Vérifier et utiliser le code d'invitation
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
    metadata?: Record<string, unknown>;
  },
  planType: string = "FREE"
) {
  try {
    console.log(
      "Handling new user signup for user:",
      user.id,
      "with plan:",
      planType
    );

    // Créer une nouvelle organisation
    const organization = await prisma.organization.create({
      data: {
        name: `${user.name || user.email.split("@")[0]}'s Organization`,
      },
    });

    // Associer l'utilisateur à l'organisation
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    // Créer l'association OrganizationUser avec le rôle admin
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "admin",
      },
    });

    // Créer l'abonnement selon le plan choisi
    await createSubscriptionForPlan(organization.id, planType);

    console.log(
      "Successfully created organization:",
      organization.name,
      "for user:",
      user.id
    );
  } catch (error) {
    console.error("Error handling new user signup:", error);
  }
}

// Fonction pour créer l'abonnement selon le plan
async function createSubscriptionForPlan(
  organizationId: string,
  planType: string
) {
  try {
    // Valider et convertir le type de plan
    const validatedPlanType = validatePlanType(planType);

    // Récupérer ou créer le plan
    let plan = await prisma.plan.findFirst({
      where: { name: validatedPlanType },
    });

    if (!plan) {
      // Si le plan n'existe pas, utiliser le plan gratuit
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
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
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
  metadata?: Record<string, unknown>;
}) {
  try {
    // Récupérer l'organisation de l'utilisateur
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
