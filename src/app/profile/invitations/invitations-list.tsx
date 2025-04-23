"use client";

import { useState } from "react";

type InvitationCode = {
  id: string;
  code: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
};

export default function InvitationsList({
  invitationCodes,
  organizationName
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

  if (invitationCodes.length === 0) {
    return <p className="text-gray-500">Aucun code d invitation actif.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Code</th>
            <th className="p-2 text-left">Rôle</th>
            <th className="p-2 text-left">Date d expiration</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invitationCodes.map((invite) => (
            <tr key={invite.id} className="border-t">
              <td className="p-2 font-mono">{invite.code}</td>
              <td className="p-2 capitalize">{invite.role}</td>
              <td className="p-2">
                {new Date(invite.expiresAt).toLocaleDateString()}
              </td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => copyToClipboard(invite.code, invite.id)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {copiedCode === invite.id ? "Copié !" : "Copier le lien"}
                </button>
                <button
                  onClick={() => revokeInvitation(invite.id)}
                  className="text-red-600 hover:underline text-sm ml-2"
                >
                  Révoquer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Comment utiliser:</strong> Partagez le lien d invitation avec la personne que vous souhaitez inviter à rejoindre <strong>{organizationName}</strong>. Le lien expirera à la date indiquée.
        </p>
      </div>
    </div>
  );
}
