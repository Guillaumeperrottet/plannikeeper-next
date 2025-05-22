// src/app/signup/signup-form.tsx - Version sécurisée
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
import {
  User,
  Mail,
  Lock,
  Home,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const SignupImageUpload = dynamic(() => import("./SignupImageUpload"), {
  loading: () => (
    <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4"></div>
  ),
  ssr: false,
});

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
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const planType = searchParams.get("plan") || "FREE";
  const isPaidPlan = planType !== "FREE";

  const handleImageSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

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

        // Upload d'image si nécessaire
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

        // Préparer les données pour l'inscription
        interface SignupData {
          email: string;
          password: string;
          name: string;
          image?: string;
          inviteCode?: string;
          planType?: string;
        }

        const signupData: SignupData = {
          email,
          password,
          name,
          image: imageUrl,
        };

        // Ajouter les métadonnées
        if (inviteCode) {
          signupData.inviteCode = inviteCode;
        }
        if (planType) {
          signupData.planType = planType;
        }

        console.log("📤 Envoi demande d'inscription:", {
          email,
          name,
          planType,
          inviteCode,
        });

        // Inscription avec notre système sécurisé
        const result = await authClient.signUp.email(signupData);

        if (result.error) {
          console.error("Signup error:", result.error);
          setError(result.error.message || "Erreur lors de l'inscription");
          setIsSubmitting(false);
          return;
        }

        // Afficher le message de succès
        setShowSuccess(true);
        toast.success("Email de vérification envoyé !");
      } catch (err) {
        console.error("Erreur d'inscription:", err);
        setError("Une erreur inattendue est survenue");
        setIsSubmitting(false);
      }
    },
    [inviteCode, planType, selectedFile, isSubmitting]
  );

  // Affichage du message de succès
  if (showSuccess) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold text-[#141313] mb-4">
          Vérifiez votre email
        </h2>

        <div className="bg-[#e0f2fe] border border-[#7dd3fc] rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-[#0284c7] mt-0.5">
              <Mail className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-[#0284c7] mb-2">
                Email de vérification envoyé !
              </h3>
              <p className="text-[#0284c7] text-sm mb-3">
                Nous avons envoyé un lien de vérification à votre adresse email.
                <strong>
                  {" "}
                  Votre compte ne sera créé qu&apos;après avoir cliqué sur ce
                  lien.
                </strong>
              </p>
              <p className="text-[#0284c7] text-sm">
                💡 <strong>Vérifiez également votre dossier spam</strong> si
                vous ne voyez pas l&apos;email dans quelques minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#fff3cd] border border-[#ffeaa7] rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#856404] mt-0.5" />
            <div className="text-left">
              <p className="text-[#856404] text-sm">
                <strong>Important :</strong> Le lien expire dans 24 heures. Si
                vous ne finalisez pas votre inscription dans ce délai, vous
                devrez recommencer le processus.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-[#62605d]">
            Vous n&apos;avez pas reçu l&apos;email ?
          </p>
          <Button
            onClick={() => setShowSuccess(false)}
            variant="outline"
            className="w-full border-[#beac93] hover:bg-[#e8ebe0]"
          >
            Réessayer avec une autre adresse
          </Button>
          <p className="text-xs text-[#62605d]">
            Ou{" "}
            <Link href="/signin" className="text-[#d9840d] hover:underline">
              connectez-vous si vous avez déjà un compte
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="absolute top-4 right-4">
        <Link
          href="/"
          className="text-[#62605d] hover:text-[#d9840d] transition-colors"
        >
          <Home size={20} />
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-center mb-6 text-[#141313]">
        Inscription
      </h2>

      {isInvite && (
        <div className="mb-6 p-5 bg-[#e0f2fe] border border-[#7dd3fc] rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-[#0284c7] mt-0.5">
              <svg
                className="h-5 w-5"
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
            <p className="text-[#0284c7] flex-1">
              Vous avez été invité à rejoindre{" "}
              <strong className="font-semibold">{organizationName}</strong>
            </p>
          </div>
        </div>
      )}

      <div
        className={`mb-6 p-5 rounded-xl shadow-sm ${
          isPaidPlan
            ? "bg-[#ffedd5] border border-[#fcd34d]"
            : "bg-[#dcfce7] border border-[#86efac]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={isPaidPlan ? "text-[#f59e0b]" : "text-[#16a34a]"}>
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p
              className={
                isPaidPlan
                  ? "text-[#f59e0b] font-medium"
                  : "text-[#16a34a] font-medium"
              }
            >
              Plan sélectionné :{" "}
              <strong className="font-semibold">
                {getPlanDisplayName(planType)}
              </strong>
            </p>
            <p
              className={`mt-1 text-sm ${isPaidPlan ? "text-[#f59e0b]/90" : "text-[#16a34a]/90"}`}
            >
              {isPaidPlan
                ? "Votre compte sera créé après vérification de votre email. Vous pourrez ensuite configurer votre abonnement."
                : "Votre compte gratuit sera créé après vérification de votre email."}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#fee2e2] border border-[#fca5a5] shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-[#b91c1c] mt-0.5">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-[#b91c1c] flex-1 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <SignupImageUpload onImageSelect={handleImageSelect} />

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-[#141313]">
            Nom complet
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-[#62605d]" />
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Entrez votre nom complet"
              autoComplete="name"
              className="pl-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg shadow-sm hover:border-[#d9840d]/70 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[#141313]">
            Adresse email
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-[#62605d]" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Entrez votre email"
              autoComplete="email"
              className="pl-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg shadow-sm hover:border-[#d9840d]/70 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-[#141313]"
          >
            Mot de passe
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-[#62605d]" />
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Mot de passe (min. 8 caractères)"
              minLength={8}
              autoComplete="new-password"
              className="pl-10 bg-white border-[#beac93] focus:border-[#d9840d] rounded-lg shadow-sm hover:border-[#d9840d]/70 transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-6 mt-2 bg-gradient-to-r from-[#d9840d] to-[#e36002] hover:from-[#c6780c] hover:to-[#d9840d] transition-all duration-300 transform hover:scale-[1.02] font-medium shadow-md text-white rounded-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Envoi en cours..."
          ) : (
            <>
              Créer mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        <div className="mt-2 text-center">
          <p className="text-sm text-[#62605d]">
            Vous avez déjà un compte?{" "}
            <Link
              href="/signin"
              className="text-[#d9840d] hover:text-[#c6780c] hover:underline underline-offset-4 font-medium transition-colors"
            >
              Connectez-vous
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-[#beac93]/30">
        <p className="text-xs text-center text-[#62605d]">
          En vous inscrivant, vous acceptez nos{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-[#d9840d] transition-colors"
          >
            Conditions d&apos;utilisation
          </a>{" "}
          et notre{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-[#d9840d] transition-colors"
          >
            Politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default memo(SignUpForm);
