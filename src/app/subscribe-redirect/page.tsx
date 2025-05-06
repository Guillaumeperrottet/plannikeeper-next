"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SubscribeRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  const planType = searchParams.get("plan") || "FREE";
  const isPaidPlan = planType !== "FREE";

  useEffect(() => {
    async function handleRedirect() {
      try {
        setStatus("loading");

        // Laisser le temps à l'authentification de se propager
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Si c'est un plan gratuit, rediriger directement vers le dashboard
        if (!isPaidPlan) {
          router.push("/dashboard");
          return;
        }

        // Cas d'un plan payant - appeler l'API pour créer la session Stripe
        setStatus("redirecting");
        const response = await fetch("/api/subscriptions/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planType }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || "Impossible de créer la session de paiement"
          );
        }

        const data = await response.json();

        // Rediriger vers l'URL de paiement Stripe
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("URL de redirection manquante");
        }
      } catch (err) {
        console.error("Erreur lors de la redirection:", err);
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      }
    }

    handleRedirect();
  }, [isPaidPlan, planType, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-center">
              Préparation de votre compte
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[color:var(--primary)]"></div>
            </div>
            <p className="mt-4 text-center text-gray-600">
              Un instant, nous configurons votre compte...
            </p>
          </>
        )}

        {status === "redirecting" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-center">
              Redirection vers la page de paiement
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[color:var(--primary)]"></div>
            </div>
            <p className="mt-4 text-center text-gray-600">
              Vous allez être redirigé vers la page de paiement pour finaliser
              votre abonnement{" "}
              {planType === "PERSONAL"
                ? "Particulier"
                : planType === "PROFESSIONAL"
                  ? "Indépendant"
                  : "Entreprise"}
              ...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-center text-red-600">
              Une erreur est survenue
            </h1>
            <p className="text-center text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-[color:var(--primary)] text-white rounded-md hover:bg-opacity-90"
              >
                Continuer vers votre tableau de bord
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
