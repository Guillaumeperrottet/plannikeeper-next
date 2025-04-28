import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteUserButton } from "../delete-user-button";
import { UserRoleSelector } from "../user-role-selector";
import { ObjectAccessManager } from "../object-access-manager";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, Shield, User as UserIcon, Lock } from "lucide-react";

export default async function EditUserPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  const currentUser = await getUser();

  // Vérifiez que l'utilisateur est connecté
  if (!currentUser) {
    redirect("/signin");
  }

  // Récupérez l'organisation et le rôle de l'utilisateur courant
  const currentUserOrg = await prisma.organizationUser.findFirst({
    where: { userId: currentUser.id },
    include: { organization: true },
  });

  // Vérifiez que l'utilisateur courant est administrateur
  if (!currentUserOrg || currentUserOrg.role !== "admin") {
    redirect("/profile");
  }

  // Récupérez l'utilisateur à modifier
  const userToEdit = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userToEdit) {
    redirect("/profile/edit");
  }

  // Vérifiez que l'utilisateur à modifier appartient à la même organisation
  const userToEditOrg = await prisma.organizationUser.findFirst({
    where: {
      userId: userToEdit.id,
      organizationId: currentUserOrg.organizationId,
    },
  });

  if (!userToEditOrg) {
    redirect("/profile/edit");
  }

  // Récupérez tous les objets de l'organisation
  const objects = await prisma.objet.findMany({
    where: { organizationId: currentUserOrg.organizationId },
    orderBy: { nom: "asc" },
  });

  const isCurrentUser = currentUser.id === userToEdit.id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link
          href="/profile/edit"
          className="flex items-center text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Retour à la liste des utilisateurs
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[color:var(--muted)] flex items-center justify-center text-xl text-[color:var(--muted-foreground)]">
              {userToEdit.image ? (
                <img
                  src={userToEdit.image}
                  alt={userToEdit.name || ""}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                userToEdit.name?.[0] || "?"
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {userToEdit.name || "Utilisateur sans nom"}
                {isCurrentUser && (
                  <span className="ml-2 text-sm bg-[color:var(--muted)] text-[color:var(--muted-foreground)] px-2 py-0.5 rounded-full">
                    Vous
                  </span>
                )}
              </h1>
              <p className="text-[color:var(--muted-foreground)]">
                {userToEdit.email}
              </p>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/profile/edit">
              <ArrowLeft size={16} className="mr-2" />
              Liste des utilisateurs
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-[color:var(--primary)]" />
                <h2 className="text-lg font-medium">Rôle utilisateur</h2>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">
                  Rôle dans l&apos;organisation
                </label>
                <UserRoleSelector
                  userId={userToEdit.id}
                  currentRole={userToEditOrg.role}
                />
                <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                  Les administrateurs peuvent gérer les membres et modifier les
                  paramètres de l&apos;organisation
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden mt-6">
            <div className="p-4 sm:p-6 border-b border-[color:var(--border)] bg-[color:var(--destructive-background)]">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-[color:var(--destructive)]" />
                <h2 className="text-lg font-medium text-[color:var(--destructive)]">
                  Zone de danger
                </h2>
              </div>
            </div>

            <div className="p-5">
              <p className="mb-4 text-[color:var(--muted-foreground)]">
                {isCurrentUser
                  ? "Vous êtes sur le point de vous retirer de l'organisation. Cette action est irréversible."
                  : "En supprimant cet utilisateur, vous le retirez définitivement de l'organisation. Cette action est irréversible."}
              </p>
              <DeleteUserButton
                userId={userToEdit.id}
                userName={userToEdit.name || "cet utilisateur"}
                isCurrentUser={isCurrentUser}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden h-full">
            <div className="p-4 sm:p-6 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
              <div className="flex items-center gap-3">
                <UserIcon size={20} className="text-[color:var(--primary)]" />
                <h2 className="text-lg font-medium">Accès aux objets</h2>
              </div>
            </div>

            <div className="p-5">
              {objects.length === 0 ? (
                <div className="text-center py-10 text-[color:var(--muted-foreground)]">
                  <p>Aucun objet n&apos;a été créé dans cette organisation.</p>
                  <Link
                    href="/dashboard/objet/new"
                    className="text-[color:var(--primary)] hover:underline mt-2 inline-block"
                  >
                    Créer un objet
                  </Link>
                </div>
              ) : (
                <ObjectAccessManager
                  userId={userToEdit.id}
                  objects={objects}
                  organizationId={currentUserOrg.organizationId}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
