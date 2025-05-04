// Créer un composant pour diagnostiquer les problèmes d'authentification
// src/app/auth-debug/page.tsx

"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AuthDebugPage() {
  const [session, setSession] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [cookies, setCookies] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier la session
        const sessionData = await authClient.getSession();
        setSession(sessionData);

        // Lister les cookies
        const allCookies = document.cookie
          .split(";")
          .map((cookie) => cookie.trim())
          .join("\n");
        setCookies(allCookies);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>

      <div className="mb-8">
        <h2 className="text-xl mb-2">Session Data:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl mb-2">Cookies:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {cookies || "No cookies found"}
        </pre>
      </div>

      {error && (
        <div className="mb-8">
          <h2 className="text-xl mb-2">Error:</h2>
          <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl mb-2">Environment Info:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>URL: {window.location.href}</p>
          <p>Origin: {window.location.origin}</p>
          <p>Protocol: {window.location.protocol}</p>
        </div>
      </div>

      <div className="mt-8">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
