"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";

export default function SubscribeRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "redirecting" | "error" | "success"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  const planType = searchParams.get("plan") || "FREE";
  const isPaidPlan = planType !== "FREE";

  // Fonction pour obtenir le nom d'affichage du plan
  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case "PERSONAL":
        return "Particulier";
      case "PROFESSIONAL":
        return "Indépendant";
      case "ENTERPRISE":
        return "Entreprise";
      case "FREE":
        return "Gratuit";
      default:
        return planType;
    }
  };

  useEffect(() => {
    async function handleRedirect() {
      try {
        setStatus("loading");

        // Laisser le temps à l'authentification de se propager
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Si c'est un plan gratuit, rediriger directement vers le dashboard
        if (!isPaidPlan) {
          setStatus("success");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[color:var(--background)]">
      <div className="w-full max-w-md p-8 bg-[color:var(--card)] rounded-lg shadow-md">
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-center">
              Préparation de votre compte
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[color:var(--primary)]"></div>
            </div>
            <p className="mt-4 text-center text-[color:var(--muted-foreground)]">
              Un instant, nous configurons votre compte...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-center text-[color:var(--foreground)]">
              Inscription réussie!
            </h1>
            <div className="flex justify-center mb-4">
              <svg
                className="w-16 h-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="mb-6 text-center text-[color:var(--muted-foreground)]">
              Votre compte avec le plan{" "}
              <strong>{getPlanDisplayName(planType)}</strong> a été créé avec
              succès. Vous allez être redirigé vers votre tableau de bord...
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
            <p className="mt-4 text-center text-[color:var(--muted-foreground)]">
              Vous allez être redirigé vers la page de paiement pour finaliser
              votre abonnement <strong>{getPlanDisplayName(planType)}</strong>
              ...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-center text-red-600">
              Une erreur est survenue
            </h1>
            <p className="text-center text-[color:var(--muted-foreground)] mb-4">
              {error}
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2"
              >
                Continuer vers votre tableau de bord
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
