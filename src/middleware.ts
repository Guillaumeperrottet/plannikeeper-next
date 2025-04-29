import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Obtenir l'origine de la requête pour le CORS
  const origin = request.headers.get("Origin") || "*";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Log de débogage en développement
  if (isDevelopment) {
    console.log(
      `Middleware - Method: ${request.method}, Path: ${request.nextUrl.pathname}, Origin: ${origin}`
    );
  }

  // Pour les requêtes OPTIONS (preflight), renvoyer directement une réponse CORS
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, OPTIONS, PUT, DELETE, PATCH",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Pour les autres requêtes, ajouter les headers CORS à la réponse
  const response = NextResponse.next();

  // Ajouter les headers CORS nécessaires
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");

  // En développement, permettre l'accès depuis n'importe quelle origine
  if (isDevelopment) {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  return response;
}

// Spécifier les chemins pour lesquels ce middleware doit s'exécuter
export const config = {
  matcher: ["/api/:path*"],
};
