// src/app/invitation/[code]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import dynamic from "next/dynamic";

// Charger l'upload d'image dynamiquement pour éviter les problèmes SSR
const SignupImageUpload = dynamic(
  () => import("@/app/signup/SignupImageUpload"),
  {
    loading: () => (
      <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto mb-4"></div>
    ),
    ssr: false,
  }
);

interface InvitationDetails {
  valid: boolean;
  organizationName?: string;
  role?: string;
  organizationId?: string;
  error?: string;
}

export default function InvitationSignupPage() {
  const params = useParams();
  const router = useRouter();
  const [inviteDetails, setInviteDetails] = useState<InvitationDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const inviteCode = typeof params.code === "string" ? params.code : "";

  // Vérifier la validité du code d'invitation
  useEffect(() => {
    async function validateInvitation() {
      try {
        if (!inviteCode) {
          setInviteDetails({
            valid: false,
            error: "Code d'invitation manquant",
          });
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `/api/invitations/validate?code=${inviteCode}`
        );
        const data = await response.json();

        setInviteDetails(data);
        setIsLoading(false);

        if (!data.valid) {
          toast.error(data.error || "Code d'invitation invalide");
        }
      } catch (err) {
        console.error("Erreur lors de la validation du code:", err);
        setInviteDetails({
          valid: false,
          error: "Erreur lors de la validation du code",
        });
        setIsLoading(false);
      }
    }

    validateInvitation();
  }, [inviteCode]);

  const handleImageSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
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
      const signupData = {
        email,
        password,
        name,
        image: imageUrl,
        inviteCode: inviteCode,
        organizationId: inviteDetails?.organizationId,
      };

      console.log("📤 Envoi demande d'inscription avec invitation:", {
        email,
        name,
        inviteCode,
        organizationId: inviteDetails?.organizationId,
      });

      // Inscription avec Better Auth
      const result = await authClient.signUp.email(signupData);

      if (result.error) {
        console.error("Erreur d'inscription:", result.error);
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
  };

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
                  Votre compte ne sera activé qu&apos;après avoir cliqué sur ce
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

        {inviteDetails?.valid && (
          <div className="bg-[#dcfce7] border border-[#86efac] rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-[#16a34a] mt-0.5">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[#16a34a] text-sm">
                  <strong>Invitation détectée :</strong> Après vérification de
                  votre email, vous serez ajouté à l&apos;organisation{" "}
                  <strong>{inviteDetails.organizationName}</strong> avec le rôle{" "}
                  <strong>
                    {inviteDetails.role === "admin"
                      ? "Administrateur"
                      : "Membre"}
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

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

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d9840d] mb-4"></div>
        <p>Vérification du code d&apos;invitation...</p>
      </div>
    );
  }

  if (!inviteDetails?.valid) {
    return (
      <div className="w-full">
        <div className="bg-[#fee2e2] border border-[#fca5a5] rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-[#b91c1c] mt-0.5" />
            <div className="text-left">
              <h3 className="font-semibold text-[#b91c1c] mb-2">
                Code d&apos;invitation invalide
              </h3>
              <p className="text-[#b91c1c]">
                {inviteDetails?.error ||
                  "Ce code d'invitation n'est pas valide ou a expiré. Veuillez contacter la personne qui vous a invité pour obtenir un nouveau lien."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={() => router.push("/signup")}
            className="bg-[#d9840d] hover:bg-[#c6780c] text-white"
          >
            Créer un compte standard
          </Button>
          <Link
            href="/signin"
            className="text-[#d9840d] hover:underline text-sm"
          >
            Se connecter avec un compte existant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#141313]">
        Rejoindre {inviteDetails.organizationName}
      </h2>

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
          <div className="text-[#0284c7] flex-1">
            <p className="font-medium">
              Vous avez été invité à rejoindre{" "}
              <strong className="font-semibold">
                {inviteDetails.organizationName}
              </strong>
            </p>
            <p className="text-sm mt-1">
              Vous rejoindrez l&apos;organisation avec le rôle :{" "}
              <strong>
                {inviteDetails.role === "admin" ? "Administrateur" : "Membre"}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#fee2e2] border border-[#fca5a5] shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-[#b91c1c] mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-[#b91c1c] flex-1 font-medium text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Inscription en cours...
            </>
          ) : (
            "Rejoindre l'organisation"
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
