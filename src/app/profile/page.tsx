import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditName from "./edit-name";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/signin");

  // Récupérer l'organisation de l'utilisateur
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
      {orgUser?.organization && (
        <div className="mb-6">
          <span className="text-gray-700 font-semibold">Organisation : </span>
          <span className="text-gray-900">{orgUser.organization.name}</span>
        </div>
      )}
      <div className="mt-8 flex justify-end">
        <Link
          href="/profile/edit"
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition"
        >
          Gestion des utilisateurs
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500">
            {user.name?.[0] ?? "?"}
          </div>
        </div>
        {/* Infos utilisateur */}
        <div className="flex-1 w-full">
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Nom
            </label>
            <EditName initialName={user.name ?? ""} />
            <p className="mt-1 text-sm text-gray-500">
              Cliquez sur le nom pour le modifier
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email ?? ""}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
