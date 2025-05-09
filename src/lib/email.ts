import { Resend } from "resend";
import { Task } from "@prisma/client";
import { Plan, Organization, User } from "@prisma/client";
import { getSubscriptionConfirmationTemplate } from "./email-templates/subscription-confirmation";
import { getWelcomeEmailTemplate } from "./email-templates/welcome-email";

export type TaskWithDetails = Task & {
  article: {
    title: string;
    sector: {
      name: string;
      object: {
        nom: string;
      };
    };
  };
  assignedTo: {
    name: string;
    email: string;
  } | null;
};

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not defined");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export const EmailService = {
  async sendWelcomeEmail(user: User, organizationName: string) {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

      const htmlContent = getWelcomeEmailTemplate(
        user.name || "utilisateur",
        organizationName,
        dashboardUrl
      );

      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@plannikeeper.ch>",
        to: [user.email],
        subject: `Bienvenue sur PlanniKeeper !`,
        html: htmlContent,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
        headers: {
          "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}>`,
          "X-Entity-Ref-ID": `welcome-${user.id}-${Date.now()}`, // Identifiant unique pour éviter les duplications
        },
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email de bienvenue:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Erreur dans le service d'email:", error);
      return { success: false, error };
    }
  },
  // Ajouter cette méthode à votre service EmailService existant
  async sendSubscriptionConfirmationEmail(
    user: User,
    organization: Organization,
    plan: Plan,
    currentPeriodEnd: Date
  ) {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

      const htmlContent = getSubscriptionConfirmationTemplate(
        user.name || "utilisateur",
        organization.name,
        this.getPlanDisplayName(plan.name),
        typeof plan.monthlyPrice === "object" && "toNumber" in plan.monthlyPrice
          ? plan.monthlyPrice.toNumber()
          : Number(plan.monthlyPrice),
        plan.features,
        currentPeriodEnd,
        dashboardUrl
      );

      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@resend.dev>",
        to: [user.email],
        subject: `Confirmation d'abonnement - ${this.getPlanDisplayName(plan.name)} - PlanniKeeper`,
        html: htmlContent,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      });

      if (error) {
        console.error(
          "Erreur lors de l'envoi de l'email de confirmation d'abonnement:",
          error
        );
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Erreur dans le service d'email:", error);
      return { success: false, error };
    }
  },

  // Fonction utilitaire pour obtenir le nom d'affichage du plan
  getPlanDisplayName(planType: string): string {
    switch (planType) {
      case "FREE":
        return "Gratuit";
      case "PERSONAL":
        return "Particulier";
      case "PROFESSIONAL":
        return "Indépendant";
      case "ENTERPRISE":
        return "Entreprise";
      default:
        return planType;
    }
  },
  async sendTaskAssignmentEmail(
    to: string,
    userName: string,
    tasks: TaskWithDetails[]
  ) {
    try {
      const { data, error } = await getResend().emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "PlanniKeeper <notifications@resend.dev>",
        to: [to],
        subject: `Nouvelles tâches assignées - ${new Date().toLocaleDateString()}`,
        html: generateTaskAssignmentEmailTemplate(userName, tasks),
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      });

      if (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in email service:", error);
      return { success: false, error };
    }
  },
};

/**
 * Génère le contenu HTML de l'email
 */
function generateTaskAssignmentEmailTemplate(
  userName: string,
  tasks: TaskWithDetails[]
): string {
  const formattedDate = new Date().toLocaleDateString("fr-FR");
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Tâches assignées</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #d9840d;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #d9840d;
        }
        .content {
          padding: 20px 0;
        }
        .task-list {
          margin-top: 20px;
        }
        .task-item {
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
          background-color: #f9f9f9;
        }
        .task-title {
          font-weight: bold;
          font-size: 18px;
          color: #d9840d;
          margin-bottom: 5px;
        }
        .task-details {
          margin-bottom: 5px;
        }
        .task-location {
          color: #666;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #777;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          background-color: #d9840d;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        }
        .print-section {
          display: none;
        }
        @media print {
          .no-print {
            display: none;
          }
          .print-section {
            display: block;
            margin: 20px 0;
            padding: 10px;
            border: 1px dashed #999;
          }
          .task-item {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PlanniKeeper</div>
          <div>Récapitulatif des tâches assignées</div>
          <div>${formattedDate}</div>
        </div>
        
        <div class="content">
          <p>Bonjour ${userName},</p>
          <p>Voici les tâches qui vous ont été assignées récemment :</p>
          
          <div class="task-list">
            ${tasks
              .map(
                (task) => `
              <div class="task-item">
                <div class="task-title">${task.name}</div>
                ${task.description ? `<div class="task-details">${task.description}</div>` : ""}
                <div class="task-location">
                  ${task.article.sector.object.nom} › ${task.article.sector.name} › ${task.article.title}
                </div>
                ${
                  task.realizationDate
                    ? `
                <div class="task-details">
                  <strong>Date prévue :</strong> ${new Date(task.realizationDate).toLocaleDateString("fr-FR")}
                </div>
                `
                    : ""
                }
                <div class="task-details">
                  <strong>Statut :</strong> ${getStatusText(task.status)}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="no-print">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/notifications" class="button">
              Voir dans l'application
            </a>
          </div>
          
          <div class="print-section">
            <p>Notes :</p>
            <div style="height: 100px; border-bottom: 1px solid #ddd;"></div>
          </div>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par PlanniKeeper.</p>
          <p>Vous pouvez modifier vos préférences de notification dans votre profil.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Convertit le statut technique en texte lisible
 */
function getStatusText(status: string): string {
  switch (status) {
    case "pending":
      return "En attente";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminée";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
}
