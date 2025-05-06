"use client";

import { useState, useEffect } from "react";
import { PlanType } from "@prisma/client";
import { Check, Loader2, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import { SelectionBadge } from "@/app/components/ui/SelectionBadge";

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
        return "Indépendant";
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
      case "PERSONAL":
        return <CreditCard className="h-8 w-8 text-blue-500" />;
      case "PROFESSIONAL":
        return <CreditCard className="h-8 w-8 text-amber-500" />;
      case "ENTERPRISE":
        return <CreditCard className="h-8 w-8 text-purple-500" />;
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
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
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
              className={`bg-gradient-to-r ${
                planName === "FREE"
                  ? "from-gray-500 to-gray-600"
                  : planName === "PERSONAL"
                    ? "from-blue-500 to-blue-600"
                    : planName === "PROFESSIONAL"
                      ? "from-amber-500 to-amber-600"
                      : "from-purple-500 to-purple-600"
              } p-6 text-white`}
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
                <p className="text-gray-600 mb-4">
                  Vous avez sélectionné le plan {getPlanDisplayName(planName)}.
                  {planName === "FREE"
                    ? " Ce plan est gratuit et sera activé immédiatement."
                    : " Après confirmation, vous serez redirigé vers la page de paiement."}
                </p>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg"
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
                >
                  Annuler
                </Button>

                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`${
                    planName === "FREE"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : planName === "PERSONAL"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : planName === "PROFESSIONAL"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-purple-600 hover:bg-purple-700"
                  } text-white`}
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
}: PricingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(
    currentPlan?.id || null
  );
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<Plan | null>(null);

  const handleSelectPlan = (plan: Plan) => {
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
    if (!planToConfirm) return;

    setLoading(planToConfirm.id);
    setSelectedPlan(planToConfirm.id);
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
      // Réinitialiser à l'état précédent en cas d'erreur
      setSelectedPlan(currentPlan?.id || null);
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
          <motion.div
            key={plan.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
              y: -10,
              scale: 1.02,
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
              transition: { duration: 0.2 },
            }}
            animate={{
              y: selectedPlan === plan.id ? -10 : 0,
              scale: selectedPlan === plan.id ? 1.02 : 1,
              boxShadow:
                selectedPlan === plan.id
                  ? "0px 10px 25px rgba(0, 0, 0, 0.15)"
                  : "0px 4px 6px rgba(0, 0, 0, 0.05)",
            }}
            className={`border rounded-lg overflow-hidden transition-all duration-300 ${
              hoveredPlan === plan.id
                ? "border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/20"
                : selectedPlan === plan.id || currentPlan?.id === plan.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200"
            } relative`}
            onMouseEnter={() => setHoveredPlan(plan.id)}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            {/* Badge Sélectionné */}
            <SelectionBadge
              isSelected={
                selectedPlan === plan.id && currentPlan?.id !== plan.id
              }
              isCurrentPlan={currentPlan?.id === plan.id}
            />

            {/* Badge populaire ou recommandé pour certains plans */}
            {plan.name === "PROFESSIONAL" && (
              <div className="absolute top-0 right-0 bg-[color:var(--primary)] text-white text-xs px-3 py-1 rounded-bl-lg">
                <span className="flex items-center gap-1">
                  <Sparkles size={12} />
                  Populaire
                </span>
              </div>
            )}

            <div className="p-6 bg-white relative">
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
                  <motion.li
                    key={index}
                    initial={{ opacity: 1, x: 0 }}
                    animate={{
                      opacity: 1,
                      x:
                        hoveredPlan === plan.id || selectedPlan === plan.id
                          ? 3
                          : 0,
                    }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-start"
                  >
                    <Check
                      className={`h-5 w-5 mr-2 flex-shrink-0 ${
                        hoveredPlan === plan.id || selectedPlan === plan.id
                          ? "text-[color:var(--primary)]"
                          : "text-green-500"
                      }`}
                    />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full transition-all duration-300 ${
                  hoveredPlan === plan.id && currentPlan?.id !== plan.id
                    ? "bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90"
                    : ""
                }`}
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
                  <span className="flex items-center justify-center">
                    <Check className="mr-2 h-4 w-4" />
                    Plan actuel
                  </span>
                ) : (
                  "Sélectionner"
                )}
              </Button>
            </div>
          </motion.div>
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
