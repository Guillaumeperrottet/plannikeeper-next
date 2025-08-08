"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Edit,
  Search,
  ShieldAlert,
  User as UserIcon,
  X,
  MoreHorizontal,
  ArrowUpDown,
  UserCog,
  Mail,
  Building,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  isCurrentUser: boolean;
  objectAccess: {
    id: string;
    accessLevel: string;
    object: {
      id: string;
      nom: string;
      icon: string | null;
    };
  }[];
}

// Helper pour obtenir une description lisible du niveau d'accès
const getAccessLevelDescription = (level: string) => {
  switch (level) {
    case "read":
      return "Lecture seule";
    case "write":
      return "Lecture et écriture";
    case "admin":
      return "Administration complète";
    default:
      return level;
  }
};

export function UsersTable({ users }: { users: User[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtre sur la recherche
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.objectAccess.some(
        (access) =>
          access.object.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getAccessLevelDescription(access.accessLevel)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
  );

  // Tri des utilisateurs
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "email") {
      comparison = a.email.localeCompare(b.email);
    } else if (sortBy === "role") {
      comparison = a.role.localeCompare(b.role);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Gestion du tri au clic sur un en-tête de colonne
  const toggleSort = (column: "name" | "email" | "role") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Barre de recherche moderne */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom, email, rôle ou accès aux objets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Table moderne avec Shadcn/UI */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Avatar</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("name")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Utilisateur
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("email")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("role")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Rôle
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <span className="font-medium">Accès aux objets</span>
                </TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchQuery
                          ? "Aucun utilisateur trouvé pour cette recherche"
                          : "Aucun utilisateur"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar || undefined}
                          alt={user.name}
                        />
                        <AvatarFallback className="bg-muted font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          {user.isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Vous
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge variant="default" className="gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          Administrateur
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <UserIcon className="h-3 w-3" />
                          Membre
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.objectAccess.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            Aucun accès
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.objectAccess.slice(0, 3).map((access) => (
                              <Tooltip key={access.id}>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="text-xs gap-1 max-w-24 truncate cursor-help"
                                  >
                                    <Building className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {access.object.nom}
                                    </span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">
                                    {access.object.nom}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Niveau:{" "}
                                    {getAccessLevelDescription(
                                      access.accessLevel
                                    )}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {user.objectAccess.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs cursor-help"
                                  >
                                    +{user.objectAccess.length - 3}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">
                                    Accès supplémentaires
                                  </p>
                                  <div className="text-sm text-muted-foreground max-w-48">
                                    {user.objectAccess
                                      .slice(3)
                                      .map((access) => (
                                        <div key={access.id}>
                                          {access.object.nom} (
                                          {getAccessLevelDescription(
                                            access.accessLevel
                                          )}
                                          )
                                        </div>
                                      ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ouvrir le menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/profile/edit/${user.id}`}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Modifier le profil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/profile/edit/${user.id}/permissions`}
                              className="flex items-center gap-2"
                            >
                              <UserCog className="h-4 w-4" />
                              Gérer les permissions
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards - Version modernisée */}
        <div className="md:hidden space-y-4">
          {sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Aucun utilisateur trouvé pour cette recherche"
                  : "Aucun utilisateur"}
              </p>
            </div>
          ) : (
            sortedUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={user.avatar || undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-muted font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{user.name}</h3>
                      {user.isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          Vous
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      {user.role === "admin" ? (
                        <Badge variant="default" className="gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <UserIcon className="h-3 w-3" />
                          Membre
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/profile/edit/${user.id}`}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/profile/edit/${user.id}/permissions`}
                              className="flex items-center gap-2"
                            >
                              <UserCog className="h-4 w-4" />
                              Permissions
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Accès aux objets pour mobile */}
                    <div className="mt-3 space-y-2 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Key className="h-3 w-3 text-muted-foreground" />
                        <span>Accès aux objets</span>
                      </div>
                      <div className="space-y-1">
                        {user.objectAccess.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            Aucun accès
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.objectAccess.slice(0, 4).map((access) => (
                              <Badge
                                key={access.id}
                                variant="outline"
                                className="text-xs gap-1"
                                title={`${access.object.nom} (${access.accessLevel})`}
                              >
                                <Building className="h-3 w-3" />
                                <span className="truncate max-w-20">
                                  {access.object.nom}
                                </span>
                              </Badge>
                            ))}
                            {user.objectAccess.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.objectAccess.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
