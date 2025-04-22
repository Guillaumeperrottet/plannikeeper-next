import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/signin");

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500">
            {user.name?.[0] ?? "?"}
          </div>
        </div>
        {/* Infos utilisateur */}
        <div className="flex-1 w-full">
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">Nom</label>
            <input
              type="text"
              value={user.name ?? ""}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">Email</label>
            <input
              type="email"
              value={user.email ?? ""}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
          {/* Ajoute ici d'autres champs à éditer si besoin */}
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Modifier mon profil
          </button>
        </div>
      </div>
    </div>
  );
}
