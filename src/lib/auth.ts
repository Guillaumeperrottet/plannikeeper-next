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

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

interface UserOptions {
  inviteCode?: string;
  planType?: string;
  image?: string;
}

interface AfterSignUpParams {
  user: AuthUser;
  userOptions?: UserOptions;
}

interface AfterEmailVerifiedParams {
  user: AuthUser;
}

interface EmailVerificationParams {
  name?: string;
  url: string;
  email: string;
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
    redirectUrl: (): string => {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://www.plannikeeper.ch";
      return `${baseUrl}/auth/verification-success`;
    },
    emailContent: {
      subject: "Finalisez votre inscription à PlanniKeeper",
      html: (params: EmailVerificationParams): string => {
        const { name, url, email } = params;

        // Vérifier et corriger l'URL si nécessaire
        let verificationUrl = url;
        if (
          url.includes("plannikeeper-next.vercel.app") &&
          process.env.NODE_ENV === "production"
        ) {
          // Remplacer l'URL de Vercel par l'URL de production
          verificationUrl = url.replace(
            "plannikeeper-next.vercel.app",
            "www.plannikeeper.ch"
          );
        }

        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
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
          <div class="container">
            <div class="header">
              <h1>🏠 PlanniKeeper</h1>
              <h2>Finaliser votre inscription</h2>
            </div>
            
            <div class="content">
              <p>Bonjour ${name || email.split("@")[0]},</p>
              <p>Merci de votre intérêt pour PlanniKeeper ! Pour finaliser votre inscription et créer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">
                  Créer mon compte
                </a>
              </div>
              
              <p><strong>Important :</strong> Ce lien expire dans 24 heures. Votre compte ne sera créé qu'après avoir cliqué sur ce lien.</p>
            </div>
            
            <div class="footer">
              <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
      `;
      },
    },
  },

  hooks: {
    afterSignUp: async ({ user, userOptions }: AfterSignUpParams) => {
      try {
        const metadata = {
          inviteCode: userOptions?.inviteCode,
          planType: userOptions?.planType || "FREE",
          image: userOptions?.image,
        };
        await prisma.user.update({
          where: { id: user.id },
          data: { metadata },
        });
        return { user };
      } catch (error) {
        console.error("Erreur dans afterSignUp:", error);
        return { user };
      }
    },
    afterVerify: async ({ user }: { user: AuthUser }) => {
      // Ce hook est appelé immédiatement après la vérification du token
      console.log("🔵 Hook afterVerify exécuté pour:", user.email);
      // Vous pouvez mettre le même code que dans afterEmailVerified ou
      // simplement retourner l'utilisateur, car afterEmailVerified sera appelé ensuite
      return { user };
    },
    afterEmailVerified: async ({ user }: AfterEmailVerifiedParams) => {
      try {
        const metadata = user.metadata || {};
        const inviteCode =
          typeof metadata.inviteCode === "string"
            ? metadata.inviteCode
            : undefined;
        const planType = metadata.planType || "FREE";
        if (inviteCode) {
          await handleInviteSignup(user, inviteCode);
        } else {
          await handleNewUserSignup(
            user,
            typeof planType === "string" ? planType : "FREE"
          );
        }
        await sendWelcomeEmailAfterVerification(user);
        return { user };
      } catch (error) {
        console.error("Erreur dans afterEmailVerified:", error);
        return { user };
      }
    },
    after: async (ctx: unknown) => {
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
