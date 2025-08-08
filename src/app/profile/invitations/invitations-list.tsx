"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Trash2, 
  Check, 
  Clock, 
  User, 
  Shield,
  Eye,
  Edit,
  Crown,
  Calendar,
  Info
} from "lucide-react";

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

    return { accessCount, permissionCounts };
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "read":
        return <Eye className="h-3 w-3" />;
      case "write":
        return <Edit className="h-3 w-3" />;
      case "admin":
        return <Crown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case "read":
        return "Lecture";
      case "write":
        return "Modification";
      case "admin":
        return "Administration";
      default:
        return permission;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };

  const getRoleIcon = (role: string) => {
    return role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />;
  };

  const formatExpirationDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expiré";
    if (diffDays === 0) return "Expire aujourd'hui";
    if (diffDays === 1) return "Expire demain";
    return `Expire dans ${diffDays} jours`;
  };

  if (invitationCodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          Aucun code d&apos;invitation actif
        </h3>
        <p className="text-sm text-muted-foreground">
          Créez votre premier code d&apos;invitation pour commencer à inviter des utilisateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitationCodes.map((invite) => {
        const permissionSummary = getPermissionSummary(invite.objectPermissions);
        const isExpiringSoon = new Date(invite.expiresAt).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // 1 jour
        
        return (
          <Card key={invite.id} className={`transition-colors ${isExpiringSoon ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    Code: <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{invite.code}</code>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatExpirationDate(new Date(invite.expiresAt))}
                    {isExpiringSoon && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Expire bientôt
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Badge variant={getRoleBadgeVariant(invite.role)} className="gap-1">
                  {getRoleIcon(invite.role)}
                  {invite.role === "admin" ? "Administrateur" : "Membre"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Permissions */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissions
                </h4>
                {invite.role === "admin" ? (
                  <Badge variant="default" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Accès complet à tous les objets
                  </Badge>
                ) : permissionSummary && typeof permissionSummary === 'object' ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Accès à {permissionSummary.accessCount} objet(s)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(permissionSummary.permissionCounts).map(([perm, count]) => (
                        <Badge key={perm} variant="outline" className="gap-1 text-xs">
                          {getPermissionIcon(perm)}
                          {count} {getPermissionLabel(perm)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Aucun accès configuré
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Créé le {new Date(invite.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(invite.code, invite.id)}
                    className="gap-1"
                  >
                    {copiedCode === invite.id ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copier le lien
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeInvitation(invite.id)}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Révoquer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Comment utiliser :</strong> Partagez le lien d&apos;invitation avec la personne que vous souhaitez
          inviter à rejoindre <strong>{organizationName}</strong>. 
          Le lien expirera à la date indiquée ou dès la création du compte.
        </AlertDescription>
      </Alert>
    </div>
  );
}
