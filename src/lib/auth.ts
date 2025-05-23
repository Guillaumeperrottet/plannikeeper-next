// src/lib/auth.ts - Version corrigée pour inscription avec vérification email préalable
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { EmailService } from "./email";
import { PlanType } from "@prisma/client";

// Types pour Better Auth context
interface AuthContext {
  request: Request;
  body: unknown;
  json: (data: unknown, options?: { status?: number }) => Response;
}

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

// Stockage temporaire AVANT création utilisateur
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
    requireEmailVerification: false, // On gère manuellement
    autoSignIn: false, // Pas de connexion automatique après inscription
  },

  emailVerification: {
    sendOnSignUp: false, // Désactivé car on gère manuellement
    autoSignInAfterVerification: false, // On gère la redirection manuellement
  },

  // Routes personnalisées
  customRoutes: {
    // Route personnalisée pour l'inscription avec vérification préalable
    // Dans src/lib/auth.ts - Modification de la route /sign-up/email
    "/sign-up/email": {
      POST: async (ctx: AuthContext) => {
        try {
          type SignUpEmailBody = {
            email: string;
            name: string;
            password: string;
            image?: string;
            inviteCode?: string;
            planType?: string;
          };

          const body = ctx.body as SignUpEmailBody;
          console.log("📝 Inscription pour:", body.email);

          // Vérifier si l'email existe déjà
          const existingUser = await prisma.user.findUnique({
            where: { email: body.email },
          });

          if (existingUser) {
            if (existingUser.emailVerified) {
              return ctx.json(
                { error: { message: "Un compte existe déjà avec cet email" } },
                { status: 400 }
              );
            } else {
              // L'utilisateur existe mais n'est pas vérifié
              // On peut simplement envoyer un nouvel email de vérification
              console.log(
                "🔁 Re-envoi d'email pour un utilisateur non vérifié"
              );
            }
          }

          // Générer un token de vérification
          const token = crypto.randomUUID();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

          // Créer l'utilisateur directement mais non vérifié
          const newUser =
            existingUser ||
            (await prisma.user.create({
              data: {
                email: body.email,
                name: body.name,
                emailVerified: false,
                image: body.image,
                // Autres champs utilisateur...
              },
            }));

          // Stocker le token de vérification dans la base de données
          await prisma.verification.create({
            data: {
              id: crypto.randomUUID(),
              identifier: body.email,
              value: token,
              expiresAt,
            },
          });

          // Stocker des métadonnées supplémentaires si nécessaire
          if (body.inviteCode || body.planType) {
            await prisma.user.update({
              where: { id: newUser.id },
              data: {
                metadata: {
                  inviteCode: body.inviteCode,
                  planType: body.planType || "FREE",
                  pendingCreation: true,
                },
              },
            });
          }

          // Stocker le mot de passe pour une utilisation lors de la vérification d'email
          // Nous utiliserons signUpEmail plus tard pour créer complètement l'utilisateur
          pendingUsers.set(body.email, {
            email: body.email,
            name: body.name,
            password: body.password,
            image: body.image,
            inviteCode: body.inviteCode,
            planType: body.planType,
            token: token,
            expiresAt: expiresAt,
          });

          // Envoyer l'email de vérification
          await sendCustomVerificationEmail({
            email: body.email,
            name: body.name,
            token,
            inviteCode: body.inviteCode,
            planType: body.planType,
          });

          return ctx.json({
            success: true,
            message:
              "Email de vérification envoyé. Vérifiez votre boîte de réception.",
            user: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              emailVerified: false,
            },
          });
        } catch (error) {
          console.error("❌ Erreur inscription:", error);
          return ctx.json(
            {
              error: {
                message:
                  error instanceof Error
                    ? error.message
                    : "Erreur lors de l'inscription",
              },
            },
            { status: 500 }
          );
        }
      },
    },

    // Route personnalisée pour la vérification d'email
    "/verify-email-custom": {
      GET: async (ctx: AuthContext) => {
        try {
          const url = new URL(ctx.request.url);
          const token = url.searchParams.get("token");
          const email = url.searchParams.get("email");
          const callbackURL = url.searchParams.get("callbackURL");

          if (!token || !email) {
            console.error("❌ Token ou email manquant");
            return Response.redirect(
              new URL("/auth/verification-failed", ctx.request.url)
            );
          }

          // Vérifier le token dans la base de données
          const verification = await prisma.verification.findFirst({
            where: {
              identifier: email,
              value: token,
              expiresAt: { gt: new Date() },
            },
          });

          if (!verification) {
            console.error("❌ Token invalide ou expiré");
            return Response.redirect(
              new URL(
                "/auth/verification-failed?error=invalid",
                ctx.request.url
              )
            );
          }

          // Récupérer l'utilisateur
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.error("❌ Utilisateur non trouvé");
            return Response.redirect(
              new URL("/auth/verification-failed?error=user", ctx.request.url)
            );
          }

          // Marquer l'email comme vérifié
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
          });

          // Type spécifique pour les métadonnées utilisateur
          type UserMetadata = {
            inviteCode?: string;
            planType?: PlanType | string;
            pendingCreation?: boolean;
          };

          // Traitement post-vérification
          const metadata = (user.metadata as UserMetadata) || {};
          if (metadata.inviteCode) {
            await handleInviteSignup(user, metadata.inviteCode);
          } else {
            await handleNewUserSignup(user, metadata.planType || "FREE");
          }
          // Supprimer la vérification
          await prisma.verification.delete({
            where: { id: verification.id },
          });

          // Envoyer l'email de bienvenue
          await sendWelcomeEmailAfterVerification(user);

          // Rediriger vers la page de succès
          const redirectUrl = callbackURL || "/auth/verification-success";
          return Response.redirect(new URL(redirectUrl, ctx.request.url));
        } catch (error) {
          console.error("❌ Erreur dans verify-email-custom:", error);
          return Response.redirect(
            new URL("/auth/verification-failed", ctx.request.url)
          );
        }
      },
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

