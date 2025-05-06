// src/app/components/UsageLimits.tsx
"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Users, Building2 } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import Link from "next/link";

interface UsageLimitData {
  allowed: boolean;
  current: number;
  limit: number | null;
  unlimited: boolean;
}

export default function UsageLimits() {
  const [limits, setLimits] = useState<{
    users: UsageLimitData | null;
    objects: UsageLimitData | null;
  }>({
    users: null,
    objects: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const usersResponse = await fetch("/api/limits/users");
        const objectsResponse = await fetch("/api/limits/objects");

        if (!usersResponse.ok || !objectsResponse.ok) {
          throw new Error("Erreur lors de la récupération des limites");
        }

        const usersData = await usersResponse.json();
        const objectsData = await objectsResponse.json();

        setLimits({
          users: usersData,
          objects: objectsData,
        });
      } catch (error) {
        console.error("Erreur:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Erreur lors de la récupération des limites"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg animate-pulse bg-gray-50">
        <div className="h-6 w-2/3 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-700">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </p>
      </div>
    );
  }

  const renderLimitStatus = (type: "users" | "objects") => {
    const data = limits[type];

    if (!data) return null;

    const percentUsed = data.unlimited
      ? 0
      : Math.round((data.current / (data.limit || 1)) * 100);
    const isNearLimit = percentUsed >= 80;
    const isAtLimit = percentUsed >= 100;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {type === "users" ? (
              <Users className="h-5 w-5 mr-2 text-blue-500" />
            ) : (
              <Building2 className="h-5 w-5 mr-2 text-green-500" />
            )}
            <span className="font-medium">
              {type === "users" ? "Utilisateurs" : "Objets"}
            </span>
          </div>
          <div className="text-sm">
            {data.unlimited ? (
              <span className="text-green-500">Illimité</span>
            ) : (
              <span
                className={
                  isAtLimit
                    ? "text-red-500"
                    : isNearLimit
                      ? "text-amber-500"
                      : "text-gray-600"
                }
              >
                {data.current} / {data.limit}
              </span>
            )}
          </div>
        </div>

        {!data.unlimited && (
          <Progress
            value={percentUsed > 100 ? 100 : percentUsed}
            className={`h-2 ${isAtLimit ? "bg-red-200" : isNearLimit ? "bg-amber-200" : "bg-gray-200"}`}
            style={
              {
                "--progress-indicator-color": isAtLimit
                  ? "var(--red-500, #ef4444)"
                  : isNearLimit
                    ? "var(--amber-500, #f59e0b)"
                    : "var(--blue-500, #3b82f6)",
              } as React.CSSProperties
            }
          />
        )}

        {(isAtLimit || isNearLimit) && !data.unlimited && (
          <div
            className={`text-xs mt-1 ${isAtLimit ? "text-red-500" : "text-amber-500"}`}
          >
            {isAtLimit
              ? `Limite ${type === "users" ? "d'utilisateurs" : "d'objets"} atteinte.`
              : `Vous approchez de votre limite ${type === "users" ? "d'utilisateurs" : "d'objets"}.`}{" "}
            <Link href="/pricing" className="underline">
              Passer à un forfait supérieur
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Utilisation</h3>

      {renderLimitStatus("users")}
      {renderLimitStatus("objects")}
    </div>
  );
}
