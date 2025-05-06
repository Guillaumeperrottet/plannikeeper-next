// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Configuration CORS améliorée pour Next.js
  async headers() {
    return [
      {
        // Appliquer ces en-têtes à toutes les routes de l'API
        source: "/api/:path*",
        // Exclure le chemin webhooks/stripe
        has: [{ type: "header", key: "referer", value: "(?!.*stripe.com).*" }],
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // En production, utilisez une URL spécifique
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
      {
        // Configuration pour tous les chemins (important pour les service workers)
        source: "/(.*)",
        headers: [{ key: "Service-Worker-Allowed", value: "/" }],
      },
    ];
  },
  // Amélioration des paramètres de débogage
  logging:
    process.env.NODE_ENV === "development"
      ? {
          fetches: {
            fullUrl: true,
          },
        }
      : undefined,
};

export default nextConfig;
