// prisma/migrate-to-new-limits.ts
import { PrismaClient, PlanType } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration mise à jour des plans
const UPDATED_PLAN_DETAILS = {
  FREE: {
    name: PlanType.FREE,
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: null,
    maxUsers: 1,
    maxObjects: 3, // Augmenté de 1 à 3
    maxStorage: 500, // 500MB
    features: [
      "1 utilisateur",
      "3 objets",
      "500MB stockage",
      "Support communauté",
    ],
    stripeProductId: null,
    stripePriceId: null,
  },
  PERSONAL: {
    name: PlanType.PERSONAL,
    price: 12,
    monthlyPrice: 12,
    yearlyPrice: 120,
    maxUsers: 1,
    maxObjects: 10, // Augmenté de 5 à 10
    maxStorage: 2048, // 2GB
    features: ["1 utilisateur", "10 objets", "2GB stockage", "Support email"],
    stripeProductId: "prod_SGIEtVCmOll3el",
    stripePriceId: "price_1RLldxBQLEouvGCfL3be36t8",
  },
  PROFESSIONAL: {
    name: PlanType.PROFESSIONAL,
    price: 35, // Augmenté de 29.99 à 35
    monthlyPrice: 35,
    yearlyPrice: 350,
    maxUsers: 10, // Augmenté de 5 à 10
    maxObjects: 50, // Augmenté de 20 à 50
    maxStorage: 10240, // 10GB
    features: [
      "10 utilisateurs",
      "50 objets",
      "10GB stockage",
      "Support prioritaire",
    ],
    stripeProductId: "prod_SGIGQkZN7Seepi",
    stripePriceId: "price_1RLlfZBQLEouvGCfM7mFl469",
  },
  ENTERPRISE: {
    name: PlanType.ENTERPRISE,
    price: 85, // Réduit de 99.99 à 85
    monthlyPrice: 85,
    yearlyPrice: 850,
    maxUsers: null,
    maxObjects: null,
    maxStorage: 51200, // 50GB (pas illimité pour éviter les abus)
    features: [
      "Utilisateurs illimités",
      "Objets illimités",
      "50GB stockage",
      "Support téléphone",
    ],
    stripeProductId: null,
    stripePriceId: null,
  },
  SUPER_ADMIN: {
    name: PlanType.SUPER_ADMIN,
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: null,
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    features: ["Accès super administrateur complet"],
    stripeProductId: null,
    stripePriceId: null,
  },
  ILLIMITE: {
    name: PlanType.ILLIMITE,
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: null,
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    features: ["Accès illimité complet"],
    stripeProductId: null,
    stripePriceId: null,
  },
};

