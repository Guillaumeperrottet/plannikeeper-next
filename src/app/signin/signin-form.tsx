"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function SignInForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectPath,
      });

      if (authError) {
        setError("Identifiants invalides");
        return;
      }

      // Petite pause pour permettre aux cookies d'être définis
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Utiliser le router Next.js au lieu de window.location.href
      router.push(redirectPath);
      router.refresh(); // Force Next.js à revalider les données
    } catch (err) {
      console.error("Login error:", err);
      setError("Une erreur est survenue, veuillez réessayer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Connexion</h1>
        <p className="text-lg text-gray-600 mb-6">
          Connectez-vous pour accéder à votre espace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-900"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-white border-gray-200 focus:ring-2 focus:ring-[#d9840d] focus:border-transparent rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-900"
            >
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10 bg-white border-gray-200 focus:ring-2 focus:ring-[#d9840d] focus:border-transparent rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-3 bg-[#d9840d] hover:bg-[#c6780c] transition-colors font-medium text-white rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>

        <div className="flex flex-col space-y-4 text-center">
          <div className="text-sm">
            <span className="text-gray-600">
              Vous n&apos;avez pas encore de compte ?{" "}
            </span>
            <Link
              href="/signup"
              className="text-[#d9840d] hover:text-[#c6780c] underline transition-colors"
            >
              Inscrivez-vous
            </Link>
          </div>

          <div className="text-sm">
            <Link
              href="/pricing"
              className="text-[#d9840d] hover:text-[#c6780c] underline transition-colors"
            >
              Découvrez nos formules
            </Link>
          </div>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-center text-gray-600">
          En continuant, vous acceptez nos{" "}
          <a
            href="#"
            className="underline hover:text-[#d9840d] transition-colors"
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
