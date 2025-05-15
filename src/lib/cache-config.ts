// src/lib/cache-config.ts
import { NextResponse } from "next/server";

/**
 * Options pour les en-têtes de cache
 */
export type CacheOptions = {
  maxAge?: number; // Durée de mise en cache par le navigateur (en secondes)
  sMaxAge?: number; // Durée de mise en cache par les CDN et proxies (en secondes)
  staleWhileRevalidate?: number; // Durée pendant laquelle le contenu périmé peut être servi pendant revalidation
  mustRevalidate?: boolean; // Force la revalidation quand le contenu est périmé
  noStore?: boolean; // Empêche complètement la mise en cache
  private?: boolean; // Cache uniquement par le navigateur, pas par les CDN/proxies
};

/**
 * Durées prédéfinies pour différents types de contenu
 */
export const CacheDurations = {
  NEVER: { noStore: true, mustRevalidate: true } as CacheOptions,
  SHORT: {
    maxAge: 60,
    sMaxAge: 300,
    staleWhileRevalidate: 600,
  } as CacheOptions, // 1 min browser, 5 min CDN
  MEDIUM: {
    maxAge: 300,
    sMaxAge: 1800,
    staleWhileRevalidate: 3600,
  } as CacheOptions, // 5 min browser, 30 min CDN
  LONG: {
    maxAge: 3600,
    sMaxAge: 86400,
    staleWhileRevalidate: 172800,
  } as CacheOptions, // 1h browser, 24h CDN
  VERY_LONG: {
    maxAge: 86400,
    sMaxAge: 604800,
    staleWhileRevalidate: 2592000,
  } as CacheOptions, // 1 jour browser, 1 semaine CDN
  // SWR pattern: contenu périmé immédiatement mais utilisable pendant revalidation
  SWR_QUICK: {
    maxAge: 1,
    sMaxAge: 10,
    staleWhileRevalidate: 60,
  } as CacheOptions,
  SWR_STANDARD: {
    maxAge: 1,
    sMaxAge: 60,
    staleWhileRevalidate: 300,
  } as CacheOptions,
};

/**
 * Génère les en-têtes Cache-Control basé sur les options fournies
 */
export function generateCacheHeaders(options: CacheOptions): string {
  if (options.noStore) {
    return "no-store, no-cache, must-revalidate, proxy-revalidate";
  }

  const directives = [];

  if (options.private) {
    directives.push("private");
  } else {
    directives.push("public");
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (options.mustRevalidate) {
    directives.push("must-revalidate");
  }

  return directives.join(", ");
}

/**
 * Ajoute les en-têtes de cache à la réponse NextResponse
 */
export function withCacheHeaders(
  response: NextResponse,
  options: CacheOptions
): NextResponse {
  const cacheControlHeader = generateCacheHeaders(options);
  response.headers.set("Cache-Control", cacheControlHeader);

  // Ajouter un header Vary pour différencier les versions de réponse
  response.headers.set("Vary", "Accept, Authorization");

  return response;
}

/**
 * Exemples d'utilisation dans les routes API
 */
export function createCachedResponse(
  data: unknown,
  options: CacheOptions
): NextResponse {
  const response = NextResponse.json(data);
  return withCacheHeaders(response, options);
}

/**
 * Wrapper pour les routes API de lecture statique (peu changeantes)
 */
export function createStaticResponse(data: unknown): NextResponse {
  return createCachedResponse(data, CacheDurations.MEDIUM);
}

/**
 * Wrapper pour les routes API de lecture dynamique (changeantes fréquemment)
 */
export function createDynamicResponse(data: unknown): NextResponse {
  return createCachedResponse(data, CacheDurations.SWR_STANDARD);
}

/**
 * Wrapper pour les routes API qui ne doivent pas être mises en cache
 */
export function createUncachedResponse(data: unknow): NextResponse {
  return createCachedResponse(data, CacheDurations.NEVER);
}
