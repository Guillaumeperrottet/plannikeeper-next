"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Mail, Phone, MapPin, Globe } from "lucide-react";
// import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";

// Données pour les bureaux
const offices = [
  {
    city: "Bulle",
    address: "Rue de Battentin 1, 1630 bulle",
    phone: "+41 79 341 40 74",
    email: "perrottet.guillaume.97@gmail.com",
  },
];

// Liste des secteurs d'activité pour le formulaire
const industries = [
  "Immobilier",
  "Architecture",
  "Hôtellerie",
  "Tourisme",
  "Services aux entreprises",
  "Construction",
  "Éducation",
  "Santé",
  "Autre",
];

// Animations pour les entrées des éléments
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// // Carte de client fidèle (témoignage)
// interface ClientCardProps {
//   logo: string;
//   company: string;
//   name: string;
//   role: string;
//   quote: string;
//   delay: number;
// }

// const ClientCard = ({
//   logo,
//   company,
//   name,
//   role,
//   quote,
//   delay,
// }: ClientCardProps) => (
//   <motion.div
//     initial="hidden"
//     whileInView="visible"
//     viewport={{ once: true, amount: 0.3 }}
//     variants={{
//       hidden: { opacity: 0, y: 20 },
//       visible: {
//         opacity: 1,
//         y: 0,
//         transition: {
//           duration: 0.6,
//           delay: delay,
//           ease: "easeOut",
//         },
//       },
//     }}
//     className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:border-[color:var(--primary)] transition-all duration-300"
//   >
//     <div className="flex items-center mb-4">
//       <div className="w-12 h-12 relative mr-4 flex-shrink-0">
//         <Image
//           src={logo}
//           alt={`${company} logo`}
//           fill
//           className="object-contain"
//         />
//       </div>
//       <div>
//         <h3 className="font-semibold text-gray-900">{company}</h3>
//         <p className="text-sm text-gray-500">
//           {name}, {role}
//         </p>
//       </div>
//     </div>
//     <p className="text-gray-700 italic">&quot;{quote}&quot;</p>
//   </motion.div>
// );

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    industry: "",
    employees: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation d'envoi du formulaire
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Votre message a été envoyé avec succès!");

      // Réinitialiser le formulaire après un délai
      setTimeout(() => {
        setFormState({
          name: "",
          email: "",
          company: "",
          industry: "",
          employees: "",
          message: "",
        });
        setIsSubmitted(false);
      }, 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f3ec] to-[#f5f3ef]">
      {/* Hero section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[color:var(--primary)]/10 px-4 py-1 rounded-full mb-4 border border-[color:var(--primary)]/20">
            <span className="text-[color:var(--primary)] font-medium text-sm">
              Contactez-nous
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            Discutons de votre projet
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Notre équipe est prête à vous accompagner dans la gestion de vos
            biens immobiliers. Prenez contact avec nous dès aujourd&apos;hui.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Formulaire de contact */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  delay: 0.2,
                  ease: "easeOut",
                },
              },
            }}
            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Contactez-nous
            </h2>

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Message envoyé !
                </h3>
                <p className="text-gray-600 mb-6">
                  Merci de nous avoir contactés. Notre équipe vous répondra dans
                  les plus brefs délais.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  className="bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90"
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      placeholder="Jean Dupont"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email professionnel</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      placeholder="jean.dupont@entreprise.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formState.company}
                      onChange={handleChange}
                      required
                      placeholder="Nom de votre entreprise"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Secteur d&apos;activité</Label>
                    <select
                      id="industry"
                      name="industry"
                      value={formState.industry}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] sm:text-sm"
                    >
                      <option value="" disabled>
                        Sélectionnez votre secteur
                      </option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="employees">Nombre d&apos;employés</Label>
                  <select
                    id="employees"
                    name="employees"
                    value={formState.employees}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] sm:text-sm"
                  >
                    <option value="" disabled>
                      Sélectionnez une option
                    </option>
                    <option value="1-10">1-10 employés</option>
                    <option value="11-50">11-50 employés</option>
                    <option value="51-200">51-200 employés</option>
                    <option value="201-500">201-500 employés</option>
                    <option value="501+">Plus de 500 employés</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Votre message</Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Décrivez votre projet ou vos besoins..."
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] sm:text-sm"
                  ></textarea>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      required
                      className="h-4 w-4 rounded border-gray-300 text-[color:var(--primary)] focus:ring-[color:var(--primary)]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="privacy" className="text-gray-600">
                      J&apos;accepte que mes données soient traitées
                      conformément à la{" "}
                      <a
                        href="/privacy"
                        className="text-[color:var(--primary)] hover:underline"
                      >
                        politique de confidentialité
                      </a>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90"
                >
                  {isSubmitting ? (
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
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Envoyer votre message
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Informations de contact */}
          <div className="space-y-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.3,
                    ease: "easeOut",
                  },
                },
              }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Contactez-nous directement
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-[color:var(--primary)] mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <a
                      href="mailto:perrottet.guillaume.97@gmail.com"
                      className="text-gray-600 hover:text-[color:var(--primary)]"
                    >
                      perrottet.guillaume.97@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-[color:var(--primary)] mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Téléphone</p>
                    <a
                      href="tel:+41793414074"
                      className="text-gray-600 hover:text-[color:var(--primary)]"
                    >
                      +41 79 341 40 74
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <Globe className="w-5 h-5 text-[color:var(--primary)] mt-0.5 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Site web</p>
                    <a
                      href="https://www.campus-gerance.ch/"
                      className="text-gray-600 hover:text-[color:var(--primary)]"
                    >
                      www.campus-gerance.ch
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.4,
                    ease: "easeOut",
                  },
                },
              }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Nos bureaux
              </h3>
              <div className="space-y-6">
                {offices.map((office, index) => (
                  <div
                    key={office.city}
                    className={
                      index !== 0 ? "pt-4 border-t border-gray-200" : ""
                    }
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {office.city}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-[color:var(--primary)] mt-0.5 mr-2" />
                        <span className="text-gray-600">{office.address}</span>
                      </div>
                      <div className="flex items-start">
                        <Phone className="w-4 h-4 text-[color:var(--primary)] mt-0.5 mr-2" />
                        <a
                          href={`tel:${office.phone}`}
                          className="text-gray-600 hover:text-[color:var(--primary)]"
                        >
                          {office.phone}
                        </a>
                      </div>
                      <div className="flex items-start">
                        <Mail className="w-4 h-4 text-[color:var(--primary)] mt-0.5 mr-2" />
                        <a
                          href={`mailto:${office.email}`}
                          className="text-gray-600 hover:text-[color:var(--primary)]"
                        >
                          {office.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section témoignages clients
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <div className="inline-block bg-blue-50 px-4 py-1 rounded-full mb-4 border border-blue-200">
            <span className="text-blue-700 font-medium text-sm">
              Ils nous font confiance
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Des entreprises de renom qui utilisent PlanniKeeper
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Rejoignez les entreprises qui ont transformé leur gestion
            immobilière grâce à notre solution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ClientCard
            logo="/images/swiss-logo-1.svg"
            company="Hôtels Suisse Premium"
            name="Marie Dubois"
            role="Directrice des Opérations"
            quote="PlanniKeeper nous a permis de centraliser la gestion de nos 12 hôtels en Suisse et de gagner un temps précieux."
            delay={0.1}
          />
          <ClientCard
            logo="/images/swiss-logo-2.svg"
            company="Immobilier Léman SA"
            name="Thomas Weber"
            role="CEO"
            quote="L'interface intuitive et les fonctionnalités avancées de PlanniKeeper ont révolutionné notre approche de la gestion de biens."
            delay={0.2}
          />
          <ClientCard
            logo="/images/swiss-logo-3.svg"
            company="Montreux Resorts"
            name="Sophie Blanc"
            role="Directrice Technique"
            quote="Le support client de PlanniKeeper est exceptionnel. Ils ont su s'adapter à nos besoins spécifiques."
            delay={0.3}
          />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6,
                delay: 0.4,
                ease: "easeOut",
              },
            },
          }}
          className="flex justify-center mt-12"
        >
          <a
            href="/testimonials"
            className="inline-flex items-center text-[color:var(--primary)] font-medium hover:underline"
          >
            Voir tous nos témoignages
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </motion.div>
      </section> */}

      {/* Section FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Questions fréquentes
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Vous avez des questions ? Consultez notre FAQ ou contactez-nous
            directement.
          </p>
        </motion.div>

        <div className="space-y-6">
          {[
            {
              question:
                "Comment PlanniKeeper peut-il s'adapter à mon entreprise ?",
              answer:
                "PlanniKeeper propose différentes formules adaptées à tous types d'entreprises, de la startup au grand groupe. Notre solution est entièrement personnalisable pour répondre à vos besoins spécifiques.",
            },
            {
              question: "Proposez-vous des formations pour mon équipe ?",
              answer:
                "Oui, nous proposons des sessions de formation personnalisées pour votre équipe. Nos experts vous accompagnent tout au long de la prise en main de la plateforme.",
            },
            {
              question:
                "Comment sont gérées les mises à jour de la plateforme ?",
              answer:
                "Les mises à jour sont automatiques et régulières, sans interruption de service. Nous vous informons des nouvelles fonctionnalités via notre newsletter.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.1 * index,
                    ease: "easeOut",
                  },
                },
              }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {item.question}
              </h3>
              <p className="text-gray-600">{item.answer}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6,
                delay: 0.5,
                ease: "easeOut",
              },
            },
          }}
          className="mt-12 text-center"
        ></motion.div>
      </section>
    </div>
  );
}
