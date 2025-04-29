// src/lib/auth-handlers.ts
import { sendWelcomeEmail } from "./email/resend";

interface User {
  email: string;
  name: string;
  // Add other relevant user properties if known
}

export const onUserSignUpSuccess = async ({
  user,
}: {
  user: User | null | undefined;
}) => {
  // Envoyer l'email de bienvenue
  if (user && user.email && user.name) {
    await sendWelcomeEmail({
      email: user.email,
      name: user.name,
    });
  }
};
