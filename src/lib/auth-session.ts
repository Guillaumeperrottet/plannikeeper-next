import { auth } from "./auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";

// Types pour les niveaux d'accès
export type AccessLevel = "none" | "read" | "write" | "admin";

export const getUser = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  return session?.user;
};

export const getRequiredUser = async () => {
  const user = await getUser();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Vérifie si l'utilisateur appartient à la même organisation que l'objet
 */
export async function checkOrganizationMembership(
  userId: string,
  objectId: string
): Promise<boolean> {
  const userWithOrg = await prisma.user.findUnique({
    where: { id: userId },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    return false;
  }

  const object = await prisma.objet.findUnique({
    where: { id: objectId },
    select: { organizationId: true },
  });

  if (!object) {
    return false;
  }

  return userWithOrg.Organization.id === object.organizationId;
}

/**
 * Vérifie si l'utilisateur est administrateur de l'organisation
 */
export async function isOrganizationAdmin(userId: string): Promise<boolean> {
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId, role: "admin" },
  });

  return !!orgUser;
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour un objet
 */
export async function checkObjectAccess(
  userId: string,
  objectId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Si le niveau requis est "none", pas besoin de vérifier plus loin
  if (requiredLevel === "none") {
    return true;
  }

  // Vérifier d'abord l'appartenance à l'organisation
  const isMember = await checkOrganizationMembership(userId, objectId);
  if (!isMember) {
    return false;
  }

  // Récupérer le niveau d'accès de l'utilisateur pour cet objet
  const access = await prisma.objectAccess.findUnique({
    where: {
      userId_objectId: { userId, objectId },
    },
  });

  // Mapping des niveaux d'accès en valeurs numériques pour comparaison
  const accessLevels: Record<AccessLevel, number> = {
    none: 0,
    read: 1,
    write: 2,
    admin: 3,
  };

  // Par défaut, si aucun accès spécifique n'est défini, l'utilisateur a un accès "none"
  const userLevel = access
    ? accessLevels[access.accessLevel as AccessLevel]
    : 0;
  const requiredLevelValue = accessLevels[requiredLevel];

  return userLevel >= requiredLevelValue;
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour un secteur
 * (via l'objet parent)
 */
export async function checkSectorAccess(
  userId: string,
  sectorId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Récupérer le secteur avec son objet parent
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    include: { object: true },
  });

  if (!sector) {
    return false;
  }

  // Déléguer la vérification à la fonction checkObjectAccess
  return checkObjectAccess(userId, sector.objectId, requiredLevel);
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour un article
 * (via le secteur et l'objet parent)
 */
export async function checkArticleAccess(
  userId: string,
  articleId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Récupérer l'article avec son secteur et l'objet parent
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return false;
  }

  // Déléguer la vérification à la fonction checkObjectAccess
  return checkObjectAccess(userId, article.sector.objectId, requiredLevel);
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour une tâche
 * (via l'article, le secteur et l'objet parent)
 */
export async function checkTaskAccess(
  userId: string,
  taskId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    return true;
  }

  // Récupérer la tâche avec son article, secteur et l'objet parent
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: {
            include: { object: true },
          },
        },
      },
    },
  });

  if (!task) {
    return false;
  }

  // Déléguer la vérification à la fonction checkObjectAccess
  return checkObjectAccess(userId, task.article.sector.objectId, requiredLevel);
}

// Dans auth-session.ts
export async function getAccessibleObjects(
  userId: string,
  organizationId: string
) {
  // Vérifier si l'utilisateur est admin
  const isAdmin = await isOrganizationAdmin(userId);

  // Si l'utilisateur est admin, retourner tous les objets
  if (isAdmin) {
    return prisma.objet.findMany({
      where: { organizationId },
      orderBy: { nom: "asc" },
    });
  }

  // Sinon, uniquement retourner les objets auxquels l'utilisateur a accès
  const objectAccess = await prisma.objectAccess.findMany({
    where: {
      userId,
      NOT: { accessLevel: "none" },
    },
    select: { objectId: true },
  });

  const objectIds = objectAccess.map((access) => access.objectId);

  return prisma.objet.findMany({
    where: {
      id: { in: objectIds },
      organizationId,
    },
    orderBy: { nom: "asc" },
  });
}
