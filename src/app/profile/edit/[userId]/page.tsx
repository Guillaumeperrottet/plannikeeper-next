// src/app/profile/edit/[userId]/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteUserButton } from "../delete-user-button";
import { UserRoleSelector } from "../user-role-selector";
import { ObjectAccessManager } from "../object-access-manager";

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
  });

  // Ici, nous aurions besoin de récupérer les accès de l'utilisateur aux objets
  // Pour l'instant, nous allons supposer que tous les utilisateurs ont accès à tous les objets
  // Nous ajouterons la logique d'accès spécifique plus tard

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Modifier l&apos;utilisateur: {userToEdit.name}
        </h1>
        <Link
          href="/profile/edit"
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Retour
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl">
            {userToEdit.name?.[0] || "?"}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{userToEdit.name}</h2>
            <p className="text-gray-600">{userToEdit.email}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Rôle</label>
          <UserRoleSelector
            userId={userToEdit.id}
            currentRole={userToEditOrg.role}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Accès aux objets</h2>
        <ObjectAccessManager
          userId={userToEdit.id}
          objects={objects}
          organizationId={currentUserOrg.organizationId}
        />
      </div>

      <div className="border-t pt-6 mt-8">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          Zone de danger
        </h2>
        <p className="mb-4 text-gray-600">
          En supprimant cet utilisateur, vous le retirez définitivement de
          l&apos;organisation. Cette action est irréversible.
        </p>
        <DeleteUserButton
          userId={userToEdit.id}
          userName={userToEdit.name || "cet utilisateur"}
          isCurrentUser={userToEdit.id === currentUser.id}
        />
      </div>
    </div>
  );
}
