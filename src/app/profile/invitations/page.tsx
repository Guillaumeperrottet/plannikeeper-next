// src/app/profile/invitations/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GenerateInviteForm from "./generate-invite-form";
import InvitationsList from "./invitations-list";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function InvitationsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/signin");
  }

  // Vérifiez si l'utilisateur est admin
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (!orgUser || orgUser.role !== "admin") {
    // Au lieu de rediriger, affichons un message explicatif pour les membres
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center px-4 py-2 bg-[color:var(--muted)] rounded hover:bg-[color:var(--muted)]/80 transition text-[color:var(--foreground)]"
          >
            ← Retour au profil
          </Link>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-8 text-center">
          <div className="mb-6">
            <PlusCircle className="w-16 h-16 mx-auto text-[color:var(--muted-foreground)] mb-4" />
            <h1 className="text-2xl font-bold text-[color:var(--foreground)] mb-2">
              Invitations Réservées aux Administrateurs
            </h1>
            <p className="text-[color:var(--muted-foreground)] text-lg">
              Seuls les administrateurs peuvent créer des codes
              d&apos;invitation
            </p>
          </div>

          <div className="bg-[color:var(--muted)] rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-[color:var(--foreground)] mb-3">
              Votre rôle actuel :{" "}
              <span className="text-[color:var(--primary)]">Membre</span>
            </h2>
            <p className="text-[color:var(--muted-foreground)] text-sm leading-relaxed">
              En tant que membre, vous ne pouvez pas créer d&apos;invitations ou
              gérer les codes existants. Cette fonctionnalité est réservée aux
              administrateurs pour maintenir la sécurité de l&apos;organisation.
            </p>
          </div>

          <div className="text-[color:var(--muted-foreground)] text-sm">
            <p>
              Vous souhaitez inviter quelqu&apos;un ? Demandez à un
              administrateur de créer une invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Récupérez les codes d'invitation actifs avec un contournement temporaire
  const invitationCodes = await prisma.invitationCode.findMany({
    where: {
      organizationId: orgUser.organizationId,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-[color:var(--background)] rounded-lg shadow-md border border-[color:var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
          Invitations
        </h1>
        <Link
          href="/profile/edit"
          className="px-4 py-2 bg-[color:var(--muted)] rounded hover:bg-[color:var(--muted)]/80 transition text-[color:var(--foreground)]"
        >
          Retour aux utilisateurs
        </Link>
      </div>

      <GenerateInviteForm
        organizationId={orgUser.organizationId}
        userId={user.id}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-[color:var(--foreground)]">
          Codes d&apos;invitation actifs
        </h2>
        <InvitationsList
          invitationCodes={invitationCodes}
          organizationName={orgUser.organization.name}
        />
      </div>
    </div>
  );
}
