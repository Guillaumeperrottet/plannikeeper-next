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
      <body className="bg-background">
        {user && <Navbar user={user} />}
        <div className="pb-16 md:pb-14">{children}</div>
        {user && <TodoListAgendaWrapper />}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
