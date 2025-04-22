import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getUser();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenue, {session.email} !</p>
      <Link
      href="/dashboard/objet/new"
      className="mt-8 inline-block bg-blue-600 text-white px-4 py-2 rounded"
    >
      Créer un objet
    </Link>
    </div>
  );
}
