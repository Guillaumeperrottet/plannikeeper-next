// src/lib/email/templates/welcome-template.tsx
import React from "react";
import {
  Html,
  Body,
  Container,
  Text,
  Hr,
  Head,
  Preview,
  Section,
  Button,
  Heading,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmailTemplate = ({ name }: WelcomeEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://plannikeeper.com";

  return (
    <Html>
      <Head />
      <Preview>
        Bienvenue sur Plannikeeper - Votre plateforme de gestion de projets
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenue sur Plannikeeper</Heading>

          <Section style={section}>
            <Text style={text}>Bonjour {name},</Text>
            <Text style={text}>
              Nous sommes ravis de vous accueillir sur Plannikeeper, votre
              nouvelle plateforme de gestion pour tous vos projets.
            </Text>

            <Text style={text}>Avec Plannikeeper, vous pouvez :</Text>

            <ul style={list}>
              <li style={listItem}>Créer et gérer des objets</li>
              <li style={listItem}>Organiser des secteurs avec des plans</li>
              <li style={listItem}>Suivre vos tâches et leur avancement</li>
              <li style={listItem}>Collaborer avec votre équipe</li>
            </ul>

            <Button style={button} href={baseUrl}>
              Accéder à mon espace
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            © {new Date().getFullYear()} Plannikeeper. Tous droits réservés.
          </Text>

          <Text style={footer}>
            Si vous n&apos;êtes pas à l&apos;origine de cette inscription,
            veuillez ignorer cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  padding: "40px 20px",
  margin: "0 auto",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
};

const section = {
  backgroundColor: "#ffffff",
  padding: "30px",
  borderRadius: "5px",
  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
};

const button = {
  backgroundColor: "#4F46E5",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  marginTop: "20px",
  marginBottom: "20px",
  padding: "12px 20px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  marginTop: "20px",
  textAlign: "center" as const,
};

const list = {
  paddingLeft: "20px",
};

const listItem = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "8px",
};
