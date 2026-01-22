import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getAccessibleObjects } from "@/lib/auth-session";
import OrganizationRecovery from "./OrganizationRecovery";
import DashboardTabs from "./DashboardTabs";

export default async function DashboardPage() {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Récupérer l'organisation de l'utilisateur
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <OrganizationRecovery />
      </div>
    );
  }

  // Vérifier si l'utilisateur a un plan en attente
  const userWithMetadata = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      metadata: true,
      organizationId: true,
    },
  });

  // Vérifier si metadata existe et contient pendingPlanUpgrade
  const pendingPlan = userWithMetadata?.metadata
    ? (userWithMetadata.metadata as { pendingPlanUpgrade?: string })
        ?.pendingPlanUpgrade
    : undefined;

  if (pendingPlan && userWithMetadata && userWithMetadata.organizationId) {
    // Rediriger vers la page de paiement
    redirect(`/pricing?plan=${pendingPlan}&newSignup=true`);
  }

  // Récupérer tous les objets de l'organisation
  const objets = await getAccessibleObjects(
    session.id,
    userWithOrg.Organization.id,
  );

  return (
    <DashboardTabs
      initialObjets={objets}
      userId={session.id}
      userName={session.name || ""}
    />
  );
}
