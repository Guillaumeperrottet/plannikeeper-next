import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import {
  Smartphone,
  Chrome,
  Globe,
  MoreHorizontal,
  Download,
  Home,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InstallPWAPage() {
  const user = await getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header avec navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour au dashboard
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#d9840d] rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#141313] mb-4">
            Installez PlanniKeeper sur votre appareil
          </h1>
          <p className="text-xl text-[#62605d] mb-6 max-w-2xl mx-auto">
            Profitez d&apos;une expérience optimisée en installant notre
            application directement sur votre écran d&apos;accueil. Accès
            rapide, notifications push et fonctionnement hors ligne !
          </p>
        </div>

        {/* Avantages */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#beac93]/20">
            <div className="w-12 h-12 bg-[#d9840d]/10 rounded-lg flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-[#d9840d]" />
            </div>
            <h3 className="font-semibold text-[#141313] mb-2">Accès rapide</h3>
            <p className="text-[#62605d] text-sm">
              Lancez l&apos;application directement depuis votre écran
              d&apos;accueil, comme une app native
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#beac93]/20">
            <div className="w-12 h-12 bg-[#d9840d]/10 rounded-lg flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-[#d9840d]" />
            </div>
            <h3 className="font-semibold text-[#141313] mb-2">
              Expérience native
            </h3>
            <p className="text-[#62605d] text-sm">
              Interface optimisée avec navigation fluide et intuitive sur tous
              vos appareils
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#beac93]/20">
            <div className="w-12 h-12 bg-[#d9840d]/10 rounded-lg flex items-center justify-center mb-4">
              <Home className="h-6 w-6 text-[#d9840d]" />
            </div>
            <h3 className="font-semibold text-[#141313] mb-2">Hors ligne</h3>
            <p className="text-[#62605d] text-sm">
              Consultez vos données même sans connexion internet
            </p>
          </div>
        </div>

        {/* Instructions par plateforme */}
        <div className="space-y-8">
          {/* iPhone/iPad (Safari) */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#beac93]/20 overflow-hidden">
            <div className="bg-[#d9840d] text-white p-6">
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">iPhone / iPad</h2>
                  <p className="opacity-90">Installation via Safari</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#d9840d] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Ouvrez Safari
                    </h3>
                    <p className="text-[#62605d]">
                      Assurez-vous d&apos;utiliser Safari (pas Chrome ou autre
                      navigateur) sur votre iPhone ou iPad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#d9840d] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Tapez sur le bouton Partager
                    </h3>
                    <p className="text-[#62605d] mb-3">
                      En bas de l&apos;écran, appuyez sur l&apos;icône de
                      partage (carré avec une flèche vers le haut).
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-[#d9840d] rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-[#d9840d]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#d9840d] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Sélectionnez &quot;Sur l&apos;écran d&apos;accueil&quot;
                    </h3>
                    <p className="text-[#62605d] mb-3">
                      Faites défiler vers le bas et appuyez sur &quot;Sur
                      l&apos;écran d&apos;accueil&quot; ou &quot;Add to Home
                      Screen&quot;.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#d9840d]/20 rounded-lg flex items-center justify-center">
                          <Home className="h-4 w-4 text-[#d9840d]" />
                        </div>
                        <span className="font-medium text-[#141313]">
                          Sur l&apos;écran d&apos;accueil
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#d9840d] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Confirmez l&apos;installation
                    </h3>
                    <p className="text-[#62605d]">
                      Appuyez sur &quot;Ajouter&quot; en haut à droite.
                      L&apos;icône PlanniKeeper apparaîtra sur votre écran
                      d&apos;accueil !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Android (Chrome) */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#beac93]/20 overflow-hidden">
            <div className="bg-[#34a853] text-white p-6">
              <div className="flex items-center gap-3">
                <Chrome className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Android</h2>
                  <p className="opacity-90">Installation via Chrome</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#34a853] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Ouvrez le menu Chrome
                    </h3>
                    <p className="text-[#62605d] mb-3">
                      Appuyez sur les trois points verticaux en haut à droite de
                      Chrome.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                      <MoreHorizontal className="w-6 h-6 text-[#34a853] rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#34a853] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Sélectionnez &quot;Ajouter à l&apos;écran
                      d&apos;accueil&quot;
                    </h3>
                    <p className="text-[#62605d] mb-3">
                      Dans le menu, appuyez sur &quot;Ajouter à l&apos;écran
                      d&apos;accueil&quot; ou &quot;Add to Home screen&quot;.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#34a853]/20 rounded-lg flex items-center justify-center">
                          <Download className="h-4 w-4 text-[#34a853]" />
                        </div>
                        <span className="font-medium text-[#141313]">
                          Ajouter à l&apos;écran d&apos;accueil
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#34a853] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Confirmez l&apos;installation
                    </h3>
                    <p className="text-[#62605d]">
                      Une popup apparaîtra. Appuyez sur &quot;Ajouter&quot; pour
                      confirmer. L&apos;application sera ajoutée à votre écran
                      d&apos;accueil !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop (Chrome, Edge, etc.) */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#beac93]/20 overflow-hidden">
            <div className="bg-[#1a73e8] text-white p-6">
              <div className="flex items-center gap-3">
                <Download className="h-8 w-8" />
                <div>
                  <h2 className="text-2xl font-bold">Desktop / Ordinateur</h2>
                  <p className="opacity-90">
                    Installation via Chrome, Edge ou Firefox
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a73e8] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Ouvrez le menu Chrome
                    </h3>
                    <p className="text-[#62605d] mb-3">
                      Cliquez sur les trois points verticaux en haut à droite de
                      Chrome, puis allez dans le menu.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                      <MoreHorizontal className="w-6 h-6 text-[#1a73e8] rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a73e8] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Cliquez sur &quot;Install page as app...&quot;
                    </h3>
                    <p className="text-[#62605d] mb-3">
                      Dans le menu déroulant, cherchez et cliquez sur
                      &quot;Install page as app...&quot; ou &quot;Installer la
                      page comme application&quot;.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1a73e8]/20 rounded-lg flex items-center justify-center">
                          <Download className="h-4 w-4 text-[#1a73e8]" />
                        </div>
                        <span className="font-medium text-[#141313]">
                          Install page as app...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#1a73e8] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#141313] mb-2">
                      Confirmez l&apos;installation
                    </h3>
                    <p className="text-[#62605d]">
                      Une fenêtre popup apparaîtra. Cliquez sur
                      &quot;Installer&quot; pour confirmer. L&apos;application
                      apparaîtra dans votre menu démarrer et bureau !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-12 bg-white rounded-2xl p-8 shadow-lg border border-[#beac93]/20">
          <h3 className="text-2xl font-bold text-[#141313] mb-4">
            Prêt à améliorer votre expérience ?
          </h3>
          <p className="text-[#62605d] mb-6">
            Une fois installée, vous pourrez utiliser PlanniKeeper comme une
            vraie application native sur tous vos appareils !
          </p>
          <Link href="/dashboard">
            <Button className="bg-[#d9840d] hover:bg-[#c6780c] text-white px-8 py-3 rounded-xl font-semibold">
              Retourner au dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
