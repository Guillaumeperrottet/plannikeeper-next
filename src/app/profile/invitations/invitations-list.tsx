"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";

type InvitationCode = {
  id: string;
  code: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  objectPermissions?: Prisma.JsonValue;
};

export default function InvitationsList({
  invitationCodes,
  organizationName,
}: {
  invitationCodes: InvitationCode[];
  organizationName: string;
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, inviteId: string) => {
    try {
      // Construisez l'URL complète que les utilisateurs devront utiliser
      const inviteUrl = `${window.location.origin}/join/${code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedCode(inviteId);

      // Réinitialisez après 2 secondes
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  const revokeInvitation = async (inviteId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer ce code d'invitation ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/invitations/${inviteId}/revoke`, {
        method: "POST",
      });

      if (response.ok) {
        // Rafraîchissez la page pour mettre à jour la liste
        window.location.reload();
      } else {
        alert("Erreur lors de la révocation du code");
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Une erreur s'est produite");
    }
  };

  const getPermissionSummary = (objectPermissions?: Prisma.JsonValue) => {
    if (!objectPermissions || objectPermissions === null) return null;

    // Vérifier que c'est un objet
    if (
      typeof objectPermissions !== "object" ||
      Array.isArray(objectPermissions)
    ) {
      return null;
    }

    const permissions = Object.values(
      objectPermissions as Record<string, string>
    );
    const accessCount = permissions.filter((p) => p !== "none").length;

    if (accessCount === 0) return "Aucun accès";

    const permissionCounts = permissions.reduce(
      (acc, perm) => {
        if (perm !== "none") {
          acc[perm] = (acc[perm] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const summary = Object.entries(permissionCounts)
      .map(([perm, count]) => {
        const label =
          perm === "read"
            ? "L"
            : perm === "write"
              ? "M"
              : perm === "admin"
                ? "A"
                : perm;
        return `${count}${label}`;
      })
      .join(", ");

    return `${accessCount} objet(s): ${summary}`;
  };

  if (invitationCodes.length === 0) {
    return (
      <p className="text-[color:var(--muted-foreground)]">
        Aucun code d&apos;invitation actif.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-[color:var(--border)]">
        <thead>
          <tr className="bg-[color:var(--muted)]">
            <th className="p-2 text-left text-[color:var(--foreground)]">
              Code
            </th>
            <th className="p-2 text-left text-[color:var(--foreground)]">
              Rôle
            </th>
            <th className="p-2 text-left text-[color:var(--foreground)]">
              Permissions
            </th>
            <th className="p-2 text-left text-[color:var(--foreground)]">
              Date d&apos;expiration
            </th>
            <th className="p-2 text-left text-[color:var(--foreground)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invitationCodes.map((invite) => (
            <tr
              key={invite.id}
              className="border-t border-[color:var(--border)]"
            >
              <td className="p-2 font-mono text-[color:var(--foreground)]">
                {invite.code}
              </td>
              <td className="p-2 capitalize text-[color:var(--foreground)]">
                {invite.role}
              </td>
              <td className="p-2 text-[color:var(--foreground)] text-sm">
                {invite.role === "admin"
                  ? "Accès complet"
                  : getPermissionSummary(invite.objectPermissions) ||
                    "Non défini"}
              </td>
              <td className="p-2 text-[color:var(--foreground)]">
                {new Date(invite.expiresAt).toLocaleDateString()}
              </td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => copyToClipboard(invite.code, invite.id)}
                  className="text-[color:var(--primary)] hover:underline text-sm"
                >
                  {copiedCode === invite.id ? "Copié !" : "Copier le lien"}
                </button>
                <button
                  onClick={() => revokeInvitation(invite.id)}
                  className="text-[color:var(--destructive)] hover:underline text-sm ml-2"
                >
                  Révoquer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 p-3 bg-[color:var(--muted)] rounded-lg">
        <p className="text-sm text-[color:var(--muted-foreground)]">
          <strong className="text-[color:var(--foreground)]">
            Comment utiliser:
          </strong>{" "}
          Partagez le lien d&apos;invitation avec la personne que vous souhaitez
          inviter à rejoindre{" "}
          <strong className="text-[color:var(--foreground)]">
            {organizationName}
          </strong>
          . Le lien expirera à la date indiquée ou de la création du compte.
        </p>
      </div>
    </div>
  );
}
