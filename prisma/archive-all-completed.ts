// Script pour archiver toutes les tâches terminées
// Usage: npx tsx prisma/archive-all-completed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function archiveAllCompleted() {
  try {
    console.log("🔍 Recherche des tâches terminées non archivées...");

    // Trouver toutes les tâches terminées non archivées
    const completedTasks = await prisma.task.findMany({
      where: {
        status: "completed",
        archived: false,
      },
      select: {
        id: true,
        name: true,
        completedAt: true,
        updatedAt: true,
      },
    });

    console.log(
      `\n📊 Trouvé ${completedTasks.length} tâches terminées à archiver`
    );

    if (completedTasks.length === 0) {
      console.log("✅ Aucune tâche à archiver");
      return;
    }

    // Afficher les tâches qui seront archivées
    console.log("\n📋 Tâches à archiver :");
    completedTasks.forEach((task, index) => {
      console.log(
        `  ${index + 1}. ${task.name} (completedAt: ${task.completedAt?.toISOString() || task.updatedAt.toISOString()})`
      );
    });

    // Archiver toutes ces tâches
    console.log("\n🗄️  Archivage en cours...");
    const result = await prisma.task.updateMany({
      where: {
        id: {
          in: completedTasks.map((t) => t.id),
        },
      },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });

    console.log(`\n✅ ${result.count} tâches archivées avec succès !`);
  } catch (error) {
    console.error("❌ Erreur lors de l'archivage :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

archiveAllCompleted()
  .then(() => {
    console.log("\n✨ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Échec du script :", error);
    process.exit(1);
  });
