import { NextResponse } from "next/server";
import { getTaskAssignmentEmailTemplate } from "@/lib/email-templates/task-assignement-email";
import { TaskWithDetails } from "@/lib/email";

export async function GET() {
  // Créer des données de test avec des documents
  const mockTasks: TaskWithDetails[] = [
    {
      id: "1",
      name: "Réparer la toiture du chalet",
      description:
        "Inspection complète de la toiture et réparation des tuiles endommagées suite aux dernières intempéries. Vérifier également l'étanchéité.",
      executantComment: null,
      done: false,
      realizationDate: new Date("2025-10-15"),
      status: "pending",
      taskType: "Maintenance",
      color: "#d9840d",
      recurring: false,
      period: null,
      endDate: null,
      recurrenceReminderDate: null,
      assignedToId: "user1",
      articleId: "article1",
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
      article: {
        title: "Chalet A",
        sector: {
          name: "Zone Nord",
          object: {
            nom: "Lodges de Camargue",
          },
        },
      },
      assignedTo: {
        name: "Guillaume",
        email: "guillaume@example.com",
      },
      documents: [
        {
          id: "doc1",
          name: "photo-toiture-1.jpg",
          filePath: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          fileSize: 2456789,
          fileType: "image/jpeg",
        },
        {
          id: "doc2",
          name: "photo-toiture-2.jpg",
          filePath: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          fileSize: 1856789,
          fileType: "image/jpeg",
        },
        {
          id: "doc3",
          name: "devis-reparation.pdf",
          filePath: "https://res.cloudinary.com/demo/raw/upload/sample.pdf",
          fileSize: 156789,
          fileType: "application/pdf",
        },
      ],
    },
    {
      id: "2",
      name: "Entretien système de chauffage",
      description:
        "Vérification annuelle du système de chauffage. Nettoyer les filtres et contrôler le bon fonctionnement.",
      executantComment: null,
      done: false,
      realizationDate: new Date("2025-10-20"),
      status: "in_progress",
      taskType: "Entretien",
      color: "#10b981",
      recurring: true,
      period: "monthly",
      endDate: null,
      recurrenceReminderDate: null,
      assignedToId: "user1",
      articleId: "article2",
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
      article: {
        title: "Lodge 27",
        sector: {
          name: "Secteur Est",
          object: {
            nom: "Lodges de Camargue",
          },
        },
      },
      assignedTo: {
        name: "Guillaume",
        email: "guillaume@example.com",
      },
      documents: [
        {
          id: "doc4",
          name: "manuel-chauffage.pdf",
          filePath: "https://res.cloudinary.com/demo/raw/upload/sample.pdf",
          fileSize: 3456789,
          fileType: "application/pdf",
        },
      ],
    },
  ] as TaskWithDetails[];

  const html = getTaskAssignmentEmailTemplate("Guillaume", mockTasks);

  return NextResponse.json({ html });
}
