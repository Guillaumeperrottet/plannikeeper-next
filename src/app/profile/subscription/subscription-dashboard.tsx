// src/app/profile/subscription/subscription-dashboard.tsx - Version modernisée
"use client";

import { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Loader2,
  ArrowRight,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import UsageLimits from "@/app/components/UsageLimits";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { BackButton } from "@/app/components/ui/BackButton";

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

interface SubscriptionDashboardProps {
  subscription: Subscription | null;
  isAdmin: boolean;
}

export default function SubscriptionDashboard({
  subscription,
  isAdmin,
}: SubscriptionDashboardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOption, setCancelOption] = useState<"end_period" | "immediate">(
    "end_period"
  );
  const [cancelLoading, setCancelLoading] = useState(false);

  const currentPlan = subscription?.plan;
  const isFreePlan = currentPlan?.name === "FREE";

  // Fonction pour obtenir le nom d'affichage du plan
  const getPlanDisplayName = (planName: string) => {
    switch (planName) {
      case "FREE":
        return "Gratuit";
      case "PERSONAL":
        return "Particulier";
      case "PROFESSIONAL":
        return "Professionnel";
      case "ENTERPRISE":
        return "Entreprise";
      default:
        return planName;
    }
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Obtenir le statut de l'abonnement
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Actif</span>
          </div>
        );
      case "PAST_DUE":
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Paiement en attente</span>
          </div>
        );
      case "TRIALING":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Période d&apos;essai</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{status}</span>
          </div>
        );
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

      toast.success("Abonnement gratuit renouvelé avec succès!");
      setTimeout(() => window.location.reload(), 1000);
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

  // Gérer l'annulation
  const handleCancelSubscription = async () => {
    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent annuler l'abonnement");
      return;
    }

    setCancelLoading(true);

    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          immediate: cancelOption === "immediate",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      toast.success(
        cancelOption === "immediate"
          ? "Abonnement annulé immédiatement"
          : "Abonnement sera annulé à la fin de la période"
      );

      setShowCancelModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur lors de l'annulation: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setCancelLoading(false);
    }
  };

  // Modal d'annulation
  const CancelModal = () => (
    <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
      <DialogContent className="bg-white">
        <DialogTitle className="text-gray-900">
          Annuler l&apos;abonnement
        </DialogTitle>
        <DialogDescription className="text-gray-600">
          Choisissez quand vous souhaitez annuler votre abonnement
        </DialogDescription>

        <div className="space-y-3 my-4">
          <button
            onClick={() => setCancelOption("end_period")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
              cancelOption === "end_period"
                ? "border-[#d9840d] bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  cancelOption === "end_period"
                    ? "border-[#d9840d]"
                    : "border-gray-300"
                }`}
              >
                {cancelOption === "end_period" && (
                  <div className="w-2 h-2 rounded-full bg-[#d9840d]" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  À la fin de la période
                </p>
                <p className="text-sm text-gray-600">
                  Conservez l&apos;accès jusqu&apos;au{" "}
                  {subscription &&
                    formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setCancelOption("immediate")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
              cancelOption === "immediate"
                ? "border-[#d9840d] bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  cancelOption === "immediate"
                    ? "border-[#d9840d]"
                    : "border-gray-300"
                }`}
              >
                {cancelOption === "immediate" && (
                  <div className="w-2 h-2 rounded-full bg-[#d9840d]" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Immédiatement</p>
                <p className="text-sm text-gray-600">
                  Perdez l&apos;accès dès maintenant
                </p>
              </div>
            </div>
          </button>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCancelModal(false)}
            disabled={cancelLoading}
            className="border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button
            onClick={handleCancelSubscription}
            disabled={cancelLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {cancelLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Annulation...
              </>
            ) : (
              "Confirmer l'annulation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton
              href="/profile"
              label="Retour au profil"
              loadingMessage="Retour au profil..."
            />
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#d9840d] rounded-lg flex items-center justify-center">
                <CreditCard size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Gestion de l&apos;abonnement
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Gérez votre abonnement et vos préférences de facturation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Plan actuel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Plan actuel
          </h2>

          {subscription ? (
            <div className="space-y-4">
              {/* Infos principales */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {getPlanDisplayName(currentPlan?.name || "")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isFreePlan
                      ? "Plan gratuit"
                      : `${currentPlan?.monthlyPrice} CHF/mois`}
                  </p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>

              {/* Dates */}
              {!isFreePlan && (
                <div className="flex gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Période en cours
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(subscription.currentPeriodStart)} -{" "}
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              )}

              {/* Avertissement annulation */}
              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Annulation programmée
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Votre abonnement sera annulé le{" "}
                      {formatDate(subscription.currentPeriodEnd)}. Vous
                      basculerez automatiquement vers le plan gratuit.
                    </p>
                  </div>
                </div>
              )}

              {/* Fonctionnalités */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  Fonctionnalités incluses
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subscription.plan.features.slice(0, 4).map(
                    (feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {!isFreePlan && isAdmin && (
                  <>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={loading === "manage"}
                      className="bg-[#d9840d] hover:bg-[#c6780c] text-white"
                    >
                      {loading === "manage" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Gérer la facturation
                        </>
                      )}
                    </Button>

                    {!subscription.cancelAtPeriodEnd && (
                      <Button
                        onClick={() => setShowCancelModal(true)}
                        variant="outline"
                        className="border-gray-300 text-gray-900 hover:bg-gray-50"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Annuler l&apos;abonnement
                      </Button>
                    )}
                  </>
                )}

                {isFreePlan && isAdmin && (
                  <Button
                    onClick={handleRenewFreePlan}
                    disabled={loading === "renew"}
                    className="bg-[#d9840d] hover:bg-[#c6780c] text-white"
                  >
                    {loading === "renew" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Renouvellement...
                      </>
                    ) : (
                      "Renouveler le plan gratuit"
                    )}
                  </Button>
                )}

                <Button
                  onClick={() => (window.location.href = "/pricing")}
                  variant="outline"
                  className="border-[#d9840d] text-[#d9840d] hover:bg-orange-50"
                >
                  Voir les forfaits disponibles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Aucun abonnement actif trouvé
              </p>
              <Button
                onClick={() => (window.location.href = "/pricing")}
                className="bg-[#d9840d] hover:bg-[#c6780c] text-white"
              >
                Voir les forfaits disponibles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Utilisation actuelle */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Utilisation actuelle
          </h2>
          <UsageLimits />
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Comment fonctionne la facturation ?
              </h3>
              <p className="text-sm text-gray-600">
                La facturation est mensuelle ou annuelle, selon le cycle que vous
                choisissez. Vous pouvez changer de cycle à tout moment depuis
                votre portail de paiement.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="text-sm text-gray-600">
                Oui, vous pouvez annuler votre abonnement à tout moment. Votre
                abonnement restera actif jusqu&apos;à la fin de la période en
                cours, puis basculera automatiquement vers le plan gratuit.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Que se passe-t-il si je dépasse les limites de mon forfait ?
              </h3>
              <p className="text-sm text-gray-600">
                Vous serez notifié lorsque vous approchez des limites de votre
                forfait. Si vous dépassez ces limites, vous devrez passer à un
                forfait supérieur pour pouvoir continuer à ajouter de nouveaux
                utilisateurs ou objets.
              </p>
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              Seuls les administrateurs peuvent gérer les abonnements. Contactez
              l&apos;administrateur de votre organisation pour modifier votre
              abonnement.
            </p>
          </div>
        )}

        {/* Modal d'annulation */}
        <CancelModal />
      </main>
    </div>
  );
}
