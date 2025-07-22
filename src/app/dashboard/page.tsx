import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import ObjetCard from "@/app/components/ObjetCard";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { getAccessibleObjects } from "@/lib/auth-session";
import OrganizationRecovery from "./OrganizationRecovery";

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
    // Après redirection, vous nettoierez les métadonnées lors du processus de paiement
  }

  // Récupérer tous les objets de l'organisation
  const objets = await getAccessibleObjects(
    session.id,
    userWithOrg.Organization.id
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-background text-foreground overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
          Dashboard
        </h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/objet/new">
            <PlusCircle size={20} className="mr-2" />
            Nouvel objet
          </Link>
        </Button>
      </div>

      {objets.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground">
              Aucun objet trouvé
            </CardTitle>
            <CardDescription>
              Commencez par créer votre premier objet pour le voir apparaître
              ici.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/objet/new">
                <PlusCircle size={18} className="mr-2" />
                Créer un objet
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objets.map((objet) => (
            <ObjetCard key={objet.id} objet={objet} />
          ))}
        </div>
      )}
    </div>
  );
}
