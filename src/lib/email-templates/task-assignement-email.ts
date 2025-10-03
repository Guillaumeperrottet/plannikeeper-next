// src/lib/email-templates/task-assignment-email.ts
import { TaskWithDetails } from "../email";

/**
 * Génère le contenu HTML de l'email d'assignation de tâches
 */
export function getTaskAssignmentEmailTemplate(
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
                ${task.description ? `<div class="task-details" style="margin-top: 10px; color: #555;">${task.description}</div>` : ""}
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
                ${
                  task.documents && task.documents.length > 0
                    ? `
                <div class="task-details" style="margin-top: 15px;">
                  <strong>Documents attachés (${task.documents.length}) :</strong>
                  <div style="margin-top: 10px;">
                    ${task.documents
                      .map((doc) => {
                        const isImage = doc.fileType.startsWith("image/");
                        if (isImage) {
                          return `
                            <div style="margin-bottom: 10px;">
                              <img src="${process.env.NEXT_PUBLIC_APP_URL}${doc.filePath}" 
                                   alt="${doc.name}" 
                                   style="max-width: 100%; height: auto; border-radius: 5px; border: 1px solid #ddd;" />
                              <div style="font-size: 12px; color: #666; margin-top: 5px;">${doc.name}</div>
                            </div>
                          `;
                        } else {
                          const fileIcon = getFileIcon(doc.fileType);
                          return `
                            <div style="padding: 8px; background: #f0f0f0; border-radius: 4px; margin-bottom: 5px; display: flex; align-items: center;">
                              <span style="margin-right: 8px;">${fileIcon}</span>
                              <span style="font-size: 14px;">${doc.name}</span>
                              <span style="font-size: 12px; color: #666; margin-left: 10px;">(${formatFileSize(doc.fileSize)})</span>
                            </div>
                          `;
                        }
                      })
                      .join("")}
                  </div>
                </div>
                `
                    : ""
                }
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

/**
 * Retourne une icône adaptée au type de fichier
 */
function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("excel") || fileType.includes("spreadsheet"))
    return "📊";
  if (fileType.includes("zip") || fileType.includes("archive")) return "📦";
  return "📎";
}

/**
 * Formate la taille du fichier en Ko ou Mo
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}
