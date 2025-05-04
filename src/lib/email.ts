import { Resend } from "resend";
import { Task } from "@prisma/client";

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
  // Date formatée pour l'affichage
  const formattedDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tâches assignées - PlanniKeeper</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
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
