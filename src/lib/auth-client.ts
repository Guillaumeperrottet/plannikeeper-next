import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth`
      : process.env.NODE_ENV === "development"
        ? "http://localhost:3000/api/auth"
        : "https://plannikeeper-next.vercel.app/api/auth",
});
