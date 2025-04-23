import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import DeleteObjetButton from "./DeleteObjetButton";

export default async function EditObjetPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Récupérer l'objet à éditer
  const objet = await prisma.objet.findUnique({
    where: { id: params.id },
  });

  if (!objet) {
    redirect("/dashboard");
  }

  // Vérifier que l'utilisateur a accès à cet objet (même organisation)
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== objet.organizationId
  ) {
    redirect("/dashboard");
  }

  async function handleUpdateObjet(formData: FormData) {
    "use server";

    const nom = formData.get("nom") as string;
    const adresse = formData.get("adresse") as string;
    const secteur = formData.get("secteur") as string;

    if (!session) {
      redirect("/signin");
    }

    await prisma.objet.update({
      where: { id: params.id },
      data: {
        nom,
        adresse,
        secteur,
      },
    });

    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Modifier l&apo;objet</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form action={handleUpdateObjet} className="space-y-6">
          <div>
            <label
              htmlFor="nom"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              defaultValue={objet.nom}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="adresse"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Adresse
            </label>
            <input
              type="text"
              id="adresse"
              name="adresse"
              defaultValue={objet.adresse}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="secteur"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Secteur
            </label>
            <input
              type="text"
              id="secteur"
              name="secteur"
              defaultValue={objet.secteur}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <DeleteObjetButton objetId={params.id} objetNom={objet.nom} />

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </Link>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={18} />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
