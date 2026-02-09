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
import OrganizationRecovery from "../OrganizationRecovery";

export const metadata = {
  title: "Mes Objets | Plannikeeper",
  description: "Liste de tous vos objets immobiliers",
};

export default async function ObjetsPage() {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // ✅ OPTIMISATION: Une seule requête pour récupérer toutes les infos utilisateur
  const userData = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      metadata: true,
      organizationId: true,
      Organization: {
        select: {
          id: true,
          name: true,
        },
      },
      OrganizationUser: {
        select: { role: true },
      },
    },
  });

  if (!userData?.Organization) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <OrganizationRecovery />
      </div>
    );
  }

  // Vérifier si metadata existe et contient pendingPlanUpgrade
  const pendingPlan = userData.metadata
    ? (userData.metadata as { pendingPlanUpgrade?: string })?.pendingPlanUpgrade
    : undefined;

  if (pendingPlan && userData.organizationId) {
    // Rediriger vers la page de paiement
    redirect(`/pricing?plan=${pendingPlan}&newSignup=true`);
  }

  // Récupérer tous les objets de l'organisation
  const objets = await getAccessibleObjects(
    session.id,
    userData.Organization.id,
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-background text-foreground overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[color:var(--foreground)]">
            Mes Objets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez tous vos biens immobiliers
          </p>
        </div>
        <Button asChild>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {objets.map((objet) => (
            <ObjetCard key={objet.id} objet={objet} />
          ))}
        </div>
      )}
    </div>
  );
}
