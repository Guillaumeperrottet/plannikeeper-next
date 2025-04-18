import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Champs manquants" }, { status: 400 });
    }

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email déjà utilisé" }, { status: 400 });
    }

    // Hash du mot de passe
    const hashedPassword = await hash(password, 10);

    // Crée une entreprise personnelle pour l'utilisateur
    const entreprise = await prisma.entreprise.create({
      data: {
        name: `${name} (perso)`,
        address: "",
        isPersonal: true,
      },
    });

    // Crée l'utilisateur lié à cette entreprise
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        entrepriseId: entreprise.id,
        isPersonal: true,
        role: "personal",
      },
    });

    return NextResponse.json({ message: "Inscription réussie" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
