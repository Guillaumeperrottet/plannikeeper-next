import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { MyTasksClient } from "./MyTasksClient";

export const metadata = {
  title: "Mes Tâches | Plannikeeper",
  description: "Vue d'ensemble de toutes vos tâches assignées",
};

export default async function TaskHubPage() {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Les données seront chargées côté client via l'API
  // pour permettre le rafraîchissement et les filtres dynamiques
  return <MyTasksClient userId={session.id} userName={session.name || ""} />;
}
