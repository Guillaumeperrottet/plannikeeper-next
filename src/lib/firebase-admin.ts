// src/lib/firebase-admin.ts
import { cert, initializeApp, getApps, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialiser l'application Firebase Admin si elle n'existe pas déjà
let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
} else {
  adminApp = getApps()[0];
}

// Envoyer une notification à un utilisateur spécifique
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  try {
    // Récupérer tous les tokens de l'utilisateur depuis la base de données
    const tokens = await getUserDeviceTokens(userId);

    if (!tokens.length) {
      console.log(`No device tokens found for user ${userId}`);
      return;
    }

    // Créer le message
    const multicastMessage = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    // Envoyer le message
    const response =
      await getMessaging().sendEachForMulticast(multicastMessage);

    console.log(
      `Notifications sent: ${response.responses.filter((r) => r.success).length}/${tokens.length}`
    );

    // Gérer les tokens invalides
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
      }
    });

    // Nettoyer les tokens invalides de la base de données
    if (failedTokens.length > 0) {
      await removeInvalidTokens(failedTokens);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

// Récupérer les tokens de dispositif d'un utilisateur
const getUserDeviceTokens = async (userId: string): Promise<string[]> => {
  // Ici, nous utilisons Prisma pour récupérer les tokens depuis la base de données
  const { prisma } = await import("./prisma");

  const deviceTokens = await prisma.deviceToken.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      token: true,
    },
  });

  return deviceTokens.map((dt) => dt.token);
};

// Supprimer les tokens invalides
const removeInvalidTokens = async (tokens: string[]) => {
  if (!tokens.length) return;

  const { prisma } = await import("./prisma");

  await prisma.deviceToken.updateMany({
    where: {
      token: { in: tokens },
    },
    data: {
      isActive: false,
    },
  });
};

export { adminApp };
