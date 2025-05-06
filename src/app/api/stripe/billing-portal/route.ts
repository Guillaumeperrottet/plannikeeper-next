import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { createBillingPortalSession } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const orgUser = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        role: "admin", // Seuls les administrateurs peuvent gérer l'abonnement
      },
      include: { organization: true },
    });

    if (!orgUser) {
      return NextResponse.json(
        { error: "You must be an admin to manage billing" },
        { status: 403 }
      );
    }

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: orgUser.organization.id },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // URL de retour après la gestion de l'abonnement
    const returnUrl = req.nextUrl.searchParams.get("returnUrl") || "/dashboard";

    // Créer une session de portail de facturation
    const portalUrl = await createBillingPortalSession(
      subscription.stripeCustomerId,
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${returnUrl}`
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
