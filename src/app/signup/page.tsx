// src/app/signup/page.tsx
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Placeholder simple pour le chargement
const FormSkeleton = () => (
  <div className="w-full max-w-sm animate-pulse">
    <div className="h-8 bg-gray-200 rounded mb-6 mx-auto w-1/2"></div>
    <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded mt-4"></div>
    </div>
  </div>
);

// Charger le formulaire d'inscription de manière dynamique
const SignUpForm = dynamic(() => import("./signup-form"), {
  loading: () => <FormSkeleton />,
  ssr: true, // Garder true pour un bon SEO, mais optimiser le composant
});

// Ajouter des métadonnées explicites pour l'optimisation
export const metadata = {
  title: "Inscription - PlanniKeeper",
  description:
    "Créez votre compte PlanniKeeper et commencez à gérer vos projets immobiliers.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<FormSkeleton />}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
