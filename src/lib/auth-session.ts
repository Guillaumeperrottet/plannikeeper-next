import { auth } from "./auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";

// Types pour les niveaux d'accès
export type AccessLevel = "none" | "read" | "write" | "admin";

export const getUser = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  // CORRECTIF: Récupérer les informations complètes de l'utilisateur depuis la DB
  // car Better Auth ne retourne que les infos de base
  const userWithOrganization = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      Organization: true,
      OrganizationUser: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!userWithOrganization) {
    console.warn(
      "⚠️ Utilisateur trouvé dans la session mais pas en DB:",
      session.user.id
    );
    return session.user;
  }

  // Enrichir les données de session avec les infos d'organisation
  return {
    ...session.user,
    organizationId: userWithOrganization.organizationId,
    Organization: userWithOrganization.Organization,
    OrganizationUser: userWithOrganization.OrganizationUser,
    // Ajouter des informations d'appartenance
    hasOrganization: !!userWithOrganization.organizationId,
    isAdmin: userWithOrganization.OrganizationUser?.role === "admin",
    organizationRole: userWithOrganization.OrganizationUser?.role,
  };
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
  console.log("🔍 Vérification appartenance organisation:", {
    userId,
    objectId,
  });

  const userWithOrg = await prisma.user.findUnique({
    where: { id: userId },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    console.log("❌ Utilisateur sans organisation:", userId);
    return false;
  }

  const object = await prisma.objet.findUnique({
    where: { id: objectId },
    select: { organizationId: true },
  });

  if (!object) {
    console.log("❌ Objet introuvable:", objectId);
    return false;
  }

  const isMember = userWithOrg.Organization.id === object.organizationId;
  console.log("✅ Appartenance vérifiée:", {
    userOrgId: userWithOrg.Organization.id,
    objectOrgId: object.organizationId,
    isMember,
  });

  return isMember;
}

/**
 * Vérifie si l'utilisateur est administrateur de l'organisation
 */
export async function isOrganizationAdmin(userId: string): Promise<boolean> {
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId, role: "admin" },
  });

  const isAdmin = !!orgUser;
  console.log("🔧 Vérification admin:", { userId, isAdmin });
  return isAdmin;
}

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis pour un objet
 */
export async function checkObjectAccess(
  userId: string,
  objectId: string,
  requiredLevel: AccessLevel
): Promise<boolean> {
  console.log("🔐 Vérification accès objet:", {
    userId,
    objectId,
    requiredLevel,
  });

  // Les administrateurs ont toujours accès à tout
  const isAdmin = await isOrganizationAdmin(userId);
  if (isAdmin) {
    console.log("✅ Accès admin accordé");
    return true;
  }

  // Si le niveau requis est "none", pas besoin de vérifier plus loin
  if (requiredLevel === "none") {
    return true;
  }

  // Vérifier d'abord l'appartenance à l'organisation
  const isMember = await checkOrganizationMembership(userId, objectId);
  if (!isMember) {
    console.log("❌ Utilisateur pas membre de l'organisation");
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

  const hasAccess = userLevel >= requiredLevelValue;
  console.log("🔐 Résultat vérification accès:", {
    userLevel,
    requiredLevel: requiredLevelValue,
    hasAccess,
  });

  return hasAccess;
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

/**
 * NOUVELLE FONCTION: Récupère les objets accessibles pour un utilisateur
 * Cette fonction remplace la logique dans /api/objet/route.ts
 */
export async function getAccessibleObjects(
  userId: string,
  organizationId?: string
) {
  console.log("🏠 Récupération objets accessibles:", {
    userId,
    organizationId,
  });

  // Récupérer l'utilisateur avec son organisation si pas fournie
  let userOrgId = organizationId;
  if (!userOrgId) {
    const userWithOrg = await prisma.user.findUnique({
      where: { id: userId },
      include: { Organization: true },
    });
    userOrgId = userWithOrg?.Organization?.id;
  }

  if (!userOrgId) {
    console.log("❌ Pas d'organisation trouvée pour l'utilisateur");
    return [];
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = await isOrganizationAdmin(userId);

  // Si l'utilisateur est admin, retourner tous les objets
  if (isAdmin) {
    console.log("✅ Admin: retour de tous les objets");
    return prisma.objet.findMany({
      where: { organizationId: userOrgId },
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
  console.log("🔐 Objets avec accès:", objectIds);

  return prisma.objet.findMany({
    where: {
      id: { in: objectIds },
      organizationId: userOrgId,
    },
    orderBy: { nom: "asc" },
  });
}
