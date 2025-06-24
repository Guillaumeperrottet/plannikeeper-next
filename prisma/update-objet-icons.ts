/**
 * Script pour mettre à jour les objets existants avec des icônes par défaut
 * basées sur leur secteur d'activité
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping des secteurs vers des icônes appropriées
const SECTOR_TO_ICON_MAPPING: Record<string, string> = {
  // Hôtellerie et hébergement
  hôtellerie: "bed",
  hotellerie: "bed",
  hotel: "bed",
  hôtel: "bed",
  auberge: "bed",
  gîte: "home",
  chambre: "bed",

  // Camping et nature
  camping: "tent",
  camp: "tent",
  caravane: "tent",
  "mobile home": "tent",
  nature: "tree-pine",

  // Restaurant et alimentation
  restaurant: "utensils",
  café: "utensils",
  bar: "utensils",
  brasserie: "utensils",
  cuisine: "utensils",
  alimentation: "utensils",

  // Commerce
  commerce: "store",
  magasin: "store",
  boutique: "store",
  shop: "store",
  vente: "store",

  // Résidentiel
  résidentiel: "home",
  maison: "home",
  appartement: "home",
  logement: "home",
  habitation: "home",

  // Transport et automobile
  automobile: "car",
  garage: "car",
  parking: "car",
  transport: "car",

  // Activités aquatiques
  piscine: "waves",
  spa: "waves",
  aquatique: "waves",
  nautique: "waves",

  // Entrepôt et stockage
  entrepôt: "warehouse",
  stockage: "warehouse",
  logistique: "warehouse",
  dépôt: "warehouse",

  // Éducation
  éducation: "school",
  école: "school",
  formation: "school",
  université: "school",

  // Santé
  santé: "hospital",
  médical: "hospital",
  clinique: "hospital",
  hôpital: "hospital",

  // Immobilier et bureaux
  immobilier: "building",
  bureau: "building",
  entreprise: "building",
  commercial: "building",
};

function getIconFromSecteur(secteur: string): string {
  const secteurLower = secteur.toLowerCase().trim();

  // Recherche exacte d'abord
  if (SECTOR_TO_ICON_MAPPING[secteurLower]) {
    return SECTOR_TO_ICON_MAPPING[secteurLower];
  }

  // Recherche par mots-clés
  for (const [keyword, icon] of Object.entries(SECTOR_TO_ICON_MAPPING)) {
    if (secteurLower.includes(keyword)) {
      return icon;
    }
  }

  // Icône par défaut
  return "building";
}

async function updateExistingObjetsWithIcons() {
  try {
    console.log("🔄 Démarrage de la mise à jour des icônes...");

    // Récupérer tous les objets sans icône ou avec icône null
    const objets = await prisma.objet.findMany({
      where: {
        OR: [{ icon: null }, { icon: "" }],
      },
      select: {
        id: true,
        nom: true,
        secteur: true,
        icon: true,
      },
    });

    console.log(`📦 ${objets.length} objets trouvés sans icône`);

    if (objets.length === 0) {
      console.log("✅ Tous les objets ont déjà des icônes !");
      return;
    }

    let updatedCount = 0;

    for (const objet of objets) {
      const suggestedIcon = getIconFromSecteur(objet.secteur);

      await prisma.objet.update({
        where: { id: objet.id },
        data: { icon: suggestedIcon },
      });

      console.log(`✅ ${objet.nom} (${objet.secteur}) -> ${suggestedIcon}`);
      updatedCount++;
    }

    console.log(`🎉 Mise à jour terminée ! ${updatedCount} objets mis à jour.`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  updateExistingObjetsWithIcons()
    .then(() => {
      console.log("🏁 Script terminé avec succès");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

export { updateExistingObjetsWithIcons, getIconFromSecteur };
