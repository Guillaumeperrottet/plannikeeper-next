import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  // En mode développement, utiliser localhost, sinon utiliser l'URL de la fenêtre courante
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth`
      : process.env.NODE_ENV === "development"
        ? "http://localhost:3000/api/auth"
        : "/api/auth", // URL relative qui fonctionnera sur toutes les instances
});
