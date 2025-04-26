import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    redirect("/profile");
  }

  // On récupère tous les utilisateurs de cette organisation avec leur rôle
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: orgUser.organizationId },
    include: { user: true },
    orderBy: { user: { email: "asc" } },
  });

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <div className="flex gap-2">
          <Link
            href="/profile/invitations"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Gérer les invitations
          </Link>
          <Link
            href="/profile"
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Retour au profil
          </Link>
        </div>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">#</th>
            <th className="p-2">Email</th>
            <th className="p-2">Nom</th>
            <th className="p-2">Rôle</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orgUsers.map((ou, i) => (
            <tr key={ou.user.id} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{ou.user.email}</td>
              <td className="p-2">{ou.user.name}</td>
              <td className="p-2">{ou.role}</td>
              <td className="p-2">
                <Link
                  href={`/profile/edit/${ou.user.id}`}
                  className="mr-2 text-blue-600 hover:underline"
                >
                  Modifier
                </Link>
                {/* Ajoutez ici un bouton de suppression si besoin */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
