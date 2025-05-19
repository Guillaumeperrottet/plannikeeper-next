// src/lib/cache-config.ts (mise à jour)
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
  immutable?: boolean; // Indique que la ressource ne changera jamais
  etagSupport?: boolean; // Ajouter automatiquement un ETag basé sur le contenu
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
    etagSupport: true,
  } as CacheOptions, // 1 min browser, 5 min CDN
  MEDIUM: {
    maxAge: 300,
    sMaxAge: 1800,
    staleWhileRevalidate: 3600,
    etagSupport: true,
  } as CacheOptions, // 5 min browser, 30 min CDN
  LONG: {
    maxAge: 3600,
    sMaxAge: 86400,
    staleWhileRevalidate: 172800,
    etagSupport: true,
  } as CacheOptions, // 1h browser, 24h CDN
  VERY_LONG: {
    maxAge: 86400,
    sMaxAge: 604800,
    staleWhileRevalidate: 2592000,
    etagSupport: true,
  } as CacheOptions, // 1 jour browser, 1 semaine CDN

  // SWR pattern: contenu périmé immédiatement mais utilisable pendant revalidation
  SWR_QUICK: {
    maxAge: 1,
    sMaxAge: 10,
    staleWhileRevalidate: 60,
    etagSupport: true,
  } as CacheOptions,
  SWR_STANDARD: {
    maxAge: 1,
    sMaxAge: 60,
    staleWhileRevalidate: 300,
    etagSupport: true,
  } as CacheOptions,

  // Nouvelles configurations de cache
  API_LISTS: {
    maxAge: 120, // 2 min cache navigateur
    sMaxAge: 600, // 10 min cache CDN
    staleWhileRevalidate: 1800, // 30 min utilisation stale pendant revalidation
    etagSupport: true,
  } as CacheOptions,

  API_DETAIL: {
    maxAge: 60, // 1 min cache navigateur
    sMaxAge: 300, // 5 min cache CDN
    staleWhileRevalidate: 900, // 15 min utilisation stale pendant revalidation
    etagSupport: true,
  } as CacheOptions,

  ASSETS: {
    maxAge: 604800, // 1 semaine
    sMaxAge: 2592000, // 1 mois
    immutable: true, // Ne changera jamais (pour les assets versionnés)
    etagSupport: false,
  } as CacheOptions,

  USER_SPECIFIC: {
    maxAge: 60, // 1 min cache navigateur
    private: true, // Pas de partage dans les CDN
    etagSupport: true,
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

  if (options.immutable) {
    directives.push("immutable");
  }

  return directives.join(", ");
}

/**
 * Génère un ETag basé sur le contenu de la réponse
 */
export function generateETag(data: unknown): string {
  // Conversion des données en chaîne JSON et calcul d'un simple hachage
  const str = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Conversion en 32bit integer
  }

  // Convertir en hexadécimal et préfixer avec W/ pour indiquer qu'il s'agit d'un ETag faible
  return `W/"${hash.toString(16)}"`;
}

/**
 * Vérifie si l'ETag correspond à celui envoyé par le client
 */
export function matchETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  return ifNoneMatch === etag;
}

/**
 * Ajoute les en-têtes de cache à la réponse NextResponse
 */
export function withCacheHeaders(
  response: NextResponse,
  options: CacheOptions,
  originalRequest?: Request
): NextResponse {
  const cacheControlHeader = generateCacheHeaders(options);
  response.headers.set("Cache-Control", cacheControlHeader);

  // Ajouter un header Vary pour différencier les versions de réponse
  response.headers.set("Vary", "Accept, Authorization");

  // Ajouter un ETag si demandé
  if (options.etagSupport && response.body) {
    try {
      // Cloner la réponse pour accéder au corps
      const clonedResponse = response.clone();

      // Lire le corps comme JSON
      const responseData = clonedResponse.json();

      // Générer l'ETag
      const etag = generateETag(responseData);
      response.headers.set("ETag", etag);

      // Si la requête originale est fournie, vérifier si l'ETag correspond
      if (originalRequest && matchETag(originalRequest, etag)) {
        // Retourner 304 Not Modified à la place
        return new NextResponse(null, {
          status: 304,
          headers: response.headers,
        });
      }
    } catch (error) {
      console.warn("Impossible de générer un ETag pour cette réponse:", error);
    }
  }

  return response;
}

/**
 * Exemples d'utilisation dans les routes API
 */
export function createCachedResponse(
  data: unknown,
  options: CacheOptions,
  request?: Request
): NextResponse {
  const response = NextResponse.json(data);
  return withCacheHeaders(response, options, request);
}

/**
 * Wrapper pour les routes API de liste (collections)
 */
export function createListResponse(
  data: unknown,
  request?: Request
): NextResponse {
  return createCachedResponse(data, CacheDurations.API_LISTS, request);
}

/**
 * Wrapper pour les routes API de détail (item unique)
 */
export function createDetailResponse(
  data: unknown,
  request?: Request
): NextResponse {
  return createCachedResponse(data, CacheDurations.API_DETAIL, request);
}

/**
 * Wrapper pour les routes API spécifiques à l'utilisateur
 */
export function createUserSpecificResponse(
  data: unknown,
  request?: Request
): NextResponse {
  return createCachedResponse(data, CacheDurations.USER_SPECIFIC, request);
}

/**
 * Wrapper pour les routes API dynamiques (changeantes fréquemment)
 */
export function createDynamicResponse(
  data: unknown,
  request?: Request
): NextResponse {
  return createCachedResponse(data, CacheDurations.SWR_STANDARD, request);
}

/**
 * Wrapper pour les routes API qui ne doivent pas être mises en cache
 */
export function createUncachedResponse(data: unknown): NextResponse {
  return createCachedResponse(data, CacheDurations.NEVER);
}
