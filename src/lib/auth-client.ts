import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",

  // Options supplémentaires pour le débogage
  options: {
    debugging: true,
    onError: (error: unknown) => {
      console.error("Auth Client Error:", error);
    },
  },
});
