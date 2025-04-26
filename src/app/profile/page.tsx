import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditName from "./edit-name";
import EditOrganizationName from "./edit-organization-name";

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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-72 min-h-screen bg-[color:var(--sidebar-background)] border-r border-[color:var(--sidebar-border)] flex flex-col justify-between py-12 px-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-[color:var(--primary)] flex items-center justify-center text-xl text-[color:var(--primary-foreground)] font-bold">
              {orgUser?.organization?.name?.[0] ?? "?"}
            </div>
            <div>
              <div className="font-bold text-[color:var(--sidebar-foreground)]">
                {orgUser?.organization?.name ?? "Organisation"}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)] capitalize">
                {orgUser?.role}
              </div>
            </div>
          </div>
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded hover:bg-[color:var(--sidebar-accent)] text-[color:var(--sidebar-foreground)] font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="block px-3 py-2 rounded bg-[color:var(--sidebar-accent)] text-[color:var(--sidebar-primary)] font-semibold"
            >
              Profil
            </Link>
            <Link
              href="/profile/edit"
              className="block px-3 py-2 rounded hover:bg-[color:var(--sidebar-accent)] text-[color:var(--sidebar-foreground)]"
            >
              Gestion des utilisateurs
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 mt-10">
          <div className="w-10 h-10 rounded-full bg-[color:var(--muted)] flex items-center justify-center text-xl text-[color:var(--muted-foreground)] font-bold">
            {user.name?.[0] ?? "?"}
          </div>
          <div>
            <div className="font-semibold text-[color:var(--sidebar-foreground)]">
              {user.name}
            </div>
            <div className="text-xs text-[color:var(--muted-foreground)]">
              {user.email}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10 bg-background">
        <h1 className="text-3xl font-bold mb-8">Mon profil</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Carte Organisation */}
          {orgUser?.organization && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Organisation</h2>
                {isAdmin && (
                  <span className="px-2 py-1 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs font-semibold">
                    Admin
                  </span>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  Nom de l&apos;organisation
                </label>
                <EditOrganizationName
                  initialName={orgUser.organization.name}
                  organizationId={orgUser.organization.id}
                  isAdmin={isAdmin}
                />
                {isAdmin && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    En tant qu&apos;administrateur, vous pouvez modifier le nom
                    de l&apos;organisation
                  </p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Votre rôle : </span>
                <span className="capitalize">{orgUser.role}</span>
              </div>
            </div>
          )}

          {/* Carte Infos personnelles */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-xl font-semibold mb-3">
              Informations personnelles
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl text-muted-foreground font-bold">
                  {user.name?.[0] ?? "?"}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <label className="block font-semibold mb-1 text-foreground">
                    Nom
                  </label>
                  <EditName initialName={user.name ?? ""} />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cliquez sur le nom pour le modifier
                  </p>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email ?? ""}
                    disabled
                    className="w-full border border-border rounded px-3 py-2 bg-muted text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
