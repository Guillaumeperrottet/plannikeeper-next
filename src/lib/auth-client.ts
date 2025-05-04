import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: "/api/auth", // Utiliser toujours une URL relative
  // Supprimer la logique conditionnelle pour une meilleure cohérence
});
