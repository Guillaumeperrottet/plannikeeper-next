// scripts/test-invitation-permissions.ts
import { prisma } from "../src/lib/prisma";

async function testInvitationPermissions() {
  try {
    console.log("=== Test des permissions d'invitation ===");

    // 1. Vérifier qu'il y a des objets dans l'organisation
    const objects = await prisma.objet.findMany({
      take: 5,
      select: {
        id: true,
        nom: true,
        organizationId: true,
      },
    });

    console.log(`Objets trouvés: ${objects.length}`);
    objects.forEach((obj, i) => {
      console.log(`  ${i + 1}. ${obj.nom} (${obj.id})`);
    });

    if (objects.length === 0) {
      console.log(
        "❌ Aucun objet trouvé. Créez d'abord des objets dans votre organisation."
      );
      return;
    }

    // 2. Créer une invitation de test avec permissions personnalisées
    const testObjectPermissions = {
      [objects[0].id]: "admin",
      [objects[1]?.id]: "write",
      [objects[2]?.id]: "read",
    };

    console.log("\n=== Test de création d'invitation avec permissions ===");
    console.log("Permissions à tester:", testObjectPermissions);

    // Simuler la création d'une invitation (utilise la logique similaire à l'API)
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Test avec un admin existant
    const adminUser = await prisma.organizationUser.findFirst({
      where: { role: "admin" },
      include: { user: true },
    });

    if (!adminUser) {
      console.log("❌ Aucun admin trouvé pour créer l'invitation de test");
      return;
    }

    console.log(`Admin trouvé: ${adminUser.user.email}`);

    // Créer l'invitation de test
    const testInvitation = await prisma.invitationCode.create({
      data: {
        code,
        role: "member",
        organizationId: adminUser.organizationId,
        createdBy: adminUser.userId,
        expiresAt,
        objectPermissions: testObjectPermissions,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    console.log("✅ Invitation créée:", {
      id: testInvitation.id,
      code: testInvitation.code,
      role: testInvitation.role,
    });

    // 3. Vérifier que l'invitation a été créée avec les bonnes permissions
    const retrievedInvitation = await prisma.invitationCode.findUnique({
      where: { id: testInvitation.id },
    });

    console.log("\n=== Vérification de l'invitation créée ===");
    console.log(
      "Permissions stockées:",
      (retrievedInvitation as any)?.objectPermissions
    ); // eslint-disable-line @typescript-eslint/no-explicit-any

    // 4. Nettoyer l'invitation de test
    await prisma.invitationCode.delete({
      where: { id: testInvitation.id },
    });

    console.log("✅ Invitation de test supprimée");

    console.log("\n🎉 Test terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvitationPermissions();
