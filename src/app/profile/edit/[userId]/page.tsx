// src/app/profile/users/[userId]/edit/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteUserButton } from "../delete-user-button";
import { UserRoleSelector } from "../user-role-selector";
import { ObjectAccessManager } from "../object-access-manager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackButton } from "@/app/components/ui/BackButton";
import {
  Shield,
  User as UserIcon,
  AlertTriangle,
  Mail,
  Settings,
  Building,
} from "lucide-react";

export default async function EditUserPage({
  params,
}: {
  // Typage mis à jour : params est une Promise qui résout { userId: string }
  params: Promise<{ userId: string }>;
}) {
  // Récupération de l'userId depuis la promesse
  const { userId } = await params;
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
    orderBy: { nom: "asc" },
  });

  const isCurrentUser = currentUser.id === userToEdit.id;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header avec navigation */}
      <div className="mb-8">
        <BackButton
          href="/profile/edit"
          label="Retour à la liste des utilisateurs"
          loadingMessage="Retour en cours..."
        />

        {/* En-tête utilisateur moderne */}
        <div className="mt-6">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={userToEdit.image || undefined}
                    alt={userToEdit.name || ""}
                  />
                  <AvatarFallback className="text-2xl font-semibold bg-primary/10">
                    {userToEdit.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl">
                      {userToEdit.name || "Utilisateur sans nom"}
                    </CardTitle>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="gap-1">
                        <UserIcon className="h-3 w-3" />
                        Vous
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <CardDescription className="text-base">
                      {userToEdit.email}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Layout en grille moderne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar avec paramètres utilisateur */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Rôle utilisateur */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Rôle utilisateur
              </CardTitle>
              <CardDescription>
                Gérer les permissions dans l&apos;organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Rôle dans l&apos;organisation
                </label>
                <UserRoleSelector
                  userId={userToEdit.id}
                  currentRole={userToEditOrg.role}
                  isCurrentUser={isCurrentUser}
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 border border-dashed">
                <p className="text-sm text-muted-foreground">
                  <strong>Info :</strong> Les administrateurs peuvent gérer les
                  membres et modifier les paramètres de l&apos;organisation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Zone de danger modernisée */}
          <Card className="border-destructive/50">
            <CardHeader className="pb-3 bg-destructive/5">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Zone de danger
              </CardTitle>
              <CardDescription>
                Actions irréversibles sur ce compte utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 mb-4">
                <p className="text-sm text-destructive">
                  {isCurrentUser
                    ? "⚠️ Vous êtes sur le point de vous retirer de l'organisation."
                    : "⚠️ Supprimer cet utilisateur le retirera définitivement de l'organisation."}
                  <br />
                  <strong>Cette action est irréversible.</strong>
                </p>
              </div>

              <DeleteUserButton
                userId={userToEdit.id}
                userName={userToEdit.name || "cet utilisateur"}
                isCurrentUser={isCurrentUser}
              />
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal - Accès aux objets */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Accès aux objets
              </CardTitle>
              <CardDescription>
                Gérer les permissions d&apos;accès aux différents objets de
                l&apos;organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objects.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Building className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Aucun objet trouvé
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun objet n&apos;a été créé dans cette organisation.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/dashboard/objet/new">
                        <Settings className="h-4 w-4 mr-2" />
                        Créer un objet
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <ObjectAccessManager
                  userId={userToEdit.id}
                  objects={objects}
                  organizationId={currentUserOrg.organizationId}
                  isTargetUserAdmin={userToEditOrg.role === "admin"}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
