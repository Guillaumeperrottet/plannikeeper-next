"use client";

import { FormEvent, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const [isInvite, setIsInvite] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const planType = searchParams.get("plan") || "FREE";

  // Déterminer si le plan est payant
  const isPaidPlan = planType !== "FREE";

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
          submitButton.textContent = "Signing up...";
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
          submitButton.textContent = "Sign Up";
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
      <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
      {isInvite && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700">
            Vous avez été invité à rejoindre <strong>{organizationName}</strong>
          </p>
        </div>
      )}

      {/* Message indiquant le plan sélectionné */}
      {isPaidPlan && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-700">
            Vous avez sélectionné le plan{" "}
            <strong>
              {planType === "PERSONAL"
                ? "Particulier"
                : planType === "PROFESSIONAL"
                  ? "Indépendant"
                  : planType === "ENTERPRISE"
                    ? "Entreprise"
                    : planType}
            </strong>
            . Après votre inscription, vous serez redirigé vers la page de
            paiement.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Create a password (min. 8 characters)"
            minLength={8}
          />
        </div>
        <div>
          <Label htmlFor="image">Profile Image URL (optional)</Label>
          <Input
            id="image"
            name="image"
            type="url"
            placeholder="https://example.com/your-image.jpg"
          />
        </div>
        <Button type="submit" className="w-full">
          {isPaidPlan ? "Sign Up & Continue to Payment" : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}
