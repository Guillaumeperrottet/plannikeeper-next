"use client";

import { useState } from "react";
import { Send, CheckCircle, Mail, Phone, MapPin } from "lucide-react";
import Header from "@/app/components/landing/Header";
import Footer from "@/app/components/landing/Footer";
import { toast } from "sonner";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi du message");
      }

      setIsSubmitted(true);
      toast.success("Votre message a été envoyé avec succès!");

      // Réinitialiser le formulaire après un délai
      setTimeout(() => {
        setFormState({
          firstName: "",
          lastName: "",
          email: "",
          company: "",
          subject: "",
          message: "",
        });
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'envoi du message"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero section */}
      <section className="pt-32 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Contactez-nous
          </h1>
          <p className="text-lg text-gray-600">
            Une question ? Besoin d&apos;informations ? Nous sommes à votre
            écoute.
          </p>
        </div>
      </section>

      {/* Contact section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Carte unique pour les 3 infos de contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-12 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Email */}
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-[#d9840d]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <a
                  href="mailto:gp@webbing.ch"
                  className="text-gray-600 hover:text-[#d9840d] transition-colors"
                >
                  gp@webbing.ch
                </a>
              </div>

              {/* Téléphone */}
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-[#d9840d]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Téléphone</h3>
                <a
                  href="tel:+41793414074"
                  className="text-gray-600 hover:text-[#d9840d] transition-colors"
                >
                  +41 79 341 40 74
                </a>
              </div>

              {/* Localisation */}
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-[#d9840d]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Localisation
                </h3>
                <p className="text-gray-600">Rue de Battentin 1, 1630 Bulle</p>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Ou écrivez-nous
              </h2>
              <p className="text-gray-600">
                Décrivez votre projet, nous vous répondrons rapidement
              </p>
            </div>

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-gray-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Message envoyé !
                </h3>
                <p className="text-gray-600">
                  Notre équipe vous répondra dans les plus brefs délais.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-12">
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-8">
                  Formulaire de contact
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-900 mb-2"
                      >
                        Prénom *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formState.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9840d] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-900 mb-2"
                      >
                        Nom *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formState.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9840d] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9840d] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Entreprise
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formState.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9840d] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Sujet *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9840d] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9840d] focus:border-transparent resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 bg-[#d9840d] text-white rounded-lg hover:bg-[#c6780c] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
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
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer le message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
