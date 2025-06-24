import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixNotificationLinks() {
  console.log("🔍 Recherche des notifications avec des liens dupliqués...");

  // Trouve toutes les notifications avec des liens qui contiennent /task/*/task/*
  const notificationsWithDuplicatedLinks = await prisma.notification.findMany({
    where: {
      link: {
        contains: "/task/",
      },
    },
  });

  console.log(
    `📝 ${notificationsWithDuplicatedLinks.length} notifications trouvées avec des liens contenant /task/`
  );

  let fixedCount = 0;

  for (const notification of notificationsWithDuplicatedLinks) {
    if (!notification.link) continue;

    // Vérifie si le lien contient la duplication /task/id/task/id
    const taskDuplicationRegex = /\/task\/([^\/]+)\/task\/\1(?:\/|$)/;
    const match = notification.link.match(taskDuplicationRegex);

    if (match) {
      // Supprime la duplication
      const fixedLink = notification.link.replace(
        taskDuplicationRegex,
        "/task/$1"
      );

      await prisma.notification.update({
        where: { id: notification.id },
        data: { link: fixedLink },
      });

      console.log(`✅ Corrigé: ${notification.link} → ${fixedLink}`);
      fixedCount++;
    }
  }

  console.log(`🎉 ${fixedCount} notifications corrigées !`);
}

fixNotificationLinks()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
