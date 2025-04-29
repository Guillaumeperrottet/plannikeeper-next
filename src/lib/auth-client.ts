import { createAuthClient } from "better-auth/client";

// Utiliser l'URL correcte en fonction de l'environnement
const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL ||
      "https://plannikeeper-next.vercel.app";

export const authClient = createAuthClient({
  baseURL: `${baseUrl}/api/auth`,
});
