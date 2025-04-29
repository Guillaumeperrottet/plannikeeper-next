"use client";

import { FormEvent, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");
  const [isInvite, setIsInvite] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    if (inviteCode) {
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
        callbackURL: inviteCode ? `/join/${inviteCode}` : "/dashboard",
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
    <div
      className={cn(
        "max-w-md mx-auto my-10 p-6 bg-background rounded-lg shadow-md"
      )}
    >
      <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

      {isInvite && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700">
            Vous avez été invité à rejoindre <strong>{organizationName}</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Create a password (min. 8 characters)"
            minLength={8}
          />
        </div>
        <div>
          <Label htmlFor="image">Profile Image URL (optional)</Label>
          <Input
            id="image"
            name="image"
            type="url"
            placeholder="https://example.com/your-image.jpg"
          />
        </div>
        <Button type="submit" className="w-full">
          Sign Up
        </Button>
      </form>
    </div>
  );
}
