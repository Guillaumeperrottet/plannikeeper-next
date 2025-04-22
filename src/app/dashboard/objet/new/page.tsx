import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export default async function NewObjetPage() {
  const session = await getUser();

  if (!session) {
    redirect("/sign-in");
  }

  async function handleCreateObjet(formData: FormData) {
    "use server";
    const nom = formData.get("nom") as string;
    const adresse = formData.get("adresse") as string;
    const secteur = formData.get("secteur") as string;

    const userDb = await prisma.user.findUnique({
      where: { id: session.id },
      include: { organization: true },
    });

    if (!userDb?.organization) {
      throw new Error("Aucune organisation trouvée");
    }

    await prisma.objet.create({
      data: {
        nom,
        adresse,
        secteur,
        organizationId: userDb.organization.id,
      },
    });

    redirect("/dashboard");
  }

  return (
    <div>
      <h1>Créer un objet</h1>
      <form action={handleCreateObjet} className="mt-8 space-y-4">
        <input name="nom" placeholder="Nom de l'objet" required className="border p-2 rounded w-full" />
        <input name="adresse" placeholder="Adresse" required className="border p-2 rounded w-full" />
        <input name="secteur" placeholder="Secteur" required className="border p-2 rounded w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Créer l objet</button>
      </form>
    </div>
  );
}
