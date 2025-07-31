import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UsersTable } from "@/app/profile/edit/users-table";
import { Button } from "@/app/components/ui/button";
import { BackButton } from "@/app/components/ui/BackButton";
import { PlusCircle, Users } from "lucide-react";

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <BackButton
            href="/profile"
            label="Retour au profil"
            loadingMessage="Retour au profil..."
          />
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-8 text-center">
          <div className="mb-6">
            <Users className="w-16 h-16 mx-auto text-[color:var(--muted-foreground)] mb-4" />
            <h1 className="text-2xl font-bold text-[color:var(--foreground)] mb-2">
              Accès Restreint
            </h1>
            <p className="text-[color:var(--muted-foreground)] text-lg">
              Seuls les administrateurs peuvent gérer les utilisateurs
            </p>
          </div>

          <div className="bg-[color:var(--muted)] rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-[color:var(--foreground)] mb-3">
              Votre rôle actuel :{" "}
              <span className="text-[color:var(--primary)]">Membre</span>
            </h2>
            <p className="text-[color:var(--muted-foreground)] text-sm leading-relaxed">
              En tant que membre, vous pouvez consulter votre profil et modifier
              vos préférences, mais la gestion des utilisateurs (invitations,
              modification des rôles) est réservée aux administrateurs de
              l&apos;organisation.
            </p>
          </div>

          <div className="text-[color:var(--muted-foreground)] text-sm">
            <p>
              Besoin d&apos;accéder à cette fonctionnalité ? Contactez un
              administrateur de votre organisation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // On récupère tous les utilisateurs de cette organisation avec leur rôle
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: orgUser.organizationId },
    include: { user: true },
    orderBy: { user: { email: "asc" } },
  });

  // Récupérer le nom de l'organisation
  const organization = await prisma.organization.findUnique({
    where: { id: orgUser.organizationId },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <BackButton
          href="/profile"
          label="Retour au profil"
          loadingMessage="Retour au profil..."
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--foreground)]">
              Gestion des Utilisateurs
            </h1>
            <p className="text-[color:var(--muted-foreground)] mt-1">
              {organization?.name || "Organisation"} - {orgUsers.length} membre
              {orgUsers.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90"
            >
              <Link href="/profile/invitations">
                <PlusCircle size={16} className="mr-2" />
                Inviter des membres
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[color:var(--primary)]" />
            <h2 className="text-lg font-medium text-[color:var(--foreground)]">
              Liste des membres
            </h2>
          </div>
        </div>

        <div className="p-1 sm:p-2">
          <UsersTable
            users={orgUsers.map((ou) => ({
              id: ou.user.id,
              email: ou.user.email || "",
              name: ou.user.name || "",
              role: ou.role,
              avatar: ou.user.image,
              isCurrentUser: ou.user.id === user.id,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
