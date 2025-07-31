// src/types/invitation.ts
export interface ObjectPermission {
  objectId: string;
  objectName: string;
  objectAddress: string;
  accessLevel: "none" | "read" | "write" | "admin";
}

export interface InvitationFormData {
  role: "member" | "admin";
  objectPermissions?: Record<string, string>; // objectId -> accessLevel
}

export interface OrganizationObject {
  id: string;
  nom: string;
  adresse: string;
  secteur: string;
  icon?: string;
}

// Type pour les données de création d'invitation compatible avec Prisma
export interface InvitationCreateInput {
  code: string;
  role: string;
  organizationId: string;
  createdBy: string;
  expiresAt: Date;
  objectPermissions?: Record<string, string> | null;
}

export interface InvitationCreateData {
  code: string;
  role: string;
  organizationId: string;
  createdBy: string;
  expiresAt: Date;
  objectPermissions?: Record<string, string> | null;
}

export interface InvitationWithPermissions {
  id: string;
  code: string;
  organizationId: string;
  role: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  objectPermissions?: Record<string, string> | null;
  organization?: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
