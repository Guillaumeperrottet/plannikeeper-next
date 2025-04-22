import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 dark:bg-black px-4">
      <main className="flex flex-col items-center gap-8">
        <Image
          src="/next.svg"
          alt="Logo"
          width={180}
          height={38}
          className="dark:invert"
          priority
        />
        <h1 className="text-3xl font-bold text-center mb-2">
          Bienvenue sur PlanniKeeper
        </h1>
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 max-w-xl">
          Gérez vos objets, tâches et équipes en toute simplicité.
        </p>
        <Link
          href="/signup"
          className="mt-4 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Créer un compte
        </Link>
      </main>
    </div>
  );
}
