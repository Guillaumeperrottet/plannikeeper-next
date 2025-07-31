// src/app/api/cron/daily-summary/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email";
import type {
  DailySummaryData,
  ObjectSummary,
  TaskSummary,
} from "@/lib/email-templates/daily-summary-email";

export async function GET() {
  console.log("Starting daily summary email job");

  try {
    // Calculer les dates pour "hier"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(
      `Looking for task activity between ${yesterday.toISOString()} and ${today.toISOString()}`
    );

    // Récupérer tous les utilisateurs avec notifications quotidiennes activées
    const usersWithDailyNotifications = await prisma.user.findMany({
      where: {
        dailySummaryEnabled: true, // Nouveau champ à ajouter
        emailVerified: true,
        Organization: {
          isNot: null,
        },
      },
      include: {
        Organization: true,
        OrganizationUser: true,
      },
    });

    console.log(
      `Found ${usersWithDailyNotifications.length} users with daily notifications enabled`
    );

    if (usersWithDailyNotifications.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with daily notifications enabled",
        emailsSent: 0,
      });
    }

    const emailResults = [];

    for (const user of usersWithDailyNotifications) {
      try {
        if (!user.Organization) continue;

        // Vérifier les accès aux objets pour cet utilisateur
        const userObjectAccess = await prisma.objectAccess.findMany({
          where: {
            userId: user.id,
            NOT: { accessLevel: "none" }, // Exclure les accès "aucun accès"
          },
          select: { objectId: true },
        });

        // Vérifier si l'utilisateur est admin de l'organisation
        const isOrgAdmin = await prisma.organizationUser.findFirst({
          where: {
            userId: user.id,
            role: "admin",
          },
        });

        // Si l'utilisateur est admin, il a accès à tout
        let accessibleObjectIds: string[];
        if (isOrgAdmin) {
          console.log(`User ${user.email} is admin - access to all objects`);
          // Admin : récupérer tous les objets de l'organisation
          const orgObjects = await prisma.objet.findMany({
            where: { organizationId: isOrgAdmin.organizationId },
            select: { id: true },
          });
          accessibleObjectIds = orgObjects.map((obj) => obj.id);
        } else {
          console.log(
            `User ${user.email} is member - access to ${userObjectAccess.length} objects`
          );
          // Membre : seulement les objets avec accès explicite (admin, modif, lecture)
          accessibleObjectIds = userObjectAccess.map(
            (access) => access.objectId
          );
        }

        // Si l'utilisateur n'a accès à aucun objet, passer au suivant
        if (accessibleObjectIds.length === 0) {
          console.log(`User ${user.email} has no object access - skipping`);
          emailResults.push({
            userId: user.id,
            email: user.email,
            success: true,
            tasksAdded: 0,
            tasksCompleted: 0,
            tasksPending: 0,
            objectsCount: 0,
            error: undefined,
            filteredByAccess: true,
            reason: "Aucun accès aux objets",
          });
          continue;
        }

        // Récupérer les tâches ajoutées hier (filtrées par permissions)
        const tasksAdded = await prisma.task.findMany({
          where: {
            createdAt: {
              gte: yesterday,
              lt: today,
            },
            article: {
              sector: {
                object: {
                  organizationId: user.Organization.id,
                  id: { in: accessibleObjectIds }, // Filtrer par accès aux objets
                },
              },
            },
            archived: false,
          },
          include: {
            article: {
              include: {
                sector: {
                  include: {
                    object: true,
                  },
                },
              },
            },
            assignedTo: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Récupérer les tâches terminées hier (filtrées par permissions)
        const tasksCompleted = await prisma.task.findMany({
          where: {
            status: "completed",
            updatedAt: {
              // Utiliser updatedAt pour les tâches terminées
              gte: yesterday,
              lt: today,
            },
            article: {
              sector: {
                object: {
                  organizationId: user.Organization.id,
                  id: { in: accessibleObjectIds }, // Filtrer par accès aux objets
                },
              },
            },
            archived: false,
          },
          include: {
            article: {
              include: {
                sector: {
                  include: {
                    object: true,
                  },
                },
              },
            },
            assignedTo: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        });

        // Récupérer les tâches en attente (tâches assignées à l'utilisateur, non terminées et non archivées, filtrées par permissions)
        const tasksPending = await prisma.task.findMany({
          where: {
            assignedToId: user.id, // Seulement les tâches assignées à cet utilisateur
            status: {
              not: "completed",
            },
            article: {
              sector: {
                object: {
                  organizationId: user.Organization.id,
                  id: { in: accessibleObjectIds }, // Filtrer par accès aux objets
                },
              },
            },
            archived: false,
          },
          include: {
            article: {
              include: {
                sector: {
                  include: {
                    object: true,
                  },
                },
              },
            },
            assignedTo: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        console.log(
          `User ${user.email}: ${tasksAdded.length} tasks added, ${tasksCompleted.length} tasks completed, ${tasksPending.length} tasks pending (filtered by object access)`
        );

        // Organiser par objet
        const objectsMap = new Map<string, ObjectSummary>();

        // Traiter les tâches ajoutées
        tasksAdded.forEach((task) => {
          const objectId = task.article.sector.object.id;
          if (!objectsMap.has(objectId)) {
            objectsMap.set(objectId, {
              objectId,
              objectName: task.article.sector.object.nom,
              objectAddress: task.article.sector.object.adresse,
              tasksAdded: [],
              tasksCompleted: [],
              tasksPending: [],
            });
          }

          const taskSummary: TaskSummary = {
            id: task.id,
            name: task.name,
            description: task.description || undefined,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            assignedToName: task.assignedTo?.name || undefined,
            createdAt: task.createdAt.toISOString(),
            taskType: task.taskType || undefined,
          };

          objectsMap.get(objectId)!.tasksAdded.push(taskSummary);
        });

        // Traiter les tâches terminées
        tasksCompleted.forEach((task) => {
          const objectId = task.article.sector.object.id;
          if (!objectsMap.has(objectId)) {
            objectsMap.set(objectId, {
              objectId,
              objectName: task.article.sector.object.nom,
              objectAddress: task.article.sector.object.adresse,
              tasksAdded: [],
              tasksCompleted: [],
              tasksPending: [],
            });
          }

          const taskSummary: TaskSummary = {
            id: task.id,
            name: task.name,
            description: task.description || undefined,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            assignedToName: task.assignedTo?.name || undefined,
            completedAt: task.updatedAt.toISOString(),
            taskType: task.taskType || undefined,
          };

          objectsMap.get(objectId)!.tasksCompleted.push(taskSummary);
        });

        // Traiter les tâches en attente
        tasksPending.forEach((task) => {
          const objectId = task.article.sector.object.id;
          if (!objectsMap.has(objectId)) {
            objectsMap.set(objectId, {
              objectId,
              objectName: task.article.sector.object.nom,
              objectAddress: task.article.sector.object.adresse,
              tasksAdded: [],
              tasksCompleted: [],
              tasksPending: [],
            });
          }

          const taskSummary: TaskSummary = {
            id: task.id,
            name: task.name,
            description: task.description || undefined,
            sectorName: task.article.sector.name,
            articleTitle: task.article.title,
            assignedToName: task.assignedTo?.name || undefined,
            createdAt: task.createdAt.toISOString(),
            taskType: task.taskType || undefined,
          };

          objectsMap.get(objectId)!.tasksPending.push(taskSummary);
        });

        // Préparer les données pour l'email
        const summaryData: DailySummaryData = {
          userName: user.name || user.email.split("@")[0],
          date: yesterday.toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          objectSummaries: Array.from(objectsMap.values()).filter(
            (obj) =>
              obj.tasksAdded.length > 0 ||
              obj.tasksCompleted.length > 0 ||
              obj.tasksPending.length > 0
          ),
          totalTasksAdded: tasksAdded.length,
          totalTasksCompleted: tasksCompleted.length,
          totalTasksPending: tasksPending.length,
        };

        // Envoyer l'email (même s'il n'y a pas d'activité, selon les préférences utilisateur)
        const result = await EmailService.sendDailySummaryEmail(
          user.email,
          summaryData
        );

        emailResults.push({
          userId: user.id,
          email: user.email,
          success: result.success,
          tasksAdded: tasksAdded.length,
          tasksCompleted: tasksCompleted.length,
          tasksPending: tasksPending.length,
          objectsCount: summaryData.objectSummaries.length,
          accessibleObjectsCount: accessibleObjectIds.length,
          filteredByAccess: false, // Les tâches ont été filtrées par permissions mais l'email a été envoyé
          error: result.success ? undefined : result.error,
        });

        console.log(
          `Daily summary sent to ${user.email}: ${result.success ? "success" : "failed"}`
        );
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        emailResults.push({
          userId: user.id,
          email: user.email,
          success: false,
          tasksAdded: 0,
          tasksCompleted: 0,
          tasksPending: 0,
          objectsCount: 0,
          accessibleObjectsCount: 0,
          filteredByAccess: false,
          error:
            userError instanceof Error ? userError.message : "Unknown error",
        });
      }
    }

    const successCount = emailResults.filter((r) => r.success).length;
    const failureCount = emailResults.filter((r) => !r.success).length;

    console.log(
      `Daily summary job completed: ${successCount} success, ${failureCount} failures`
    );

    return NextResponse.json({
      success: true,
      emailsSent: successCount,
      emailsFailures: failureCount,
      totalUsers: usersWithDailyNotifications.length,
      details: emailResults,
    });
  } catch (error) {
    console.error("Error in daily summary email job:", error);
    return NextResponse.json(
      {
        error: "Error in daily summary email job",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
