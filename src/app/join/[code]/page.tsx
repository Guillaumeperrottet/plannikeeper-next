import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JoinPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;
  const user = await getUser();

  // Vérifiez si le code est valide
  const invitation = await prisma.invitationCode.findFirst({
    where: {
      code,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: { organization: true },
  });

  // Si le code est invalide, affichez un message d'erreur
  if (!invitation) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Code d invitation invalide</h1>
        <p className="mb-6 text-gray-600">
          Ce code d invitation est invalide, a expiré ou a déjà été utilisé.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Retour à l accueil
        </Link>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, redirigez vers la page de connexion
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Rejoindre {invitation.organization.name}</h1>
        <p className="mb-6 text-gray-600">
          Vous avez été invité à rejoindre {invitation.organization.name}. Veuillez vous connecter ou créer un compte pour continuer.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href={`/signin?redirect=/join/${code}`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Se connecter
          </Link>
          <Link
            href={`/signup?redirect=/join/${code}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  // Vérifiez si l'utilisateur est déjà membre de l'organisation
  const existingMembership = await prisma.organizationUser.findFirst({
    where: {
      userId: user.id,
      organizationId: invitation.organizationId,
    },
  });

  if (existingMembership) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Déjà membre</h1>
        <p className="mb-6 text-gray-600">
          Vous êtes déjà membre de {invitation.organization.name}.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Aller au tableau de bord
        </Link>
      </div>
    );
  }

  // Ajoutez l'utilisateur à l'organisation avec le rôle spécifié
  await prisma.organizationUser.create({
    data: {
      userId: user.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
    },
  });

  // Marquez le code comme utilisé
  await prisma.invitationCode.update({
    where: { id: invitation.id },
    data: { isUsed: true },
  });

  // Redirigez vers le tableau de bord
  redirect("/dashboard");
}
