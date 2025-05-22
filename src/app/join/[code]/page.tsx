// src/app/join/[code]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { Loader2, CheckCircle, ArrowRight, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function JoinInvitePage() {
  const { code } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>("");
  const planType = searchParams.get("plan") || "FREE";

  useEffect(() => {
    const processInvitation = async () => {
      try {
        // Vérifier si l'utilisateur est connecté et vérifié
        // Ajout d'un typage explicite pour inclure organizationId
        type UserWithOrg = {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null;
          organizationId?: string | null;
        };

        const currentUser = (await getUser()) as UserWithOrg | null;

        if (!currentUser) {
          // Pas connecté, rediriger vers l'inscription avec le code
          router.push(`/signup?code=${code}&plan=${planType}`);
          return;
        }

        if (!currentUser.emailVerified) {
          // Email non vérifié, rediriger vers la page de vérification
          router.push("/auth/email-verification-required");
          return;
        }

        // Vérifier si l'utilisateur a déjà une organisation
        if (currentUser.organizationId) {
          setError(
            "Vous appartenez déjà à une organisation. Contactez votre administrateur pour changer d'organisation."
          );
          setIsLoading(false);
          return;
        }

        // Valider et traiter l'invitation
        const inviteResponse = await fetch(
          `/api/invitations/validate?code=${code}`
        );
        const inviteData = await inviteResponse.json();

        if (!inviteData.valid) {
          setError("Code d'invitation invalide ou expiré");
          setIsLoading(false);
          return;
        }

        setOrganizationName(inviteData.organizationName);

        // L'utilisateur devrait déjà être associé à l'organisation via le hook
        // Rediriger vers le dashboard après un délai
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (err) {
        console.error("Erreur lors du traitement de l'invitation:", err);
        setError("Une erreur est survenue lors du traitement de l'invitation");
      } finally {
        setIsLoading(false);
      }
    };

    if (code) {
      processInvitation();
    }
  }, [code, planType, router]);

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
            <h2 className="text-xl font-bold text-[#141313] mb-2">
              Erreur d&apos;invitation
            </h2>
            <p className="text-[#62605d] mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/signup")}
                className="bg-[#d9840d] hover:bg-[#c6780c] w-full"
              >
                Créer un nouveau compte
              </Button>
              <Button
                onClick={() => router.push("/signin")}
                variant="outline"
                className="w-full border-[#beac93] hover:bg-[#e8ebe0]"
              >
                Se connecter
              </Button>
            </div>
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
                Traitement de l&apos;invitation...
              </h2>
              <p className="text-[#62605d]">
                Vérification de votre invitation en cours...
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[#141313] mb-2">
                Bienvenue dans l&apos;équipe !
              </h2>
              <p className="text-[#62605d] mb-4">
                Vous avez rejoint avec succès l&apos;organisation{" "}
                <strong>{organizationName}</strong>.
              </p>

              <div className="bg-[#e0f2fe] border border-[#7dd3fc] rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-[#0284c7]">
                  <Users className="w-5 h-5" />
                  <p className="text-sm font-medium">
                    Vous pouvez maintenant collaborer avec votre équipe
                  </p>
                </div>
              </div>

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
