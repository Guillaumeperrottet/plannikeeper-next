// prisma/setup-storage-limits.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupStorageLimits() {
  console.log("🚀 Configuration des limites de stockage...");

  try {
    // 1. Mettre à jour les plans existants avec des limites de stockage par défaut
    console.log("📝 Mise à jour des plans avec les limites de stockage...");

    const freeUpdate = await prisma.plan.updateMany({
      where: { name: "FREE" },
      data: { maxStorage: 1024 }, // 1GB pour le plan gratuit
    });
    console.log(`✓ Plan FREE: ${freeUpdate.count} plan(s) mis à jour`);

    const personalUpdate = await prisma.plan.updateMany({
      where: { name: "PERSONAL" },
      data: { maxStorage: 5120 }, // 5GB pour le plan personnel
    });
    console.log(`✓ Plan PERSONAL: ${personalUpdate.count} plan(s) mis à jour`);

    const professionalUpdate = await prisma.plan.updateMany({
      where: { name: "PROFESSIONAL" },
      data: { maxStorage: 20480 }, // 20GB pour le plan professionnel
    });
    console.log(
      `✓ Plan PROFESSIONAL: ${professionalUpdate.count} plan(s) mis à jour`
    );

    const enterpriseUpdate = await prisma.plan.updateMany({
      where: { name: "ENTERPRISE" },
      data: { maxStorage: null }, // Illimité pour entreprise
    });
    console.log(
      `✓ Plan ENTERPRISE: ${enterpriseUpdate.count} plan(s) mis à jour`
    );

    const illimiteUpdate = await prisma.plan.updateMany({
      where: { name: "ILLIMITE" },
      data: { maxStorage: null }, // Illimité
    });
    console.log(`✓ Plan ILLIMITE: ${illimiteUpdate.count} plan(s) mis à jour`);

    const superAdminUpdate = await prisma.plan.updateMany({
      where: { name: "SUPER_ADMIN" },
      data: { maxStorage: null }, // Illimité pour super admin
    });
    console.log(
      `✓ Plan SUPER_ADMIN: ${superAdminUpdate.count} plan(s) mis à jour`
    );

    console.log("✅ Limites de stockage mises à jour pour tous les plans");

    // 2. Calculer l'usage initial du stockage pour toutes les organisations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    });

    console.log(
      `\n📊 Calcul de l'usage du stockage pour ${organizations.length} organisations...`
    );

    let totalProcessed = 0;
    let totalErrors = 0;

    for (const org of organizations) {
      try {
        // Calculer l'usage des documents
        const documentsSize = await prisma.document.aggregate({
          where: {
            task: {
              article: {
                sector: {
                  object: {
                    organizationId: org.id,
                  },
                },
              },
            },
          },
          _sum: {
            fileSize: true,
          },
        });

        const totalBytes = documentsSize._sum.fileSize || 0;

        // Créer ou mettre à jour l'usage du stockage
        await prisma.storageUsage.upsert({
          where: { organizationId: org.id },
          update: {
            totalUsedBytes: BigInt(totalBytes),
            lastCalculatedAt: new Date(),
          },
          create: {
            organizationId: org.id,
            totalUsedBytes: BigInt(totalBytes),
          },
        });

        const sizeInMB = (totalBytes / (1024 * 1024)).toFixed(2);
        console.log(`  ✓ ${org.name}: ${sizeInMB} MB`);
        totalProcessed++;
      } catch (error) {
        console.error(`  ✗ Erreur pour ${org.name}:`, error);
        totalErrors++;
      }
    }

    console.log(
      `\n✅ Usage du stockage calculé: ${totalProcessed} succès, ${totalErrors} erreurs`
    );

    // 3. Vérifier les dépassements de limites
    console.log("\n🔍 Vérification des dépassements de limites...");

    const orgsWithSubscriptions = await prisma.organization.findMany({
      include: {
        subscription: {
          include: { plan: true },
        },
        users: { select: { id: true } },
        Objet: { select: { id: true } },
      },
    });

    const issues = [];
    let checkedOrgs = 0;

    for (const org of orgsWithSubscriptions) {
      checkedOrgs++;
      const userCount = org.users.length;
      const objectCount = org.Objet.length;
      const plan = org.subscription?.plan;

      if (!plan) {
        // Organisation sans abonnement (sera traitée comme FREE)
        console.log(
          `  ℹ️  ${org.name}: Aucun abonnement (sera traité comme FREE)`
        );
        continue;
      }

      // Vérifier les dépassements
      if (plan.maxUsers && userCount > plan.maxUsers) {
        issues.push(
          `⚠️  ${org.name}: ${userCount} utilisateurs (limite: ${plan.maxUsers})`
        );
      }

      if (plan.maxObjects && objectCount > plan.maxObjects) {
        issues.push(
          `⚠️  ${org.name}: ${objectCount} objets (limite: ${plan.maxObjects})`
        );
      }
    }

    console.log(`📋 ${checkedOrgs} organisations vérifiées`);

    if (issues.length > 0) {
      console.log("\n🚨 Organisations dépassant les limites:");
      issues.forEach((issue) => console.log(issue));
      console.log(
        "\n💡 Vous pouvez ajuster ces limites via l'interface admin (/admin)"
      );
    } else {
      console.log("✅ Aucun dépassement de limites détecté");
    }

    // 4. Résumé final
    console.log("\n📊 Résumé de la configuration:");
    console.log(`• ${organizations.length} organisations configurées`);
    console.log(`• ${totalProcessed} calculs de stockage réussis`);
    console.log(`• ${issues.length} dépassements de limites détectés`);

    console.log("\n🎉 Configuration terminée avec succès !");
    console.log("💡 Accédez à /admin pour gérer les limites via l'interface");
  } catch (error) {
    console.error("❌ Erreur lors de la configuration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
setupStorageLimits()
  .then(() => {
    console.log("\n✨ Script terminé");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
