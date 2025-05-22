// src/app/admin/subscription-limits-management.tsx
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
  Edit,
  Search,
  RefreshCw,
  Users,
  Building,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface OrganizationLimits {
  id: string;
  name: string;
  planName: string;
  status: string;
  users: {
    current: number;
    limit: number | null;
    unlimited: boolean;
  };
  objects: {
    current: number;
    limit: number | null;
    unlimited: boolean;
  };
  storage: {
    current: number; // en MB
    limit: number | null; // en MB
    unlimited: boolean;
  };
  subscriptionId?: string;
  createdAt: string;
}

interface CustomLimits {
  maxUsers: number | null;
  maxObjects: number | null;
  maxStorage: number | null; // en MB
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
  });

  // Charger les organisations avec leurs limites
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

  // Filtrer les organisations
  const filteredOrganizations = organizations.filter((org) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.planName.toLowerCase().includes(searchLower) ||
      org.status.toLowerCase().includes(searchLower)
    );
  });

  // Fonction pour éditer les limites d'une organisation
  const handleEditLimits = (org: OrganizationLimits) => {
    setSelectedOrg(org);
    setCustomLimits({
      maxUsers: org.users.limit,
      maxObjects: org.objects.limit,
      maxStorage: org.storage.limit,
    });
    setIsEditing(true);
  };

  // Fonction pour sauvegarder les nouvelles limites
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

      // Recharger les données
      await fetchOrganizationsLimits();
      setIsEditing(false);
      setSelectedOrg(null);
      toast.success("Limites mises à jour avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour des limites");
    }
  };

  // Fonction pour augmenter rapidement une limite
  const quickIncrease = async (
    orgId: string,
    type: "users" | "objects" | "storage",
    amount: number
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
            adjustment: amount,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajustement");
      }

      await fetchOrganizationsLimits();
      toast.success(`Limite ${type} augmentée de ${amount}`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'ajustement des limites");
    }
  };

  // Fonction pour obtenir la couleur du statut
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

  // Fonction pour obtenir l'icône de statut
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

  // Formater la taille de stockage
  const formatStorage = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB} MB`;
  };

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
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Objets</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
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
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                            {org.planName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span
                              className={getStatusColor(
                                org.users.current,
                                org.users.limit,
                                org.users.unlimited
                              )}
                            >
                              {org.users.current}/
                              {org.users.unlimited ? "∞" : org.users.limit}
                            </span>
                            {getStatusIcon(
                              org.users.current,
                              org.users.limit,
                              org.users.unlimited
                            )}
                          </div>
                          <div className="flex space-x-1 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => quickIncrease(org.id, "users", 5)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-amber-500" />
                            <span
                              className={getStatusColor(
                                org.objects.current,
                                org.objects.limit,
                                org.objects.unlimited
                              )}
                            >
                              {org.objects.current}/
                              {org.objects.unlimited ? "∞" : org.objects.limit}
                            </span>
                            {getStatusIcon(
                              org.objects.current,
                              org.objects.limit,
                              org.objects.unlimited
                            )}
                          </div>
                          <div className="flex space-x-1 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                quickIncrease(org.id, "objects", 5)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-4 w-4 text-purple-500" />
                            <span
                              className={getStatusColor(
                                org.storage.current,
                                org.storage.limit,
                                org.storage.unlimited
                              )}
                            >
                              {formatStorage(org.storage.current)}/
                              {org.storage.unlimited
                                ? "∞"
                                : formatStorage(org.storage.limit || 0)}
                            </span>
                            {getStatusIcon(
                              org.storage.current,
                              org.storage.limit,
                              org.storage.unlimited
                            )}
                          </div>
                          <div className="flex space-x-1 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                quickIncrease(org.id, "storage", 1024)
                              } // +1GB
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              org.status === "ACTIVE"
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {org.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLimits(org)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Modal d'édition des limites */}
      {isEditing && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Modifier les limites de {selectedOrg.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Limite d&apos;utilisateurs
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={customLimits.maxUsers || ""}
                    onChange={(e) =>
                      setCustomLimits({
                        ...customLimits,
                        maxUsers: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Illimité si vide"
                  />
                  <span className="text-sm text-muted-foreground">
                    Actuel: {selectedOrg.users.current}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Limite d&apos;objets
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={customLimits.maxObjects || ""}
                    onChange={(e) =>
                      setCustomLimits({
                        ...customLimits,
                        maxObjects: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Illimité si vide"
                  />
                  <span className="text-sm text-muted-foreground">
                    Actuel: {selectedOrg.objects.current}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Limite de stockage (MB)
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={customLimits.maxStorage || ""}
                    onChange={(e) =>
                      setCustomLimits({
                        ...customLimits,
                        maxStorage: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Illimité si vide"
                  />
                  <span className="text-sm text-muted-foreground">
                    Actuel: {formatStorage(selectedOrg.storage.current)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Raccourcis: 1GB = 1024MB, 5GB = 5120MB, 10GB = 10240MB
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>Plan actuel:</strong> {selectedOrg.planName}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Les limites personnalisées remplaceront celles du plan
                </div>
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
