import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditName from "./edit-name";
import EditOrganizationName from "./edit-organization-name";
import ChangePasswordForm from "./change-password-form";
import UpdateProfileImage from "./UpdateProfileImage";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/signin");

  // Récupérer l'organisation de l'utilisateur avec son rôle
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  // Vérifier si l'utilisateur est admin
  const isAdmin = orgUser?.role === "admin";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 bg-background">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-[color:var(--foreground)]">
          Mon profil
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Carte Infos personnelles - Déplacée en premier pour mobile */}
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4 sm:p-6 shadow-sm flex flex-col gap-3 sm:gap-4 order-1 lg:order-2">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-[color:var(--foreground)]">
              Informations personnelles
            </h2>
            <div className="flex flex-col items-center gap-6 mb-4">
              <UpdateProfileImage
                initialImage={user.image ?? null}
                userName={user.name ?? ""}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex-1 w-full text-center sm:text-left">
                <div className="mb-3">
                  <label className="block font-semibold mb-1 text-[color:var(--foreground)]">
                    Nom
                  </label>
                  <EditName initialName={user.name ?? ""} />
                  <p className="mt-1 text-xs sm:text-sm text-[color:var(--muted-foreground)]">
                    Cliquez sur le nom pour le modifier
                  </p>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[color:var(--foreground)]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email ?? ""}
                    disabled
                    className="w-full border border-[color:var(--border)] rounded px-3 py-2 bg-[color:var(--muted)] text-[color:var(--muted-foreground)] text-sm"
                  />
                </div>

                <div className="mt-4 border-t border-[color:var(--border)] pt-4">
                  <label className="block font-semibold mb-1 text-[color:var(--foreground)]">
                    Sécurité
                  </label>
                  <ChangePasswordForm />
                </div>
              </div>
            </div>
          </div>

          {/* Carte Organisation */}
          {orgUser?.organization && (
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4 sm:p-6 shadow-sm flex flex-col gap-3 sm:gap-4 order-2 lg:order-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg sm:text-xl font-semibold text-[color:var(--foreground)]">
                  Organisation
                </h2>
                {isAdmin && (
                  <span className="px-2 py-1 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs font-semibold">
                    Admin
                  </span>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[color:var(--foreground)]">
                  Nom de l&apos;organisation
                </label>
                <EditOrganizationName
                  initialName={orgUser.organization.name}
                  organizationId={orgUser.organization.id}
                  isAdmin={isAdmin}
                />
                {isAdmin && (
                  <p className="mt-1 text-xs sm:text-sm text-[color:var(--muted-foreground)]">
                    En tant qu&apos;administrateur, vous pouvez modifier le nom
                    de l&apos;organisation
                  </p>
                )}
              </div>
              <div className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">
                <span className="font-medium">Votre rôle : </span>
                <span className="capitalize">{orgUser.role}</span>
              </div>
              <Link
                href="/profile/edit"
                className="mt-2 block w-full py-3 sm:py-2 text-center sm:text-left rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 text-sm font-medium transition-colors sm:px-3 sm:w-auto"
              >
                Gestion des utilisateurs
              </Link>
              <Link
                href="/profile/notifications"
                className="mt-2 block w-full py-3 sm:py-2 text-center sm:text-left rounded-md bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 text-sm font-medium transition-colors sm:px-3 sm:w-auto"
              >
                Gestion des notifications
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
