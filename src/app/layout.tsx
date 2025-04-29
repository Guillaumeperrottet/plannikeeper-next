import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import { getUser } from "../lib/auth-session";
import "./globals.css";
import TodoListAgendaWrapper from "./components/TodoListAgendaWrapper";
import { prisma } from "@/lib/prisma";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Récupérer des informations supplémentaires comme le rôle si l'utilisateur est connecté
  let userWithRole = user;

  if (user) {
    // Obtenir le rôle de l'utilisateur
    const orgUser = await prisma.organizationUser.findFirst({
      where: { userId: user.id },
      select: { role: true },
    });

    // Ajouter le rôle aux informations de l'utilisateur
    userWithRole = {
      ...user,
      isAdmin: orgUser?.role === "admin",
      role: orgUser?.role,
    } as typeof user & { isAdmin: boolean; role?: string };
  }

  return (
    <html lang="en">
      <body className="bg-background" suppressHydrationWarning>
        {userWithRole && <Navbar user={userWithRole} />}
        {/*<SidebarWrapper user={userWithRole}>*/}
        <div className="pb-16 md:pb-14">{children}</div>
        {/*}  </SidebarWrapper>*/}
        {user && <TodoListAgendaWrapper />}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

<script
  dangerouslySetInnerHTML={{
    __html: `
      (function() {
        try {
          var theme = localStorage.getItem('theme');
          if (
            theme === 'dark' ||
            (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
          ) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch(e){}
      })();
    `,
  }}
/>;
