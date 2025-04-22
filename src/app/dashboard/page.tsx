import { getServerSession } from "next-auth"; // ou ta méthode d'auth
import { prisma } from "@/lib/prisma"; // adapte selon ton import
import Link from "next/link";

export default async function DashboardPage() {
  // 1. Récupérer l'utilisateur courant
  const session = await getServerSession();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    // Gérer le cas où l'email n'est pas disponible (utilisateur non connecté ou session invalide)
    return <div>Veuillez vous connecter pour accéder au dashboard.</div>;
  }

  // 2. Trouver l'utilisateur et son entreprise
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { entreprise: true },
  });

  if (!user) return <div>Utilisateur non trouvé</div>;

  // 3. Lister les objets de l'entreprise
  const entrepriseObjets = await prisma.entrepriseObjet.findMany({
    where: { entrepriseId: user.entrepriseId },
    include: { objet: true },
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Mes objets</h2>
      <ul>
        {entrepriseObjets.map((eo) => (
          <li key={eo.objet.id}>{eo.objet.name} – {eo.objet.address}</li>
        ))}
      </ul>
      <Link href="/create-objet">
        <button>Créer un objet</button>
      </Link>
    </div>
  );
}
