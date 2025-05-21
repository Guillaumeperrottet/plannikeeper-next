"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      // Utiliser authClient pour envoyer l'email de vérification
      await authClient.sendVerificationEmail?.({ email });

      setMessage(
        "Si un compte existe avec cette adresse email, un nouvel email de vérification a été envoyé."
      );
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Renvoyer l&apos;email de vérification
          </h2>
          <p className="mt-2 text-muted-foreground">
            Entrez votre adresse email pour recevoir un nouveau lien de
            vérification.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className="text-sm text-center">
              <p
                className={
                  message.includes("erreur") ? "text-red-500" : "text-green-500"
                }
              >
                {message}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer"}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <a
            href="/signin"
            className="font-medium text-primary hover:text-primary/80"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
