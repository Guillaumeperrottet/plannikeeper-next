import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: objetId } = await params;
    const body = await req.json();

    // Vérifier que l'objet existe et que l'utilisateur y a accès
    const objet = await prisma.objet.findUnique({
      where: { id: objetId },
      include: { organization: true },
    });

    if (!objet) {
      return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== objet.organizationId
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: {
      nom?: string;
      adresse?: string;
      pays?: string;
      secteur?: string;
      icon?: string;
    } = {};

    // Validation et mise à jour des champs autorisés
    if (body.nom !== undefined) {
      if (typeof body.nom !== "string" || !body.nom.trim()) {
        return NextResponse.json(
          { error: "Le nom est requis et doit être une chaîne non vide" },
          { status: 400 }
        );
      }
      updateData.nom = body.nom.trim();
    }

    if (body.adresse !== undefined) {
      if (typeof body.adresse !== "string" || !body.adresse.trim()) {
        return NextResponse.json(
          { error: "L'adresse est requise et doit être une chaîne non vide" },
          { status: 400 }
        );
      }
      updateData.adresse = body.adresse.trim();
    }

    if (body.pays !== undefined) {
      if (typeof body.pays !== "string" || !body.pays.trim()) {
        return NextResponse.json(
          { error: "Le pays est requis et doit être une chaîne non vide" },
          { status: 400 }
        );
      }
      updateData.pays = body.pays.trim();
    }

    if (body.secteur !== undefined) {
      if (typeof body.secteur !== "string" || !body.secteur.trim()) {
        return NextResponse.json(
          { error: "Le secteur est requis et doit être une chaîne non vide" },
          { status: 400 }
        );
      }
      updateData.secteur = body.secteur.trim();
    }

    if (body.icon !== undefined) {
      if (typeof body.icon !== "string" || !body.icon.trim()) {
        return NextResponse.json(
          { error: "L'icône doit être une chaîne non vide" },
          { status: 400 }
        );
      }

      // Valider que l'icône est dans la liste des icônes autorisées
      const validIcons = [
        "building",
        "tent",
        "bed",
        "home",
        "utensils",
        "store",
        "warehouse",
        "car",
        "waves",
        "tree-pine",
        "map-pin",
        "school",
        "hospital",
      ];

      if (!validIcons.includes(body.icon)) {
        return NextResponse.json(
          { error: "Icône non valide" },
          { status: 400 }
        );
      }

      updateData.icon = body.icon;
    }

    // Vérifier qu'au moins un champ a été fourni
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    // Mettre à jour l'objet
    const updatedObjet = await prisma.objet.update({
      where: { id: objetId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Objet mis à jour avec succès",
      objet: updatedObjet,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'objet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
