import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";

export default async function DashboardPage() {
  const session = await getUser();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenue, {session.email} !</p>
    </div>
  );
}
