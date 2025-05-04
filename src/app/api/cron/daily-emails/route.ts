// src/app/api/cron/daily-emails/route.ts
import { NextResponse } from "next/server";

// Configuration du Cron: tous les jours à 6h du matin
export const config = {
  runtime: "edge",
  schedule: "0 6 * * *",
};

export async function GET() {
  try {
    // Appeler l'API d'envoi d'emails
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/emails/daily-tasks`,
      {
        method: "POST",
        headers: {
          "x-api-secret": process.env.EMAIL_API_SECRET || "",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur dans le job planifié:", error);
    return NextResponse.json(
      { error: "Erreur dans le job planifié" },
      { status: 500 }
    );
  }
}
