import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import { getUser } from "../lib/auth-session";
import "./globals.css";
import TodoListAgendaWrapper from "./components/TodoListAgendaWrapper";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="en">
      <body>
        <Navbar user={user} />
        <div className="pb-16 md:pb-14">
          {" "}
          {/* Ajouter un padding en bas pour éviter que le contenu soit caché par l'agenda */}
          {children}
        </div>
        {user && <TodoListAgendaWrapper />}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
