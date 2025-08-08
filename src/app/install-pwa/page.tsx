import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { Smartphone, Chrome, Globe, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InstallPWAPage() {
  const user = await getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header avec navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour au dashboard
            </Button>
          </Link>
        </div>

        {/* Hero Section - Plus simple */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#d9840d] rounded-lg flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#141313]">
              Installer PlanniKeeper
            </h1>
          </div>
          <p className="text-[#62605d] max-w-2xl">
            Installez l&apos;application sur votre appareil pour un accès rapide
            et une meilleure expérience.
          </p>
        </div>

        {/* Instructions par plateforme - Style simplifié */}
        <div className="space-y-6">
          {/* iPhone/iPad (Safari) */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-[#d9840d] text-white px-6 py-3 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                <div>
                  <h2 className="font-semibold">iPhone / iPad</h2>
                  <p className="text-sm opacity-90">Via Safari</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#d9840d] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">Ouvrez Safari</p>
                    <p className="text-[#62605d] text-sm">
                      Utilisez Safari, pas Chrome ou autre navigateur.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#d9840d] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      Appuyez sur le bouton Partager
                    </p>
                    <p className="text-[#62605d] text-sm">
                      Icône carré avec une flèche vers le haut, en bas de
                      l&apos;écran.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#d9840d] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      Sélectionnez &quot;Sur l&apos;écran d&apos;accueil&quot;
                    </p>
                    <p className="text-[#62605d] text-sm">
                      Faites défiler et appuyez sur cette option.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#d9840d] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    4
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      Confirmez avec &quot;Ajouter&quot;
                    </p>
                    <p className="text-[#62605d] text-sm">
                      L&apos;icône apparaîtra sur votre écran d&apos;accueil.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Android (Chrome) */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-[#34a853] text-white px-6 py-3 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Chrome className="h-5 w-5" />
                <div>
                  <h2 className="font-semibold">Android</h2>
                  <p className="text-sm opacity-90">Via Chrome</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#34a853] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      Ouvrez le menu Chrome
                    </p>
                    <p className="text-[#62605d] text-sm">
                      Trois points verticaux en haut à droite.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#34a853] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      &quot;Ajouter à l&apos;écran d&apos;accueil&quot;
                    </p>
                    <p className="text-[#62605d] text-sm">
                      Sélectionnez cette option dans le menu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#34a853] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      Confirmez l&apos;installation
                    </p>
                    <p className="text-[#62605d] text-sm">
                      Appuyez sur &quot;Ajouter&quot; dans la popup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-[#1a73e8] text-white px-6 py-3 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5" />
                <div>
                  <h2 className="font-semibold">Ordinateur</h2>
                  <p className="text-sm opacity-90">Chrome, Edge, Firefox</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#1a73e8] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">Ouvrez le menu</p>
                    <p className="text-[#62605d] text-sm">
                      Trois points verticaux en haut à droite du navigateur.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#1a73e8] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      &quot;Install page as app...&quot;
                    </p>
                    <p className="text-[#62605d] text-sm">
                      Ou &quot;Installer la page comme application&quot;.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#1a73e8] text-white rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="text-[#141313] font-medium">
                      Confirmez l&apos;installation
                    </p>
                    <p className="text-[#62605d] text-sm">
                      Cliquez sur &quot;Installer&quot; dans la popup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action simplifié */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-[#141313] mb-2">
            Une fois installée
          </h3>
          <p className="text-[#62605d] mb-4">
            Vous pourrez utiliser PlanniKeeper comme une vraie application
            native sur tous vos appareils.
          </p>
          <Link href="/dashboard">
            <Button className="bg-[#d9840d] hover:bg-[#c6780c] text-white">
              Retourner au dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
