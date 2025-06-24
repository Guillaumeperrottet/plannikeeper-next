import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectNotificationLinks() {
  console.log("🔍 Inspection des liens de notifications...");

  // Trouve toutes les notifications avec des liens
  const notifications = await prisma.notification.findMany({
    where: {
      link: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      link: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20, // Les 20 plus récentes
  });

  console.log(`📝 ${notifications.length} notifications avec liens trouvées:`);

  notifications.forEach((notification) => {
    console.log(`\nID: ${notification.id}`);
    console.log(`Titre: ${notification.title}`);
    console.log(`Lien: ${notification.link}`);
    console.log(`Créé: ${notification.createdAt}`);
    console.log("---");
  });
}

inspectNotificationLinks()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
