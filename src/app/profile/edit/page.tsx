import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UsersTable } from "@/app/profile/edit/users-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
import { PlusCircle, Users, ShieldAlert } from "lucide-react";

export default async function ProfileEditPage() {
  const user = await getUser();
  if (!user) {
    redirect("/profile");
  }

  // On récupère l'organisation courante de l'utilisateur connecté
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    select: { organizationId: true, role: true },
  });

  if (!orgUser || orgUser.role !== "admin") {
    // Au lieu de rediriger, affichons un message explicatif pour les membres
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <BackButton
              href="/profile"
              label="Retour au profil"
              loadingMessage="Retour au profil..."
            />
          </div>

          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="rounded-full bg-muted p-6">
              <ShieldAlert className="h-12 w-12 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Accès Restreint
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Seuls les administrateurs peuvent gérer les utilisateurs de
                l&apos;organisation
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 max-w-lg space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium">Votre rôle actuel :</span>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  Membre
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                En tant que membre, vous pouvez consulter votre profil et
                modifier vos préférences, mais la gestion des utilisateurs est
                réservée aux administrateurs.
              </p>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Besoin d&apos;accéder à cette fonctionnalité ?
              </p>
              <p className="text-sm text-muted-foreground">
                Contactez un administrateur de votre organisation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // On récupère tous les utilisateurs de cette organisation avec leur rôle et leurs accès
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: orgUser.organizationId },
    include: {
      user: {
        include: {
          objectAccess: {
            where: {
              NOT: { accessLevel: "none" },
            },
            include: {
              object: {
                select: {
                  id: true,
                  nom: true,
                  icon: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { user: { email: "asc" } },
  });

  // Récupérer le nom de l'organisation
  const organization = await prisma.organization.findUnique({
    where: { id: orgUser.organizationId },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <BackButton
            href="/profile"
            label="Retour au profil"
            loadingMessage="Retour au profil..."
          />
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{organization?.name || "Organisation"}</span>
              <span>•</span>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {orgUsers.length} membre{orgUsers.length > 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          <Button asChild size="lg" className="gap-2 invite-button">
            <Link href="/profile/invitations">
              <PlusCircle className="h-4 w-4" />
              Inviter des membres
            </Link>
          </Button>
        </div>

        <UsersTable
          users={orgUsers.map((ou) => ({
            id: ou.user.id,
            email: ou.user.email || "",
            name: ou.user.name || "",
            role: ou.role,
            avatar: ou.user.image,
            isCurrentUser: ou.user.id === user.id,
            objectAccess: ou.user.objectAccess || [],
          }))}
        />
      </div>
    </div>
  );
}
