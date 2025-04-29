import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Utiliser l'URL de déploiement en production, localhost en développement
  baseURL:
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"),

  options: {
    debugging: process.env.NODE_ENV !== "production",
    onError: (error: unknown) => {
      console.error("Auth Client Error:", error);
    },
  },
});
