// src/middleware/middleware.ts (mise à jour)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_MODE === "true";
  const origin = isDev
    ? "http://localhost:3000"
    : request.headers.get("Origin") || "*";

  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Get the authentication status from cookies
  const isAuthenticated = request.cookies.has("session");

  // If user is on the landing page (root) but is authenticated, redirect to dashboard
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // IMPORTANT: Ignorer les routes de webhook Stripe
  if (request.nextUrl.pathname.startsWith("/api/webhooks/stripe")) {
    return NextResponse.next();
  }

  // Pour les requêtes OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Optimisation du cache pour les ressources statiques
  if (
    pathname.match(/\.(js|css|woff2|png|jpg|jpeg|gif|ico|svg)$/) ||
    pathname.startsWith("/_next/static/")
  ) {
    const response = NextResponse.next();

    // Ajouter des en-têtes de cache pour les ressources statiques
    // 1 an pour les assets versionnés, 1 jour pour les non-versionnés
    if (pathname.includes("/_next/static/")) {
      response.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
    } else {
      response.headers.set(
        "Cache-Control",
        "public, max-age=86400, stale-while-revalidate=604800"
      );
    }

    return response;
  }

  // Configuration de cache pour les pages du site vitrine
  if (pathname === "/signup" || pathname === "/signin" || pathname === "/") {
    const response = NextResponse.next();

    // Ajouter des en-têtes de cache pour les ressources statiques
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    );

    // Ajouter des headers pour précharger les ressources critiques
    response.headers.set(
      "Link",
      "</api/auth/temp-image-upload>; rel=preconnect, </api/invitations/validate>; rel=preconnect"
    );

    return response;
  }
  // Pour les autres requêtes
  const response = NextResponse.next();

  // Définir les en-têtes CORS appropriés
  response.headers.set(
    "Access-Control-Allow-Origin",
    isDev ? "http://localhost:3000" : request.headers.get("Origin") || "*"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE, PATCH"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Cookie"
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/:path*"],
};
