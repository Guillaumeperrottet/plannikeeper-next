import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // IMPORTANT: Ignorer les routes de webhook Stripe
  if (request.nextUrl.pathname.startsWith("/api/webhooks/stripe")) {
    return NextResponse.next();
  }
  // Améliorer le middleware pour mieux gérer les requêtes auth
  const origin = request.headers.get("Origin") || "*";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Pour les requêtes OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, OPTIONS, PUT, DELETE, PATCH",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Pour les autres requêtes, ajouter les headers CORS à la réponse
  const response = NextResponse.next();

  // Headers CORS de base
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE, PATCH"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Cookie"
  );

  // En développement, permettre l'accès depuis n'importe quelle origine
  if (isDevelopment) {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
