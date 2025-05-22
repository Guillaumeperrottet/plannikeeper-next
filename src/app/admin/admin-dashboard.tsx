"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { UsersManagement } from "@/app/admin/users-management";
import { SubscriptionsManagement } from "@/app/admin/subscriptions-management";
import { OrganizationsManagement } from "@/app/admin/organizations-management";
import { SystemSettings } from "@/app/admin/system-settings";
import { SubscriptionLimitsManagement } from "@/app/admin/subscription-limits-management";
import { CompleteUserCreation } from "@/app/admin/complete-user-creation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  ArrowLeft,
  Settings,
  Users,
  Building,
  CreditCard,
  BarChart3,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  activeSubscriptions: number;
  systemHealth: "good" | "warning" | "critical";
}

export function AdminDashboard({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock stats - vous devriez les récupérer via une API
  const stats: AdminStats = {
    totalUsers: 156,
    totalOrganizations: 89,
    activeSubscriptions: 45,
    systemHealth: "good",
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "good":
        return <TrendingUp className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administration Système</h1>
          <p className="text-[color:var(--muted-foreground)]">
            Accès administrateur complet pour {user.email}
          </p>
        </div>
        <div className="flex gap-3">
          <CompleteUserCreation />
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Vue d&apos;ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="flex items-center gap-2"
          >
            <Building className="h-4 w-4" />
            <span>Organisations</span>
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Abonnements</span>
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Limites</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Utilisateurs
                  </p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Organisations
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.totalOrganizations}
                  </p>
                </div>
                <Building className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Abonnements actifs
                  </p>
                  <p className="text-3xl font-bold">
                    {stats.activeSubscriptions}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    État système
                  </p>
                  <div
                    className={`flex items-center gap-2 ${getHealthColor(stats.systemHealth)}`}
                  >
                    {getHealthIcon(stats.systemHealth)}
                    <span className="text-sm font-medium capitalize">
                      {stats.systemHealth}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("users")}
                className="h-auto p-4 flex flex-col items-start"
              >
                <Users className="h-6 w-6 mb-2 text-blue-500" />
                <span className="font-medium">Gérer les utilisateurs</span>
                <span className="text-sm text-muted-foreground">
                  Voir, modifier et supprimer des utilisateurs
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setActiveTab("limits")}
                className="h-auto p-4 flex flex-col items-start"
              >
                <BarChart3 className="h-6 w-6 mb-2 text-purple-500" />
                <span className="font-medium">Ajuster les limites</span>
                <span className="text-sm text-muted-foreground">
                  Modifier les quotas d&apos;abonnement
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setActiveTab("settings")}
                className="h-auto p-4 flex flex-col items-start"
              >
                <Settings className="h-6 w-6 mb-2 text-gray-500" />
                <span className="font-medium">Configuration système</span>
                <span className="text-sm text-muted-foreground">
                  Variables d&apos;environnement et APIs
                </span>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersManagement hideCreateButton />
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationsManagement hideCreateButton />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsManagement hideCreateButton />
        </TabsContent>

        <TabsContent value="limits" className="mt-6">
          <SubscriptionLimitsManagement />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
