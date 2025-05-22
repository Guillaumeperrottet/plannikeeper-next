// src/app/subscribe-redirect/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function SubscribeRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const planType = searchParams.get("plan") || "FREE";

  useEffect(() => {
    const handlePayment = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/subscriptions/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planType: planType,
          }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("URL de paiement non disponible");
        }
      } catch (err) {
        console.error("Erreur lors de la création du checkout:", err);
        setError("Erreur lors de la redirection vers le paiement");
        setIsLoading(false);
      }
    };

    const checkUserAndRedirect = async () => {
      try {
        // Vérifier si l'utilisateur est connecté et vérifié
        const currentUser = await getUser();

        if (!currentUser) {
          // Pas connecté, rediriger vers la connexion
          router.push("/signin");
          return;
        }

        if (!currentUser.emailVerified) {
          // Email non vérifié, rediriger vers la page de vérification
          router.push("/auth/email-verification-required");
          return;
        }

        // setUser(currentUser); // No longer needed
        // Si c'est un plan payant, rediriger vers le checkout
        if (planType !== "FREE") {
          // Petite pause pour montrer le message de succès
          setTimeout(() => {
            handlePayment();
          }, 2000);
        } else {
          // Plan gratuit, rediriger vers le dashboard après 3 secondes
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification:", err);
        setError("Une erreur est survenue lors de la vérification");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndRedirect();
  }, [planType, router]);

  const getPlanDisplayName = (planType: string) => {
    const planNames = {
      PERSONAL: "Particulier",
      PROFESSIONAL: "Professionnel",
      ENTERPRISE: "Entreprise",
      FREE: "Gratuit",
    };
    return planNames[planType as keyof typeof planNames] || planType;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50">
        <div className="bg-white rounded-2xl shadow-xl border border-[#beac93]/30 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#141313] mb-2">Erreur</h2>
            <p className="text-[#62605d] mb-6">{error}</p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-[#d9840d] hover:bg-[#c6780c]"
            >
              Aller au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50">
      <div className="bg-white rounded-2xl shadow-xl border border-[#beac93]/30 p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {isLoading ? (
            <>
              <div className="w-16 h-16 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-[#d9840d] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-[#141313] mb-2">
                Configuration en cours...
              </h2>
              <p className="text-[#62605d]">
                {planType !== "FREE"
                  ? "Redirection vers le paiement..."
                  : "Préparation de votre espace..."}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[#141313] mb-2">
                Bienvenue sur PlanniKeeper !
              </h2>
              <p className="text-[#62605d] mb-4">
                Votre compte a été créé avec succès avec le plan{" "}
                <strong>{getPlanDisplayName(planType)}</strong>.
              </p>

              {planType !== "FREE" ? (
                <div className="bg-[#ffedd5] border border-[#fcd34d] rounded-lg p-4 mb-6">
                  <p className="text-[#f59e0b] text-sm">
                    Vous allez être redirigé vers notre partenaire de paiement
                    sécurisé pour finaliser votre abonnement.
                  </p>
                </div>
              ) : (
                <div className="bg-[#dcfce7] border border-[#86efac] rounded-lg p-4 mb-6">
                  <p className="text-[#16a34a] text-sm">
                    Votre compte gratuit est maintenant actif ! Vous allez être
                    redirigé vers votre tableau de bord.
                  </p>
                </div>
              )}

              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-[#d9840d] hover:bg-[#c6780c] w-full"
              >
                Accéder au tableau de bord
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
