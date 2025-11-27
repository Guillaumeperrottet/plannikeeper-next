// src/app/api/cron/auto-archive-completed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * CRON Job : Archive automatique des tâches terminées depuis 24h
 * À configurer sur Vercel : https://cron-job.org/ ou Vercel Cron
 * Fréquence recommandée : toutes les heures ou toutes les 6 heures
 */
export async function GET() {
  try {
    console.log("🤖 Starting auto-archive job for completed tasks...");

    // Calculer la date limite : il y a 24 heures
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Trouver toutes les tâches complétées depuis plus de 24h et non archivées
    const tasksToArchive = await prisma.task.findMany({
      where: {
        status: "completed",
        completedAt: {
          lte: twentyFourHoursAgo,
        },
        archived: false,
      },
      select: {
        id: true,
        name: true,
        completedAt: true,
      },
    });

    console.log(`📦 Found ${tasksToArchive.length} tasks to auto-archive`);

    if (tasksToArchive.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No tasks to archive",
        archivedCount: 0,
      });
    }

    // Archiver toutes ces tâches en une seule requête
    const result = await prisma.task.updateMany({
      where: {
        id: {
          in: tasksToArchive.map((task) => task.id),
        },
      },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });

    console.log(`✅ Successfully auto-archived ${result.count} tasks`);

    // Log des tâches archivées pour debug
    tasksToArchive.forEach((task) => {
      console.log(
        `  - "${task.name}" (completed at: ${task.completedAt?.toISOString()})`
      );
    });

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${result.count} tasks`,
      archivedCount: result.count,
      tasks: tasksToArchive.map((t) => ({
        id: t.id,
        name: t.name,
        completedAt: t.completedAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error in auto-archive job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to auto-archive tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
