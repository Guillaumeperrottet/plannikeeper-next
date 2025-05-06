"use client";

import { FormEvent, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const [isInvite, setIsInvite] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const planType = searchParams.get("plan") || "FREE";

  // Déterminer si le plan est payant
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
    if (inviteCode) {
      fetch(`/api/invitations/validate?code=${inviteCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsInvite(true);
            setOrganizationName(data.organizationName);
          }
        })
        .catch((err) => {
          console.error("Erreur de validation du code:", err);
        });
    }
  }, [inviteCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const image = (formData.get("image") as string) || undefined;

    const submitButton = event.currentTarget.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        image,
        // Modifions la callbackURL pour inclure une référence au plan
        callbackURL: inviteCode
          ? `/join/${inviteCode}?plan=${planType}`
          : `/subscribe-redirect?plan=${planType}`,
      },
      {
        onRequest: () => {
          submitButton.disabled = true;
          submitButton.textContent = "Inscription en cours...";
        },
        onSuccess: () => {
          // Redirection modifiée pour utiliser la même URL que callbackURL
          window.location.href = inviteCode
            ? `/join/${inviteCode}?plan=${planType}`
            : `/subscribe-redirect?plan=${planType}`;
        },
        onError: (ctx) => {
          console.error("Erreur complète:", ctx.error);
          let errorMessage = "Une erreur est survenue lors de l'inscription.";
          if (ctx.error && ctx.error.message) {
            errorMessage = ctx.error.message;
          }
          setError(errorMessage);
          submitButton.disabled = false;
          submitButton.textContent = "S'inscrire";
        },
      }
    );
  }

  return (
    <div
      className={cn(
        "max-w-md mx-auto my-10 p-6 bg-background rounded-lg shadow-md"
      )}
    >
      <h2 className="text-2xl font-bold text-center mb-6">Inscription</h2>

      {isInvite && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700">
            Vous avez été invité à rejoindre <strong>{organizationName}</strong>
          </p>
        </div>
      )}

      {/* Message indiquant le plan sélectionné */}
      <div
        className={`mb-6 p-4 ${isPaidPlan ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"} rounded-md`}
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nom complet</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Entrez votre nom complet"
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
          />
        </div>
        <div>
          <Label htmlFor="image">URL d&apos;image de profil (optionnel)</Label>
          <Input
            id="image"
            name="image"
            type="url"
            placeholder="https://example.com/votre-image.jpg"
          />
        </div>
        <Button type="submit" className="w-full">
          {isPaidPlan
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
