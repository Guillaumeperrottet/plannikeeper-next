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
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  ArrowLeft,
  Settings,
  Users,
  Building,
  CreditCard,
  BarChart3,
} from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

export function AdminDashboard({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administration Système</h1>
          <p className="text-[color:var(--muted-foreground)]">
            Accès administrateur complet pour {user.email}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au dashboard
          </Link>
        </Button>
      </div>

      <Tabs
        defaultValue="users"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 mb-8">
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

        <TabsContent value="users" className="mt-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationsManagement />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsManagement />
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
