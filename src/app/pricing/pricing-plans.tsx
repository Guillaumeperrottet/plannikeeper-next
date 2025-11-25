// src/app/pricing/pricing-plans.tsx - Version mise à jour cohérente avec landing
"use client";

import { useState, useEffect } from "react";
import { PlanType } from "@prisma/client";
import {
  Check,
  Loader2,
  Sparkles,
  CreditCard,
  Shield,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import Link from "next/link";

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
  organizationId: string | null;
  isLoggedIn: boolean;
}

// Composant de Confetti
const ConfettiCelebration = ({ show }: { show: boolean }) => {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <ReactConfetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={500}
        gravity={0.2}
        colors={[
          "#d9840d", // Orange (primary)
          "#e36002", // Orange foncé
          "#b8a589", // Beige
          "#3b82f6", // Bleu
          "#10b981", // Vert
        ]}
      />
    </div>
  );
};

// Composant Modal de Confirmation
const PlanConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  planPrice,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: PlanType | string;
  planPrice: number | string;
  isLoading: boolean;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  // Fonction pour obtenir le nom d'affichage du plan
  const getPlanDisplayName = (planName: PlanType | string) => {
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

  // Fonction pour obtenir l'icône du plan
  const getPlanIcon = (planName: PlanType | string) => {
    switch (planName) {
      case "FREE":
        return <Shield className="h-8 w-8 text-gray-500" />;
      case "PERSONAL":
        return <Check className="h-8 w-8 text-[#3b82f6]" />;
      case "PROFESSIONAL":
        return <Sparkles className="h-8 w-8 text-[#d9840d]" />;
      case "ENTERPRISE":
        return <Star className="h-8 w-8 text-[#8b5cf6]" />;
      default:
        return <CreditCard className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* En-tête coloré */}
            <div
              className={`p-6 text-white ${
                planName === "FREE"
                  ? "bg-gradient-to-r from-gray-500 to-gray-600"
                  : planName === "PERSONAL"
                    ? "bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]"
                    : planName === "PROFESSIONAL"
                      ? "bg-gradient-to-r from-[#d9840d] to-[#e36002]"
                      : "bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]"
              }`}
            >
              <div className="flex items-center gap-4">
                {getPlanIcon(planName)}
                <div>
                  <h3 className="text-xl font-bold">
                    Plan {getPlanDisplayName(planName)}
                  </h3>
                  <p>
                    {typeof planPrice === "number"
                      ? planPrice === 0
                        ? "Gratuit"
                        : `${planPrice}€/mois`
                      : planPrice}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6">
              <h4 className="font-semibold text-lg mb-4">
                Confirmation de sélection
              </h4>

              <div className="mb-6">
                <p className="text-[#62605d] mb-4">
                  Vous avez sélectionné le plan {getPlanDisplayName(planName)}.
                  {planName === "FREE"
                    ? " Ce plan est gratuit et sera activé immédiatement."
                    : " Après confirmation, vous serez redirigé vers la page de paiement."}
                </p>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 text-[#16a34a] bg-[#dcfce7] p-3 rounded-lg"
                >
                  <Check className="h-5 w-5" />
                  <span>Sélection confirmée</span>
                </motion.div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="border-[#beac93] text-[#141313] hover:bg-[#e8ebe0]"
                >
                  Annuler
                </Button>

                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`text-white ${
                    planName === "FREE"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : planName === "PERSONAL"
                        ? "bg-[#3b82f6] hover:bg-[#2563eb]"
                        : planName === "PROFESSIONAL"
                          ? "bg-[#d9840d] hover:bg-[#c6780c]"
                          : "bg-[#8b5cf6] hover:bg-[#7c3aed]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {planName === "FREE"
                        ? "Activation en cours..."
                        : "Redirection en cours..."}
                    </>
                  ) : (
                    <>
                      {planName === "FREE" ? (
                        "Activer maintenant"
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Procéder au paiement
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function PricingPlans({
  plans,
  currentPlan,
  isAdmin,
  organizationId,
  isLoggedIn,
}: PricingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<Plan | null>(null);

  // Fonction pour obtenir l'icône pour chaque plan
  const getPlanIcon = (planName: PlanType) => {
    switch (planName) {
      case "FREE":
        return <Shield className="h-6 w-6 text-gray-500" />;
      case "PERSONAL":
        return <Check className="h-6 w-6 text-[#3b82f6]" />;
      case "PROFESSIONAL":
        return <Sparkles className="h-6 w-6 text-[#d9840d]" />;
      case "ENTERPRISE":
        return <Star className="h-6 w-6 text-[#8b5cf6]" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-500" />;
    }
  };

  // Fonction pour obtenir le nom d'affichage du plan
  const getPlanDisplayName = (planName: PlanType) => {
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

  // Simplifier les features selon le plan (comme dans la landing)
  const getSimplifiedFeatures = (plan: Plan) => {
    switch (plan.name) {
      case "FREE":
        return [
          "1 utilisateur",
          "1 objet immobilier",
          "500MB de stockage",
          "Support communauté",
        ];
      case "PERSONAL":
        return [
          "1 utilisateur",
          "1 objet immobilier",
          "2GB de stockage",
          "Support email",
        ];
      case "PROFESSIONAL":
        return [
          "5 utilisateurs",
          "3 objets immobiliers",
          "10GB de stockage",
          "Support prioritaire",
        ];
      case "ENTERPRISE":
        return [
          "10 utilisateurs",
          "5 objets immobiliers",
          "50GB de stockage",
          "Support premium",
        ];
      default:
        return plan.features.slice(0, 4); // Limiter à 4 features max
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!isLoggedIn) {
      // Rediriger vers la page d'inscription avec le plan présélectionné
      window.location.href = `/signup?plan=${plan.name}`;
      return;
    }

    if (!isAdmin) {
      toast.error("Seuls les administrateurs peuvent modifier l'abonnement");
      return;
    }

    // Afficher le modal de confirmation au lieu de procéder immédiatement
    setPlanToConfirm(plan);
    setShowConfirmationModal(true);
  };

  // Fonction pour confirmer la sélection après le modal
  const confirmPlanSelection = async () => {
    if (!planToConfirm || !organizationId) return;

    setLoading(planToConfirm.id);
    setShowConfetti(true);
    setShowConfirmationModal(false);

    try {
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: planToConfirm.name,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }

      const data = await response.json();

      // Animation et feedback visuel
      toast.success(`Plan ${planToConfirm.name} sélectionné avec succès!`);

      // Rediriger vers l'URL de paiement ou le dashboard pour le plan gratuit
      if (data.url) {
        toast.success("Redirection vers la page de paiement...");
        setTimeout(() => {
          window.location.href = data.url;
        }, 800); // Délai pour voir l'animation
      } else if (data.success) {
        toast.success("Plan mis à jour avec succès!");
        setTimeout(() => {
          window.location.href = "/dashboard?subscription=updated";
        }, 800);
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
    if (!isLoggedIn || !isAdmin) {
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

  // Trier les plans par prix et ne garder que les plans standard (pas SUPER_ADMIN, etc.)
  const standardPlans = plans.filter((plan) =>
    ["FREE", "PERSONAL", "PROFESSIONAL", "ENTERPRISE"].includes(plan.name)
  );
  const sortedPlans = [...standardPlans].sort((a, b) => a.price - b.price);

  return (
    <div>
      <ConfettiCelebration show={showConfetti} />

      {/* Modal de confirmation */}
      <PlanConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={confirmPlanSelection}
        planName={planToConfirm?.name || ""}
        planPrice={
          planToConfirm?.hasCustomPricing
            ? "Prix personnalisé"
            : planToConfirm?.price || 0
        }
        isLoading={loading === planToConfirm?.id}
      />

      {isLoggedIn && currentPlan && (
        <div className="mb-10 p-6 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                {getPlanIcon(currentPlan.name)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#141313]">
                  Votre plan actuel: {getPlanDisplayName(currentPlan.name)}
                </h2>
                <p className="text-[#3b82f6]">
                  {currentPlan.hasCustomPricing
                    ? "Prix personnalisé"
                    : currentPlan.price === 0
                      ? "Gratuit"
                      : `${currentPlan.price}€/mois`}
                </p>
              </div>
            </div>
            {isAdmin && currentPlan.name !== "FREE" && (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                disabled={loading === "manage"}
                className="border-[#3b82f6] text-[#3b82f6] hover:bg-[#dbeafe] transition-colors"
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

      {!isLoggedIn && (
        <div className="mb-10 p-6 bg-[#fff7ed] border border-[#ffedd5] rounded-xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-[#d9840d] mt-1">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[#d9840d] font-medium mb-2">
                Consultez nos différentes formules et choisissez celle qui
                correspond le mieux à vos besoins.
              </p>
              <p className="text-[#d9840d]/80">
                Pour sélectionner un plan, vous devrez{" "}
                <Link
                  href="/signup"
                  className="font-medium underline underline-offset-4 hover:text-[#c6780c]"
                >
                  vous inscrire
                </Link>{" "}
                ou{" "}
                <Link
                  href="/signin"
                  className="font-medium underline underline-offset-4 hover:text-[#c6780c]"
                >
                  vous connecter
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plans simplifiés avec hauteur uniforme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedPlans.map((plan) => {
          const isPopular = plan.name === "PROFESSIONAL";
          const isCurrentPlan = isLoggedIn && currentPlan?.id === plan.id;
          const simplifiedFeatures = getSimplifiedFeatures(plan);

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl overflow-hidden transition-colors h-[480px] flex flex-col relative ${
                isPopular
                  ? "border-2 border-[#d9840d]"
                  : "border border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Badge populaire pour plan professionnel */}
              {isPopular && (
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg z-10 font-medium text-xs text-white bg-[#d9840d]">
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} />
                    Populaire
                  </span>
                </div>
              )}

              <div className="relative flex flex-col h-full">
                {/* Contenu du plan */}
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-gray-900">
                      {getPlanIcon(plan.name)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {getPlanDisplayName(plan.name)}
                    </h3>
                  </div>

                  <div className="mb-6">
                    {plan.hasCustomPricing ? (
                      <div className="text-2xl font-bold text-gray-900">
                        Sur mesure
                      </div>
                    ) : (
                      <div className="flex items-end">
                        <span className="text-2xl font-bold text-gray-900">
                          {plan.price === 0 ? "Gratuit" : `${plan.price} CHF`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-600 ml-1 text-sm">
                            /mois
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    {simplifiedFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center mt-0.5 flex-shrink-0 mr-3">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-gray-600 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full transition-colors ${
                        isCurrentPlan
                          ? "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
                          : isPopular
                            ? "bg-[#d9840d] hover:bg-[#c6780c] text-white"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={
                        isLoggedIn &&
                        (loading !== null || !isAdmin || isCurrentPlan)
                      }
                    >
                      {isLoggedIn ? (
                        loading === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Chargement...
                          </>
                        ) : isCurrentPlan ? (
                          <span className="flex items-center justify-center">
                            <Check className="mr-2 h-4 w-4" />
                            Plan actuel
                          </span>
                        ) : (
                          <>
                            Sélectionner ce plan
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )
                      ) : (
                        <>
                          S&apos;inscrire avec ce plan
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section informative */}
      <div className="mt-16 p-6 border border-gray-200 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="p-3 rounded-full bg-white border border-gray-200">
            <svg
              className="h-6 w-6 text-[#d9840d]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-center md:text-left">
            <p className="text-gray-900 mb-1">
              Tous les plans incluent un accès à l&apos;application, les mises à
              jour et les nouvelles fonctionnalités.
            </p>
            <p className="text-gray-600">
              Changement de plan possible à tout moment • Garantie 30 jours •
              Support inclus
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
