// src/lib/object-access-utils.ts
import { prisma } from "@/lib/prisma";

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Récupère tous les utilisateurs qui ont accès à un objet spécifique.
 * Cela inclut :
 * - Les administrateurs de l'organisation (qui ont accès à tout)
 * - Les utilisateurs avec un accès explicite à l'objet (niveau différent de "none")
 */
export async function getUsersWithObjectAccess(
  objectId: string
): Promise<User[]> {
  // Récupérer l'objet pour connaître l'organisation
  const object = await prisma.objet.findUnique({
    where: { id: objectId },
    select: { organizationId: true },
  });

  if (!object) {
    return [];
  }

  // Récupérer les admins de l'organisation (ils ont accès à tout)
  const adminUsers = await prisma.organizationUser.findMany({
    where: {
      organizationId: object.organizationId,
      role: "admin",
    },
    include: { user: true },
  });

  // Récupérer les utilisateurs avec accès explicite à cet objet
  const usersWithObjectAccess = await prisma.objectAccess.findMany({
    where: {
      objectId: objectId,
      accessLevel: {
        not: "none",
      },
    },
    include: {
      user: {
        include: {
          OrganizationUser: {
            where: {
              organizationId: object.organizationId,
            },
          },
        },
      },
    },
  });

  // Combiner les deux listes et éliminer les doublons
  const userMap = new Map<string, User>();

  // Ajouter les admins
  adminUsers.forEach((orgUser) => {
    userMap.set(orgUser.user.id, {
      id: orgUser.user.id,
      name: orgUser.user.name ?? "",
      email: orgUser.user.email ?? "",
    });
  });

  // Ajouter les utilisateurs avec accès explicite (vérifier qu'ils appartiennent à l'organisation)
  usersWithObjectAccess.forEach((access) => {
    if (access.user.OrganizationUser) {
      userMap.set(access.user.id, {
        id: access.user.id,
        name: access.user.name ?? "",
        email: access.user.email ?? "",
      });
    }
  });

  // Convertir en tableau et trier par nom
  return Array.from(userMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

/**
 * Vérifie si un utilisateur a accès à un objet spécifique
 */
export async function hasUserObjectAccess(
  userId: string,
  objectId: string
): Promise<boolean> {
  // Récupérer l'objet pour connaître l'organisation
  const object = await prisma.objet.findUnique({
    where: { id: objectId },
    select: { organizationId: true },
  });

  if (!object) {
    return false;
  }

  // Vérifier si l'utilisateur est admin de l'organisation
  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: userId,
      organizationId: object.organizationId,
      role: "admin",
    },
  });

  if (isAdmin) {
    return true;
  }

  // Vérifier l'accès explicite à l'objet
  const objectAccess = await prisma.objectAccess.findUnique({
    where: {
      userId_objectId: {
        userId: userId,
        objectId: objectId,
      },
    },
  });

  return objectAccess ? objectAccess.accessLevel !== "none" : false;
}
