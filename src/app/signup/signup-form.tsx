"use client";

import { FormEvent, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const [isInvite, setIsInvite] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  // Vérifier si nous avons un code d'invitation
  useEffect(() => {
    if (inviteCode) {
      // Vérifier que le code d'invitation est valide
      fetch(`/api/invitations/validate?code=${inviteCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsInvite(true);
            setOrganizationName(data.organizationName);
          }
        })
        .catch((err) => {
          console.error("Erreur de validation du code:", err);
        });
    }
  }, [inviteCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const image = (formData.get("image") as string) || undefined;

    const submitButton = event.currentTarget.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        image,
        // Si nous avons un code d'invitation, rediriger vers la page de join
        callbackURL: inviteCode ? `/join/${inviteCode}` : "/dashboard",
        // Passer le code d'invitation comme métadonnée pour le hook
        meta: inviteCode ? { inviteCode } : undefined,
      },
      {
        onRequest: () => {
          submitButton.disabled = true;
          submitButton.textContent = "Signing up...";
        },
        onSuccess: () => {
          window.location.href = inviteCode
            ? `/join/${inviteCode}`
            : "/dashboard";
        },
        onError: (ctx) => {
          alert(ctx.error.message);
          submitButton.disabled = false;
          submitButton.textContent = "Sign Up";
        },
      }
    );
  }

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

      {isInvite && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700">
            Vous avez été invité à rejoindre <strong>{organizationName}</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-gray-700 font-medium mb-2"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-gray-700 font-medium mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 font-medium mb-2"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Create a password (min. 8 characters)"
            minLength={8}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="image"
            className="block text-gray-700 font-medium mb-2"
          >
            Profile Image URL (optional)
          </label>
          <input
            id="image"
            name="image"
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/your-image.jpg"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
