"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, CheckSquare, Building2 } from "lucide-react";
import ObjetCard from "@/app/components/ObjetCard";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { MyTasksClient } from "./taskhub/MyTasksClient";

interface Objet {
  id: string;
  nom: string;
  adresse: string;
  pays: string;
  secteur: string;
  icon?: string | null;
}

interface DashboardTabsProps {
  initialObjets: Objet[];
  userId: string;
  userName: string;
}

type TabType = "tasks" | "objects";

export default function DashboardTabs({
  initialObjets,
  userId,
  userName,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("tasks");

  return (
    <div className="max-w-7xl mx-auto">
      {/* Barre d'onglets */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 md:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "tasks"
                  ? "text-[#d9840c]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckSquare size={18} />
              <span>Mes Tâches</span>
              {activeTab === "tasks" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d9840c]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("objects")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "objects"
                  ? "text-[#d9840c]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 size={18} />
              <span>Mes Objets</span>
              {activeTab === "objects" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d9840c]" />
              )}
            </button>
          </div>

          {/* Bouton Nouvel objet (visible seulement sur onglet Objets) */}
          {activeTab === "objects" && (
            <Button asChild size="sm" className="hidden md:flex">
              <Link href="/dashboard/objet/new">
                <PlusCircle size={18} className="mr-2" />
                Nouvel objet
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="p-0">
        {activeTab === "tasks" ? (
          <MyTasksClient userId={userId} userName={userName} />
        ) : (
          <div className="p-4 md:p-6">
            {/* En-tête Mes Objets */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Mes Objets</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérez tous vos biens immobiliers
                </p>
              </div>
              <Button asChild className="md:hidden">
                <Link href="/dashboard/objet/new">
                  <PlusCircle size={18} className="mr-2" />
                  Nouvel objet
                </Link>
              </Button>
            </div>

            {/* Liste des objets */}
            {initialObjets.length === 0 ? (
              <Card className="text-center py-12">
                <CardHeader>
                  <CardTitle className="text-xl text-muted-foreground">
                    Aucun objet trouvé
                  </CardTitle>
                  <CardDescription>
                    Commencez par créer votre premier objet pour le voir
                    apparaître ici.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/dashboard/objet/new">
                      <PlusCircle size={18} className="mr-2" />
                      Créer un objet
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {initialObjets.map((objet) => (
                  <ObjetCard key={objet.id} objet={objet} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
