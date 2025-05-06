// src/app/pricing/pricing-plans.tsx
"use client";

import { useState } from "react";
import { PlanType } from "@prisma/client";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

type Plan = {
  id: string;
  name: PlanType;
  price: number;
  monthlyPrice: number;
  yearlyPrice: number | null;
  maxUsers: number | null;
  maxObjects: number | null;
  hasCustomPricing: boolean;
  features: string[];
};

interface PricingPlansProps {
  plans: Plan[];
  currentPlan: Plan | null;
  isAdmin: boolean;
  organizationId: string;
}

export default function PricingPlans({
  plans,
  currentPlan,
  isAdmin,
  organizationId,
}: PricingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent modifier l'abonnement");
      return;
    }

    setLoading(plan.id);

    try {
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: plan.name,
          organizationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      // Rediriger vers l'URL de paiement ou le dashboard pour le plan gratuit
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast.success("Plan mis à jour avec succès!");
        window.location.href = "/dashboard?subscription=updated";
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors de la sélection du plan: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent gérer l'abonnement");
      return;
    }

    setLoading("manage");

    try {
      const response = await fetch("/api/subscriptions/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      // Rediriger vers le portail client Stripe
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors de l'accès au portail de gestion: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setLoading(null);
    }
  };

  // Trier les plans par prix
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  return (
    <div>
      {currentPlan && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Votre plan actuel: {currentPlan.name}
              </h2>
              <p className="text-sm text-blue-600">
                {currentPlan.hasCustomPricing
                  ? "Prix personnalisé"
                  : currentPlan.price === 0
                    ? "Gratuit"
                    : `${currentPlan.price}€/mois`}
              </p>
            </div>
            {isAdmin && currentPlan.name !== "FREE" && (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                disabled={loading === "manage"}
              >
                {loading === "manage" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  "Gérer l'abonnement"
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedPlans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg overflow-hidden ${
              currentPlan?.id === plan.id
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200"
            }`}
          >
            <div className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                {plan.hasCustomPricing ? (
                  <div className="text-2xl font-bold">Sur mesure</div>
                ) : (
                  <div className="flex items-end">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 ml-1">/mois</span>
                    )}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                className="w-full"
                variant={currentPlan?.id === plan.id ? "outline" : "default"}
                disabled={
                  loading !== null || !isAdmin || currentPlan?.id === plan.id
                }
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : currentPlan?.id === plan.id ? (
                  "Plan actuel"
                ) : (
                  "Sélectionner"
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center text-gray-500 text-sm">
        <p>
          Tous les plans incluent un accès à l&apos;application, les mises à
          jour et les nouvelles fonctionnalités.
        </p>
        <p className="mt-2">
          Pour les besoins spécifiques ou les grandes équipes, contactez-nous
          pour un plan personnalisé.
        </p>
      </div>
    </div>
  );
}
