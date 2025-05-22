import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { EmailService } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    console.log("📧 Demande de renvoi d'email de vérification pour:", email);

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json({
        success: true,
        message:
          "Si un compte existe avec cette adresse, un email de vérification a été envoyé.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Cet email est déjà vérifié" },
        { status: 400 }
      );
    }

    // Générer un nouveau token de vérification
    const ctx = await auth.$context;

    // Créer un nouveau token de vérification
    const verificationToken = await ctx.internalAdapter.createVerificationValue(
      {
        identifier: email,
        value: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 heures
      }
    );

    // Construire l'URL de vérification
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_APP_URL ||
          "https://plannikeeper-next.vercel.app";

    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken.value}&identifier=${encodeURIComponent(email)}`;

    console.log("🔗 URL de vérification générée:", verificationUrl);

    // Envoyer l'email de vérification
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Vérifiez votre adresse email</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #d9840d; color: white; padding: 24px; text-align: center; }
            .content { padding: 32px 24px; }
            .button { display: inline-block; background-color: #d9840d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 PlanniKeeper</h1>
              <h2>Vérification de votre adresse email</h2>
            </div>
            
            <div class="content">
              <p>Bonjour,</p>
              <p>Merci de vous être inscrit(e) sur PlanniKeeper. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email :</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">
                  Vérifier mon email
                </a>
              </div>
              
              <p>Ou copiez-collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${verificationUrl}
              </p>
              
              <p>Ce lien expire dans 24 heures.</p>
              <p>Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.</p>
            </div>
            
            <div class="footer">
              <p>© 2025 PlanniKeeper. Tous droits réservés.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await EmailService.sendEmail({
      to: email,
      subject: "Vérifiez votre adresse email - PlanniKeeper",
      html: htmlContent,
    });

    if (!result.success) {
      console.error("❌ Erreur lors de l'envoi:", result.error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    console.log("✅ Email de vérification renvoyé avec succès");

    return NextResponse.json({
      success: true,
      message: "Email de vérification envoyé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors du renvoi d'email:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 }
    );
  }
}
