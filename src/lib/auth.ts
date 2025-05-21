import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "./prisma";
import { EmailService } from "./email";

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

  emailAndPassword: {
    enabled: true,
    // Activer la vérification des emails
    verifyEmail: {
      enabled: true,
      // Les utilisateurs ne peuvent pas se connecter si leur email n'est pas vérifié
      preventUnverifiedLogin: true,
      // Redirections personnalisées
      redirects: {
        // Redirection après une vérification réussie
        success: "/auth/verification-success",
        // Redirection après une vérification échouée
        error: "/auth/verification-failed",
        // Redirection si l'utilisateur tente de se connecter sans avoir vérifié son email
        emailNotVerified: "/auth/email-verification-required",
      },
    },
  },

  // Configurer l'envoi des emails de vérification
  email: {
    // Fonction pour envoyer les emails
    async sendEmail({
      type,
      to,
      variables,
    }: {
      type: string;
      to: string;
      variables: { url: string };
    }) {
      // Utiliser votre service d'emails existant
      if (type === "verifyEmail") {
        try {
          // Créer un template pour l'email de vérification
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Vérifiez votre adresse email</title>
              </head>
              <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                  <div style="text-align: center; padding: 20px 0; background-color: #d9840d; color: white;">
                    <h1>PlanniKeeper</h1>
                  </div>
                  
                  <div style="padding: 20px; background-color: #fff; border-radius: 5px;">
                    <h2>Vérification de votre adresse email</h2>
                    <p>Bonjour,</p>
                    <p>Merci de vous être inscrit(e) sur PlanniKeeper. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email :</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${variables.url}" style="background-color: #d9840d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Vérifier mon email
                      </a>
                    </div>
                    
                    <p>Ou copiez-collez ce lien dans votre navigateur :</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                      ${variables.url}
                    </p>
                    
                    <p>Ce lien expire dans 24 heures.</p>
                    <p>Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.</p>
                  </div>
                  
                  <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
                    <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          // Envoyer l'email via Resend en utilisant votre service existant
          const { error } = await EmailService.sendEmail({
            to,
            subject: "Vérifiez votre adresse email - PlanniKeeper",
            html: htmlContent,
          });

          if (error) {
            console.error(
              "Erreur lors de l'envoi de l'email de vérification:",
              error
            );
            return false;
          }

          return true;
        } catch (error) {
          console.error("Erreur lors de l'envoi de l'email:", error);
          return false;
        }
      }

      return true;
    },
  },

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
