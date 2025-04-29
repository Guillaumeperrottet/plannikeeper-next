// src/lib/email/resend.ts
import { Resend } from "resend";

// Initialiser l'instance Resend avec votre clé API
const resendApiKey = process.env.RESEND_API_KEY;

// Vérifier que la clé API est définie
if (!resendApiKey) {
  console.warn("RESEND_API_KEY is not defined. Emails will not be sent.");
}

// Créer l'instance Resend
export const resend = new Resend(resendApiKey);

// Domaine d'envoi des emails (à configurer dans le dashboard Resend)
export const fromEmail = process.env.EMAIL_FROM || "noreply@plannikeeper.com";

// Fonction pour envoyer un email de bienvenue
export async function sendWelcomeEmail(user: { name: string; email: string }) {
  try {
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not defined, skipping email send");
      return { success: false, error: "API key not configured" };
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: "Bienvenue sur Plannikeeper",
      react: WelcomeEmailTemplate({ name: user.name }),
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

// Import du template d'email (nous allons le créer ensuite)
import { WelcomeEmailTemplate } from "@/lib/email/templates/welcome-template";