async function migratePlansAndData() {
  console.log("🚀 Début de la migration vers les nouvelles limites...");

  try {
    // 1. Mettre à jour tous les plans existants
    console.log("\n📦 Mise à jour des plans...");

    for (const [planId, planData] of Object.entries(UPDATED_PLAN_DETAILS)) {
      await prisma.plan.upsert({
        where: { name: planData.name },
        update: {
          price: planData.price,
          monthlyPrice: planData.monthlyPrice,
          yearlyPrice: planData.yearlyPrice,
          maxUsers: planData.maxUsers,
          maxObjects: planData.maxObjects,
          maxStorage: planData.maxStorage,
          features: planData.features,
          stripeProductId: planData.stripeProductId,
          stripePriceId: planData.stripePriceId,
        },
        create: {
          name: planData.name,
          price: planData.price,
          monthlyPrice: planData.monthlyPrice,
          yearlyPrice: planData.yearlyPrice,
          maxUsers: planData.maxUsers,
          maxObjects: planData.maxObjects,
          maxStorage: planData.maxStorage,
          features: planData.features,
          hasCustomPricing: planId === "ENTERPRISE",
          stripeProductId: planData.stripeProductId,
          stripePriceId: planData.stripePriceId,
        },
      });
      console.log(`✅ Plan ${planId} mis à jour`);
    }

    // 2. Créer le plan CUSTOM s'il n'existe pas
    await prisma.plan.upsert({
      where: { name: "CUSTOM" as PlanType },
      update: {},
      create: {
        name: "CUSTOM" as PlanType,
        price: 0,
        monthlyPrice: 0,
        maxUsers: 1,
        maxObjects: 1,
        maxStorage: 1024,
        hasCustomPricing: true,
        features: ["Limites personnalisées"],
      },
    });
    console.log("✅ Plan CUSTOM créé/mis à jour");

    // 3. Vérifier les abonnements orphelins
    console.log("\n🔍 Vérification des abonnements orphelins...");

    const orphanedSubscriptions = await prisma.subscription.findMany({
      where: {
        plan: {
          is: {},
        },
      },
      include: { organization: true },
    });

    if (orphanedSubscriptions.length > 0) {
      console.log(
        `⚠️ Trouvé ${orphanedSubscriptions.length} abonnements orphelins`
      );

      const freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
      });

      if (freePlan) {
        for (const sub of orphanedSubscriptions) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { planId: freePlan.id },
          });
          console.log(`🔄 Abonnement orphelin ${sub.id} associé au plan FREE`);
        }
      }
    } else {
      console.log("✅ Aucun abonnement orphelin trouvé");
    }

    // 4. Créer les enregistrements de stockage manquants
    console.log("\n📊 Configuration du stockage...");

    const orgsWithoutStorage = await prisma.organization.findMany({
      where: {
        storageUsage: null,
      },
    });

    for (const org of orgsWithoutStorage) {
      // Calculer l'usage initial
      const documentsSize = await prisma.document.aggregate({
        where: {
          task: {
            article: {
              sector: {
                object: { organizationId: org.id },
              },
            },
          },
        },
        _sum: { fileSize: true },
      });

      await prisma.storageUsage.create({
        data: {
          organizationId: org.id,
          totalUsedBytes: BigInt(documentsSize._sum.fileSize || 0),
        },
      });
    }
    console.log(
      `✅ ${orgsWithoutStorage.length} enregistrements de stockage créés`
    );

    // 5. Vérifier les dépassements de limites après migration
    console.log("\n🔍 Vérification des dépassements après migration...");

    const orgsWithLimitsIssues = [];
    const organizations = await prisma.organization.findMany({
      include: {
        subscription: { include: { plan: true } },
        users: { select: { id: true } },
        Objet: { select: { id: true } },
      },
    });

    for (const org of organizations) {
      const plan = org.subscription?.plan;
      if (!plan) continue;

      const userCount = org.users.length;
      const objectCount = org.Objet.length;

      const issues = [];

      if (plan.maxUsers && userCount > plan.maxUsers) {
        issues.push(`${userCount} utilisateurs > ${plan.maxUsers} autorisés`);
      }

      if (plan.maxObjects && objectCount > plan.maxObjects) {
        issues.push(`${objectCount} objets > ${plan.maxObjects} autorisés`);
      }

      if (issues.length > 0) {
        orgsWithLimitsIssues.push({
          org: org.name,
          plan: plan.name,
          issues,
        });
      }
    }

    if (orgsWithLimitsIssues.length > 0) {
      console.log("⚠️ Organisations avec des dépassements:");
      orgsWithLimitsIssues.forEach(({ org, plan, issues }) => {
        console.log(`  • ${org} (${plan}): ${issues.join(", ")}`);
      });
      console.log("\n💡 Vous pouvez ajuster ces limites via /admin");
    } else {
      console.log("✅ Aucun dépassement de limites détecté");
    }

    // 6. Statistiques finales
    console.log("\n📈 Statistiques finales:");

    const planStats = await prisma.subscription.groupBy({
      by: ["planId"],
      _count: { planId: true },
    });

    const planNames = await prisma.plan.findMany({
      select: { id: true, name: true },
    });

    planStats.forEach((stat) => {
      const planName =
        planNames.find((p) => p.id === stat.planId)?.name || "Inconnu";
      console.log(`  • ${planName}: ${stat._count.planId} abonnements`);
    });

    console.log("\n✅ Migration terminée avec succès!");
    console.log("🎯 Prochaines étapes:");
    console.log("  1. Testez les nouvelles limites via /admin");
    console.log("  2. Mettez à jour vos prix Stripe si nécessaire");
    console.log("  3. Informez vos utilisateurs des nouvelles limites");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
if (require.main === module) {
  migratePlansAndData().catch((error) => {
    console.error("Migration échouée:", error);
    process.exit(1);
  });
}

export { migratePlansAndData };
