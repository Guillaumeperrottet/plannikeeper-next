// src/app/dashboard/subscription/subscription-dashboard.tsx
"use client";

import { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Loader2,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import UsageLimits from "@/app/components/UsageLimits";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/app/components/ui/card";
import { toast } from "sonner";

type Plan = {
  id: string;
  name: string;
  price: number;
  monthlyPrice: number;
  yearlyPrice: number | null;
  maxUsers: number | null;
  maxObjects: number | null;
  features: string[];
  hasCustomPricing: boolean;
  trialDays: number;
};

type Subscription = {
  id: string;
  organizationId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
};

type SubscriptionDashboardProps = {
  subscription: Subscription | null;
  plans: Plan[];
  isAdmin: boolean;
  organizationId: string;
};

export default function SubscriptionDashboard({
  subscription,
  plans,
  isAdmin,
  organizationId,
}: SubscriptionDashboardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const currentPlan = subscription?.plan;
  const isFreePlan = currentPlan?.name === "FREE";

  // Formater la date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Obtenir le statut de l'abonnement sous forme d'élément visuel
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Actif</span>
          </div>
        );
      case "PAST_DUE":
        return (
          <div className="flex items-center text-amber-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Paiement en attente</span>
          </div>
        );
      case "TRIALING":
        return (
          <div className="flex items-center text-blue-500">
            <Calendar className="h-5 w-5 mr-2" />
            <span>Période d&apos;essai</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{status}</span>
          </div>
        );
    }
  };

  // Gérer le changement de plan
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      const data = await response.json();

      // Rediriger vers l'URL de paiement ou le dashboard pour le plan gratuit
      if (data.url) {
        toast.success("Redirection vers la page de paiement...");
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

  // Gérer le portail de facturation Stripe
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      const { url } = await response.json();

      // Rediriger vers le portail client Stripe
      if (url) {
        window.location.href = url;
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

  // Renouveler un abonnement gratuit
  const handleRenewFreePlan = async () => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent renouveler l'abonnement");
      return;
    }

    setLoading("renew");

    try {
      const response = await fetch("/api/subscriptions/renew-free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      await response.json();

      toast.success("Abonnement gratuit renouvelé avec succès!");
      // Rafraîchir la page pour voir les changements
      window.location.reload();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors du renouvellement: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Gestion de l&apos;abonnement</h1>

      {/* Section abonnement actuel */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Abonnement actuel</h2>
        <Card>
          <CardContent className="p-6">
            {subscription ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Plan {subscription.plan.name}
                  </h3>
                  <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
                    {subscription.plan.hasCustomPricing
                      ? "Prix personnalisé"
                      : subscription.plan.price === 0
                        ? "Gratuit"
                        : `${subscription.plan.monthlyPrice}€/mois`}
                  </p>
                  {getStatusBadge(subscription.status)}

                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">
                      Fonctionnalités incluses:
                    </h4>
                    <ul className="space-y-1">
                      {subscription.plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[color:var(--muted)] p-4 rounded-lg">
                    <h4 className="font-medium mb-2">
                      Détails de l&apos;abonnement
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Début de période:</span>{" "}
                        {formatDate(subscription.currentPeriodStart)}
                      </p>
                      <p>
                        <span className="font-medium">Fin de période:</span>{" "}
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                      {subscription.cancelAtPeriodEnd && (
                        <p className="text-amber-500">
                          Cet abonnement ne sera pas renouvelé automatiquement.
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex flex-col gap-3">
                      {!isFreePlan && subscription.stripeSubscriptionId ? (
                        <Button
                          onClick={handleManageSubscription}
                          disabled={loading === "manage"}
                          className="w-full"
                        >
                          {loading === "manage" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CreditCard className="mr-2 h-4 w-4" />
                          )}
                          Gérer le paiement
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRenewFreePlan}
                          disabled={loading === "renew"}
                          className="w-full"
                          variant="outline"
                        >
                          {loading === "renew" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Calendar className="mr-2 h-4 w-4" />
                          )}
                          Renouveler l&apos;abonnement gratuit
                        </Button>
                      )}

                      <Button
                        onClick={() => (window.location.href = "/pricing")}
                        className="w-full"
                        variant={isFreePlan ? "default" : "outline"}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        {isFreePlan
                          ? "Passer à un forfait payant"
                          : "Modifier mon forfait"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-12 w-12 text-[color:var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Aucun abonnement actif
                </h3>
                <p className="text-[color:var(--muted-foreground)] mb-4">
                  Vous n&apos;avez pas d&apos;abonnement actif pour le moment.
                </p>
                {isAdmin && (
                  <Button onClick={() => (window.location.href = "/pricing")}>
                    Voir les forfaits disponibles
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nouvelle section avec UsageLimits */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Utilisation actuelle</h2>
        <UsageLimits />
      </div>

      {/* Section plans disponibles */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Plans disponibles</h2>

          <div className="flex items-center space-x-2 bg-[color:var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                billingCycle === "monthly"
                  ? "bg-white text-[color:var(--foreground)] shadow-sm"
                  : "text-[color:var(--muted-foreground)]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                billingCycle === "yearly"
                  ? "bg-white text-[color:var(--foreground)] shadow-sm"
                  : "text-[color:var(--muted-foreground)]"
              }`}
            >
              Annuel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`overflow-hidden transition-all duration-300 ${
                currentPlan?.id === plan.id
                  ? "border-2 border-[color:var(--primary)] shadow-lg shadow-[color:var(--primary)]/10"
                  : ""
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="mb-6">
                  {plan.hasCustomPricing ? (
                    <div className="text-2xl font-bold">Sur mesure</div>
                  ) : (
                    <div className="flex items-end">
                      <span className="text-3xl font-bold">
                        {plan.price === 0
                          ? "Gratuit"
                          : billingCycle === "monthly"
                            ? `${plan.monthlyPrice}€`
                            : plan.yearlyPrice
                              ? `${plan.yearlyPrice}€`
                              : `${plan.monthlyPrice * 12}€`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-[color:var(--muted-foreground)] ml-1">
                          /{billingCycle === "monthly" ? "mois" : "an"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {billingCycle === "yearly" &&
                  plan.yearlyPrice &&
                  plan.monthlyPrice * 12 > plan.yearlyPrice && (
                    <div className="bg-green-50 text-green-700 text-sm p-2 rounded-md mb-4">
                      Économisez{" "}
                      {Math.round(
                        100 -
                          (plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100
                      )}
                      % avec le forfait annuel
                    </div>
                  )}

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
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
                    "Sélectionner ce plan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {!isAdmin && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
            Seuls les administrateurs peuvent gérer les abonnements. Contactez
            l&apos;administrateur de votre organisation pour modifier votre
            abonnement.
          </div>
        )}
      </div>

      {/* Section FAQ */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Questions fréquentes</h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-medium mb-2">
                Comment fonctionne la facturation ?
              </h3>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                La facturation est mensuelle ou annuelle, selon le cycle que
                vous choisissez. Vous pouvez changer de cycle à tout moment
                depuis votre portail de paiement.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Oui, vous pouvez annuler votre abonnement à tout moment. Votre
                abonnement restera actif jusqu&apos;à la fin de la période en
                cours, puis basculera automatiquement vers le plan gratuit.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">
                Que se passe-t-il si je dépasse les limites de mon forfait ?
              </h3>
              <p className="text-sm text-[color:var(--muted-foreground)]">
                Vous serez notifié lorsque vous approchez des limites de votre
                forfait. Si vous dépassez ces limites, vous devrez passer à un
                forfait supérieur pour pouvoir continuer à ajouter de nouveaux
                utilisateurs ou objets.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
