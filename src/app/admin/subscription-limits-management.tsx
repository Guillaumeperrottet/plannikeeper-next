// src/app/admin/subscription-limits-management.tsx - Version améliorée
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Search,
  RefreshCw,
  Users,
  Building,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Settings,
  Layers,
  FileText,
  ListTodo,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PLAN_DETAILS } from "@/lib/stripe-client"; // Import sécurisé

interface OrganizationLimits {
  id: string;
  name: string;
  planName: string;
  status: string;
  users: LimitInfo;
  objects: LimitInfo;
  storage: LimitInfo;
  sectors: LimitInfo;
  articles: LimitInfo;
  tasks: LimitInfo;
  subscriptionId?: string;
  createdAt: string;
  createdBy?: string;
}

interface LimitInfo {
  current: number;
  limit: number | null;
  unlimited: boolean;
  percentage?: number;
}

interface CustomLimits {
  maxUsers: number | null;
  maxObjects: number | null;
  maxStorage: number | null;
  maxSectors: number | null;
  maxArticles: number | null;
  maxTasks: number | null;
}

export function SubscriptionLimitsManagement() {
  const [organizations, setOrganizations] = useState<OrganizationLimits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrganizationLimits | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [customLimits, setCustomLimits] = useState<CustomLimits>({
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
  });

  useEffect(() => {
    fetchOrganizationsLimits();
  }, []);

  const fetchOrganizationsLimits = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/subscription-limits");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des limites");
      }
      const data = await response.json();
      setOrganizations(data.organizations);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les limites d'abonnements");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter((org) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.planName.toLowerCase().includes(searchLower) ||
      org.status.toLowerCase().includes(searchLower) ||
      (org.createdBy && org.createdBy.toLowerCase().includes(searchLower))
    );
  });

  const handleEditLimits = (org: OrganizationLimits) => {
    setSelectedOrg(org);
    setCustomLimits({
      maxUsers: org.users.limit,
      maxObjects: org.objects.limit,
      maxStorage: org.storage.limit,
      maxSectors: org.sectors.limit,
      maxArticles: org.articles.limit,
      maxTasks: org.tasks.limit,
    });
    setIsEditing(true);
  };

  const handleSaveLimits = async () => {
    if (!selectedOrg) return;

    try {
      const response = await fetch(
        `/api/admin/subscription-limits/${selectedOrg.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customLimits,
            organizationId: selectedOrg.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des limites");
      }

      await fetchOrganizationsLimits();
      setIsEditing(false);
      setSelectedOrg(null);
      toast.success("Limites mises à jour avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour des limites");
    }
  };

  const quickAdjust = async (
    orgId: string,
    type: string,
    adjustment?: number,
    setValue?: number
  ) => {
    try {
      const response = await fetch(
        `/api/admin/subscription-limits/${orgId}/quick-adjust`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            adjustment,
            setValue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajustement");
      }

      await fetchOrganizationsLimits();
      const action =
        setValue !== undefined
          ? `définie à ${setValue}`
          : `ajustée de ${adjustment}`;
      toast.success(`Limite ${type} ${action}`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'ajustement des limites");
    }
  };

  const changePlan = async (orgId: string, newPlanName: string) => {
    try {
      const response = await fetch(`/api/admin/subscription-limits/${orgId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planChange: {
            newPlanName,
            status: "ACTIVE",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors du changement de plan");
      }

      await fetchOrganizationsLimits();
      toast.success(`Plan changé vers ${newPlanName}`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du changement de plan");
    }
  };

  const getStatusColor = (
    current: number,
    limit: number | null,
    unlimited: boolean
  ) => {
    if (unlimited) return "text-green-600";
    if (!limit) return "text-gray-500";
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-500";
    return "text-green-600";
  };

  const getStatusIcon = (
    current: number,
    limit: number | null,
    unlimited: boolean
  ) => {
    if (unlimited) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (!limit) return <XCircle className="h-4 w-4 text-gray-500" />;
    const percentage = (current / limit) * 100;
    if (percentage >= 90)
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (percentage >= 75)
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const formatStorage = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB} MB`;
  };

  const LimitCell = ({
    org,
    limitInfo,
    type,
    icon: Icon,
    color,
    formatValue = (v: number) => v.toString(),
  }: {
    org: OrganizationLimits;
    limitInfo: LimitInfo;
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    formatValue?: (value: number) => string;
  }) => (
    <TableCell>
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span
          className={getStatusColor(
            limitInfo.current,
            limitInfo.limit,
            limitInfo.unlimited
          )}
        >
          {formatValue(limitInfo.current)}/
          {limitInfo.unlimited
            ? "∞"
            : limitInfo.limit
              ? formatValue(limitInfo.limit)
              : "0"}
        </span>
        {getStatusIcon(limitInfo.current, limitInfo.limit, limitInfo.unlimited)}
      </div>
      <div className="flex space-x-1 mt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => quickAdjust(org.id, type, -1)}
          className="h-6 w-6 p-0"
          disabled={limitInfo.unlimited}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => quickAdjust(org.id, type, 1)}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </TableCell>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Limites d&apos;Abonnements</CardTitle>
          <CardDescription>
            Surveillez et ajustez les limites pour chaque organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une organisation..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchOrganizationsLimits}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Créateur</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Objets</TableHead>
                    <TableHead>Secteurs</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Tâches</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Aucune organisation trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{org.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(org.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                              {org.planName}
                            </span>
                            <select
                              className="w-32 text-xs border rounded p-1"
                              value={org.planName}
                              onChange={(e) =>
                                changePlan(org.id, e.target.value)
                              }
                            >
                              {Object.keys(PLAN_DETAILS).map((planId) => (
                                <option key={planId} value={planId}>
                                  {
                                    PLAN_DETAILS[
                                      planId as keyof typeof PLAN_DETAILS
                                    ].name
                                  }
                                </option>
                              ))}
                            </select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {org.createdBy || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <LimitCell
                          org={org}
                          limitInfo={org.users}
                          type="users"
                          icon={Users}
                          color="text-blue-500"
                        />
                        <LimitCell
                          org={org}
                          limitInfo={org.objects}
                          type="objects"
                          icon={Building}
                          color="text-amber-500"
                        />
                        <LimitCell
                          org={org}
                          limitInfo={org.sectors}
                          type="sectors"
                          icon={Layers}
                          color="text-purple-500"
                        />
                        <LimitCell
                          org={org}
                          limitInfo={org.articles}
                          type="articles"
                          icon={FileText}
                          color="text-indigo-500"
                        />
                        <LimitCell
                          org={org}
                          limitInfo={org.tasks}
                          type="tasks"
                          icon={ListTodo}
                          color="text-emerald-500"
                        />
                        <LimitCell
                          org={org}
                          limitInfo={org.storage}
                          type="storage"
                          icon={HardDrive}
                          color="text-rose-500"
                          formatValue={formatStorage}
                        />
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLimits(org)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition des limites - Version améliorée */}
      {isEditing && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Modifier les limites de {selectedOrg.name}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  key: "maxUsers",
                  label: "Utilisateurs",
                  current: selectedOrg.users.current,
                },
                {
                  key: "maxObjects",
                  label: "Objets",
                  current: selectedOrg.objects.current,
                },
                {
                  key: "maxSectors",
                  label: "Secteurs",
                  current: selectedOrg.sectors.current,
                },
                {
                  key: "maxArticles",
                  label: "Articles",
                  current: selectedOrg.articles.current,
                },
                {
                  key: "maxTasks",
                  label: "Tâches",
                  current: selectedOrg.tasks.current,
                },
                {
                  key: "maxStorage",
                  label: "Stockage (MB)",
                  current: selectedOrg.storage.current,
                },
              ].map(({ key, label, current }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">
                    Limite de {label.toLowerCase()}
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={customLimits[key as keyof CustomLimits] || ""}
                      onChange={(e) =>
                        setCustomLimits({
                          ...customLimits,
                          [key]: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Illimité si vide"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Actuel:{" "}
                      {key === "maxStorage" ? formatStorage(current) : current}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-3 rounded-md mt-4">
              <div className="text-sm text-blue-800">
                <strong>Plan actuel:</strong> {selectedOrg.planName}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Les limites personnalisées remplaceront celles du plan
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedOrg(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveLimits}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
