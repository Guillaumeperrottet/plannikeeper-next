// src/app/signup/signup-form.tsx - Version optimisée
"use client";

import {
  FormEvent,
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
} from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";

// Chargement différé du composant lourd SignupImageUpload
const SignupImageUpload = dynamic(() => import("./SignupImageUpload"), {
  loading: () => (
    <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4"></div>
  ),
  ssr: false, // Désactiver le SSR pour ce composant
});

// Fonction utilitaire déplacée hors du composant pour éviter les recréations
const getPlanDisplayName = (planType: string) => {
  const planNames = {
    PERSONAL: "Particulier",
    PROFESSIONAL: "Indépendant",
    ENTERPRISE: "Entreprise",
    FREE: "Gratuit",
  };
  return planNames[planType as keyof typeof planNames] || planType;
};

function SignUpForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const [isInvite, setIsInvite] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const planType = searchParams.get("plan") || "FREE";
  const isPaidPlan = planType !== "FREE";

  // Utiliser useCallback pour la fonction de sélection d'image
  const handleImageSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

  // Charger les données d'invitation une seule fois au montage
  useEffect(() => {
    let mounted = true;

    if (inviteCode) {
      fetch(`/api/invitations/validate?code=${inviteCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (!mounted) return;
          if (data.valid) {
            setIsInvite(true);
            setOrganizationName(data.organizationName);
          }
        })
        .catch((err) => {
          console.error("Erreur de validation du code:", err);
        });
    }

    return () => {
      mounted = false;
    };
  }, [inviteCode]);

  // Optimiser la fonction de soumission avec useCallback
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) return;
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;

      try {
        let imageUrl: string | undefined = undefined;

        // Upload d'image seulement si nécessaire
        if (selectedFile) {
          const imageFormData = new FormData();
          imageFormData.append("file", selectedFile);

          const toastId = toast.loading("Téléchargement de l'image...");

          try {
            const uploadResponse = await fetch("/api/auth/temp-image-upload", {
              method: "POST",
              body: imageFormData,
            });

            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              imageUrl = uploadData.imageUrl;
              toast.success("Image téléchargée avec succès", { id: toastId });
            } else {
              throw new Error("Erreur lors de l'upload de l'image");
            }
          } catch {
            toast.error(
              "Impossible de télécharger l'image. L'inscription continuera sans image.",
              { id: toastId }
            );
          }
        }

        // Inscription
        await authClient.signUp.email(
          {
            email,
            password,
            name,
            image: imageUrl,
            callbackURL: inviteCode
              ? `/join/${inviteCode}?plan=${planType}`
              : `/subscribe-redirect?plan=${planType}`,
          },
          {
            onSuccess: () => {
              window.location.href = inviteCode
                ? `/join/${inviteCode}?plan=${planType}`
                : `/subscribe-redirect?plan=${planType}`;
            },
            onError: (ctx) => {
              let errorMessage =
                "Une erreur est survenue lors de l'inscription.";
              if (ctx.error?.message) {
                errorMessage = ctx.error.message;
              }
              setError(errorMessage);
              setIsSubmitting(false);
            },
          }
        );
      } catch (err) {
        console.error("Erreur d'inscription:", err);
        setError("Une erreur inattendue est survenue");
        setIsSubmitting(false);
      }
    },
    [inviteCode, planType, selectedFile, isSubmitting]
  );

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-background rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Inscription</h2>

      {isInvite && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700">
            Vous avez été invité à rejoindre <strong>{organizationName}</strong>
          </p>
        </div>
      )}

      <div
        className={`mb-6 p-4 ${
          isPaidPlan
            ? "bg-amber-50 border border-amber-200"
            : "bg-green-50 border border-green-200"
        } rounded-md`}
      >
        <p className={isPaidPlan ? "text-amber-700" : "text-green-700"}>
          Vous avez sélectionné le plan{" "}
          <strong>{getPlanDisplayName(planType)}</strong>.
          {isPaidPlan
            ? " Après votre inscription, vous serez redirigé vers la page de paiement."
            : " Votre compte sera activé immédiatement."}
        </p>
        <p className="mt-2 text-sm">
          <Link href="/pricing" className="underline underline-offset-2">
            Voir tous les plans disponibles
          </Link>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <SignupImageUpload onImageSelect={handleImageSelect} />

        <div>
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Entrez votre nom complet"
            autoComplete="name"
          />
        </div>
        <div>
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Entrez votre email"
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Créez un mot de passe (min. 8 caractères)"
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Inscription en cours..."
            : isPaidPlan
              ? "S'inscrire et continuer vers le paiement"
              : "S'inscrire"}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        Vous avez déjà un compte?{" "}
        <Link href="/signin" className="underline underline-offset-2">
          Connectez-vous
        </Link>
      </div>
    </div>
  );
}

// Mémoriser le composant pour éviter les rendus inutiles
export default memo(SignUpForm);
