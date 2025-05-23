import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si l'utilisateur a déjà une organisation
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    // Si l'utilisateur a déjà une organisation, rien à faire
    if (dbUser?.Organization) {
      return NextResponse.json({
        success: true,
        message: "L'utilisateur a déjà une organisation",
        organizationId: dbUser.Organization.id,
      });
    }

    console.log(
      "⚠️ Organisation manquante pour l'utilisateur:",
      user.id,
      "- Récupération en cours"
    );

    // Créer une nouvelle organisation
    const organization = await prisma.organization.create({
      data: {
        name: `${user.name || user.email?.split("@")[0] || "Utilisateur"}'s Organization`,
      },
    });

    // Associer l'utilisateur à l'organisation
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });

    // Créer l'association OrganizationUser avec le rôle admin
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "admin",
      },
    });

    // Récupérer le plan gratuit
    const freePlan = await prisma.plan.findFirst({
      where: { name: "FREE" },
    });

    if (freePlan) {
      // Créer l'abonnement
      await prisma.subscription.create({
        data: {
          organizationId: organization.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log(
      "✅ Organisation créée avec succès (récupération):",
      organization.id
    );

    return NextResponse.json({
      success: true,
      message: "Organisation créée avec succès",
      organizationId: organization.id,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération d'organisation:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'organisation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
