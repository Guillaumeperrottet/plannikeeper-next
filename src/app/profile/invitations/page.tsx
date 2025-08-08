// src/app/profile/invitations/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GenerateInviteForm from "./generate-invite-form";
import InvitationsList from "./invitations-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/app/components/ui/BackButton";
import { 
  Users, 
  ShieldAlert, 
  Send, 
  Clock
} from "lucide-react";

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
    // Interface moderne pour les membres non-administrateurs
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <BackButton
              href="/profile/edit"
              label="Retour à la gestion"
              loadingMessage="Retour..."
            />
          </div>

          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="rounded-full bg-muted p-6">
              <ShieldAlert className="h-12 w-12 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Gestion des Invitations
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Fonctionnalité réservée aux administrateurs
              </p>
            </div>

            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Votre statut
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    Membre
                  </Badge>
                </div>
                
                <Alert>
                  <AlertDescription className="text-sm leading-relaxed">
                    Les membres ne peuvent pas créer ou gérer les codes d&apos;invitation. 
                    Cette fonctionnalité est réservée aux administrateurs pour maintenir 
                    la sécurité de l&apos;organisation.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Besoin d&apos;inviter quelqu&apos;un ?
                  </p>
                  <p className="text-sm font-medium">
                    Contactez un administrateur de votre organisation.
                  </p>
                </div>
              </CardContent>
            </Card>
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header avec navigation */}
        <div className="flex items-center gap-4">
          <BackButton
            href="/profile/edit"
            label="Retour à la gestion"
            loadingMessage="Retour..."
          />
        </div>

        {/* En-tête principal */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Gestion des Invitations
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{orgUser.organization.name}</span>
              <span>•</span>
              <Badge variant="outline" className="gap-1">
                <Send className="h-3 w-3" />
                {invitationCodes.length} code{invitationCodes.length !== 1 ? "s" : ""} actif{invitationCodes.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          <Badge variant="default" className="gap-2">
            <Users className="h-3 w-3" />
            Administrateur
          </Badge>
        </div>

        {/* Formulaire de génération */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Créer une Invitation
            </CardTitle>
            <CardDescription>
              Générez un code d&apos;invitation pour permettre à de nouveaux utilisateurs 
              de rejoindre votre organisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenerateInviteForm
              organizationId={orgUser.organizationId}
              userId={user.id}
            />
          </CardContent>
        </Card>

        {/* Liste des codes actifs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Codes d&apos;Invitation Actifs
            </CardTitle>
            <CardDescription>
              Gérez les codes d&apos;invitation existants et suivez leur utilisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationsList
              invitationCodes={invitationCodes}
              organizationName={orgUser.organization.name}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
