import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Explicitement définir les méthodes pour s'assurer qu'elles sont bien exportées
const handler = toNextJsHandler(auth);

export const GET = handler.GET;
export const POST = handler.POST;
export const OPTIONS = () => {
  // Gestion explicite des requêtes CORS OPTIONS
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
};
