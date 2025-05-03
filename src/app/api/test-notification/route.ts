// src/app/api/test-notification/route.ts
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { sendNotificationToUser } from "@/lib/firebase-admin";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Envoyer une notification de test
    await sendNotificationToUser(
      user.id,
      "Notification de test",
      "Ceci est un message de test pour vérifier le système de notification",
      {
        link: "/dashboard",
        category: "TEST",
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
