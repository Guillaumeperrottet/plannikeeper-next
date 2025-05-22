import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

export async function GET() {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer toutes les organisations avec leurs abonnements et statistiques d'usage
    const organizations = await prisma.organization.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        users: {
          select: { id: true },
        },
        Objet: {
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculer les statistiques pour chaque organisation
    const organizationsWithLimits = await Promise.all(
      organizations.map(async (org) => {
        // Calculer l'usage du stockage (approximatif)
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

        const storageUsed = Math.round(
          (documentsSize._sum.fileSize || 0) / (1024 * 1024)
        ); // Convertir en MB

        const plan = org.subscription?.plan;
        const status = org.subscription?.status || "FREE";

        return {
          id: org.id,
          name: org.name,
          planName: plan?.name || "FREE",
          status,
          users: {
            current: org.users.length,
            limit: plan?.maxUsers,
            unlimited: plan?.maxUsers === null,
          },
          objects: {
            current: org.Objet.length,
            limit: plan?.maxObjects,
            unlimited: plan?.maxObjects === null,
          },
          storage: {
            current: storageUsed,
            limit: plan ? 5120 : 1024, // 5GB pour les plans payants, 1GB pour gratuit
            unlimited: plan?.name === "ENTERPRISE" || plan?.name === "ILLIMITE",
          },
          subscriptionId: org.subscription?.id,
          createdAt: org.createdAt,
        };
      })
    );

    return NextResponse.json({ organizations: organizationsWithLimits });
  } catch (error) {
    console.error("Erreur lors de la récupération des limites:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