// Fonction pour envoyer l'email de vérification personnalisé
async function sendCustomVerificationEmail({
  email,
  name,
  token,
  inviteCode,
  planType,
}: {
  email: string;
  name: string;
  token: string;
  inviteCode?: string;
  planType?: string;
}) {
  console.log(`📧 Début processus email de vérification pour: ${email}`);

  try {
    const baseUrl = isDev
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_APP_URL;
    console.log(`🔗 URL de base: ${baseUrl}`);

    const verificationUrl = new URL(`${baseUrl}/api/auth/verify-email-custom`);
    verificationUrl.searchParams.set("token", token);
    verificationUrl.searchParams.set("email", email);

    const callbackUrl = new URL(`${baseUrl}/auth/verification-success`);
    if (planType) {
      callbackUrl.searchParams.set("plan", planType);
    }
    if (inviteCode) {
      callbackUrl.searchParams.set("code", inviteCode);
    }

    verificationUrl.searchParams.set("callbackURL", callbackUrl.toString());
    console.log(`🔗 URL de vérification: ${verificationUrl.toString()}`);

    // Création du contenu HTML
    console.log(`📝 Préparation du contenu HTML`);

    const htmlContent = `
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
              <a href="${verificationUrl.toString()}" class="button">
                Créer mon compte
              </a>
            </div>
            
            <p><strong>Important :</strong> Ce lien expire dans 24 heures. Votre compte ne sera créé qu'après avoir cliqué sur ce lien.</p>
            
            ${inviteCode ? `<p>📝 <strong>Invitation :</strong> Vous rejoindrez une organisation existante.</p>` : ""}
            ${planType && planType !== "FREE" ? `<p>💼 <strong>Plan sélectionné :</strong> ${planType}</p>` : ""}
          </div>
          
          <div class="footer">
            <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    console.log(`📤 Tentative d'envoi via Resend`);
    console.log(
      `📧 Email From: ${process.env.RESEND_FROM_EMAIL || "PlanniKeeper <notifications@plannikeeper.ch>"}`
    );
    console.log(`📧 Email To: ${email}`);
    const result = await EmailService.sendEmail({
      to: email,
      subject: "Finalisez votre inscription à PlanniKeeper",
      html: htmlContent,
    });
    console.log(`📬 Résultat de l'envoi:`, result);

    if (!result.success) {
      console.error(`❌ Échec de l'envoi: ${result.error}`);

      throw new Error(`Erreur envoi email: ${result.error}`);
    }

    console.log(`✅ Email de vérification envoyé à: ${email}`);
  } catch (error) {
    console.error(`❌ Erreur envoi email de vérification:`, error);
    throw error;
  }
}

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

// Fonction de nettoyage pour supprimer les entrées expirées
setInterval(
  () => {
    const now = new Date();
    for (const [email, userData] of pendingUsers.entries()) {
      if (userData.expiresAt < now) {
        pendingUsers.delete(email);
        console.log("🧹 Suppression données expirées pour:", email);
      }
    }
  },
  60 * 60 * 1000
); // Nettoyage chaque heure
