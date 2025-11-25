import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, company, subject, message } = body;

    // Validation des champs requis
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Création du contenu HTML de l'email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              padding: 30px;
            }
            .header {
              background-color: #d9840d;
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              margin: -30px -30px 20px -30px;
            }
            h1 {
              margin: 0;
              font-size: 24px;
            }
            .field {
              margin-bottom: 15px;
            }
            .field-label {
              font-weight: 600;
              color: #4b5563;
              margin-bottom: 5px;
            }
            .field-value {
              color: #1f2937;
              padding: 10px;
              background-color: #f9fafb;
              border-radius: 4px;
            }
            .message-content {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 4px;
              border-left: 4px solid #d9840d;
              white-space: pre-wrap;
              margin-top: 10px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Nouveau message de contact</h1>
            </div>
            
            <div class="field">
              <div class="field-label">De:</div>
              <div class="field-value">${firstName} ${lastName}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value"><a href="mailto:${email}">${email}</a></div>
            </div>
            
            ${
              company
                ? `
            <div class="field">
              <div class="field-label">Entreprise:</div>
              <div class="field-value">${company}</div>
            </div>
            `
                : ""
            }
            
            <div class="field">
              <div class="field-label">Sujet:</div>
              <div class="field-value">${subject}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="message-content">${message}</div>
            </div>
            
            <div class="footer">
              Message reçu via le formulaire de contact de Plannikeeper<br>
              Date: ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Zurich" })}
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoi de l'email via Resend
    const data = await resend.emails.send({
      from: "Plannikeeper <contact@plannikeeper.ch>",
      to: ["gp@webbing.ch"],
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: htmlContent,
    });

    console.log("✅ Email de contact envoyé:", data);

    return NextResponse.json(
      { success: true, message: "Message envoyé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email de contact:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
