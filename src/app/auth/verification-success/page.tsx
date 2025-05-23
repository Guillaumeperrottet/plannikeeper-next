"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";

export default function VerificationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Récupérer les paramètres pour déterminer la redirection
  const planType = searchParams.get("plan") || "FREE";
  const inviteCode = searchParams.get("code");

  useEffect(() => {
    // Récupérer les paramètres
    const userId = searchParams.get("userId");
    const planType = searchParams.get("plan") || "FREE";
    const inviteCode = searchParams.get("code");

    console.log("📍 Verification Success Page - Paramètres:", {
      userId,
      planType,
      inviteCode,
    });

    // Tu peux aussi faire un appel API ici pour vérifier si l'organisation a été créée
    fetch("/api/user/organization-check")
      .then((res) => res.json())
      .then((data) => {
        console.log("🏢 Vérification organisation:", data);
      })
      .catch((err) => {
        console.error("❌ Erreur vérification:", err);
      });
  }, [searchParams]);

  const handleRedirect = useCallback(() => {
    setIsRedirecting(true);

    if (inviteCode) {
      // Utilisateur avec invitation
      router.push(`/join/${inviteCode}?plan=${planType}`);
    } else {
      // Nouvel utilisateur
      router.push(`/subscribe-redirect?plan=${planType}`);
    }
  }, [inviteCode, planType, router]);

  useEffect(() => {
    // Auto-redirection après 3 secondes
    const timer = setTimeout(() => {
      handleRedirect();
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleRedirect]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-[#beac93]/30">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-bold text-[#141313]">
            Email vérifié !
          </h2>
          <p className="mt-2 text-[#62605d]">
            Votre adresse email a été vérifiée avec succès. Votre compte est
            maintenant activé.
          </p>

          {inviteCode && (
            <div className="mt-4 p-3 bg-[#e0f2fe] border border-[#7dd3fc] rounded-lg">
              <p className="text-sm text-[#0284c7]">
                🎉 Vous allez être ajouté à votre organisation !
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-center">
            <Button
              onClick={handleRedirect}
              disabled={isRedirecting}
              className="w-full bg-gradient-to-r from-[#d9840d] to-[#e36002] hover:from-[#c6780c] hover:to-[#d9840d] text-white font-medium shadow-md"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                "Continuer vers l'application"
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-[#62605d]">
              Redirection automatique dans 3 secondes...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
