# 🚀 Plan d'Optimisations Performance - PlanniKeeper

## Priorités d'Optimisation

### 🔴 HAUTE PRIORITÉ (Impact immédiat)

#### 1. Optimiser `/api/tasks/my-tasks/route.ts`

**Problème actuel** :

- Requêtes en cascade (3-4 requêtes avant les tâches)
- Over-fetching : tous les commentaires et documents chargés
- Pas de pagination

**Solution** :

```typescript
// ✅ OPTIMISÉ - Une seule requête avec include ciblé
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    // Une seule requête optimisée avec tous les includes
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        Organization: {
          select: { id: true },
        },
        OrganizationUser: {
          select: { role: true },
        },
        objectAccess: {
          select: { objectId: true },
        },
      },
    });

    if (!userData?.Organization) {
      return NextResponse.json({ error: "Sans organisation" }, { status: 400 });
    }

    const isAdmin = userData.OrganizationUser?.role === "admin";
    const accessibleObjectIds = isAdmin
      ? undefined // Admin = tous les objets
      : userData.objectAccess.map((a) => a.objectId);

    // Pagination + limite de données
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const tasks = await prisma.task.findMany({
      where: {
        archived: false,
        article: {
          sector: {
            object: {
              organizationId: userData.Organization.id,
              ...(accessibleObjectIds && { id: { in: accessibleObjectIds } }),
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        realizationDate: true,
        completedAt: true,
        createdAt: true,
        article: {
          select: {
            id: true,
            title: true,
            sector: {
              select: {
                id: true,
                name: true,
                image: true,
                object: {
                  select: {
                    id: true,
                    nom: true,
                    adresse: true,
                    icon: true,
                  },
                },
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        // ✅ Limiter les documents et commentaires
        _count: {
          select: {
            documents: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { realizationDate: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: skip,
    });

    // Total pour pagination
    const total = await prisma.task.count({
      where: {
        /* same where clause */
      },
    });

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
```

**Gains attendus** :

- ⚡ **50-70% plus rapide** sur requête initiale
- 📉 **80% moins de données** transférées
- ✅ Pagination = UX fluide même avec 1000+ tâches

---

#### 2. Optimiser `/dashboard/objets/page.tsx`

**Problème** : Deux requêtes identiques pour le même user

**Solution** :

```typescript
export default async function ObjetsPage() {
  const session = await getUser();
  if (!session) redirect("/signin");

  // ✅ UNE SEULE requête avec tout ce dont on a besoin
  const userData = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      metadata: true,
      organizationId: true,
      Organization: {
        select: {
          id: true,
          name: true
        }
      },
      OrganizationUser: {
        select: { role: true }
      }
    }
  });

  if (!userData?.Organization) {
    return <OrganizationRecovery />;
  }

  // Vérifier plan en attente
  const pendingPlan = userData.metadata
    ? (userData.metadata as { pendingPlanUpgrade?: string })?.pendingPlanUpgrade
    : undefined;

  if (pendingPlan && userData.organizationId) {
    redirect(`/pricing?plan=${pendingPlan}&newSignup=true`);
  }

  // Récupérer objets
  const objets = await getAccessibleObjects(session.id, userData.Organization.id);

  return (/* JSX */);
}
```

**Gains** :

- ⚡ **1 requête au lieu de 2-3**
- 🔧 Plus maintenable

---

#### 3. Ajouter des index Prisma manquants

**Problème** : Requêtes lentes sur grandes tables

```prisma
// schema.prisma

model Task {
  // ... champs existants

  @@index([status, realizationDate])  // ✅ Pour tri optimisé
  @@index([archived, status])          // ✅ Pour filtres archives
  @@index([assignedToId, status])      // ✅ Pour "Mes tâches"
  @@index([articleId, archived])       // ✅ Pour tâches par article
}

model Notification {
  // ... existant
  @@index([userId, read, createdAt])   // ✅ Composite pour requêtes fréquentes
}

model ObjectAccess {
  // ... existant
  @@index([userId, accessLevel])       // ✅ Pour checks permissions rapides
}
```

**Commande** :

```bash
npx prisma migrate dev --name add_performance_indexes
```

**Gains** :

- ⚡ **3-10x plus rapide** sur grosses tables
- 📊 Crucial quand vous atteignez 10k+ tâches

---

### 🟡 MOYENNE PRIORITÉ (Optimisations progressives)

#### 4. Implémenter le lazy loading pour les images

```tsx
// components/ImageWithArticles.tsx
import Image from "next/image";

<Image
  src={sectorImage}
  alt={sectorName}
  fill
  loading="lazy" // ✅ Lazy load
  placeholder="blur" // ✅ Placeholder flou
  blurDataURL="data:image/png;base64,..." // Généré automatiquement
  sizes="(max-width: 768px) 100vw, 80vw" // ✅ Responsive
  quality={85} // ✅ Bon équilibre qualité/poids
/>;
```

#### 5. Paginer les commentaires/documents

**Dans `MyTasksClient.tsx`** :

```tsx
// Charger documents/commentaires à la demande
const [expandedTask, setExpandedTask] = useState<string | null>(null);

const loadTaskDetails = async (taskId: string) => {
  const [docs, comments] = await Promise.all([
    fetch(`/api/tasks/${taskId}/documents?limit=5`),
    fetch(`/api/tasks/${taskId}/comments?limit=3`),
  ]);
  // ...
};
```

#### 6. Utiliser React.memo pour composants lourds

```tsx
// components/TaskCard.tsx
import { memo } from "react";

export const TaskCard = memo(
  ({ task, onUpdate }: TaskCardProps) => {
    // ... composant
  },
  (prevProps, nextProps) => {
    // ✅ Éviter re-renders inutiles
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.status === nextProps.task.status &&
      prevProps.task.updatedAt === nextProps.task.updatedAt
    );
  },
);
```

#### 7. Optimiser les imports de Lucide React

```tsx
// ❌ AVANT - Importe TOUS les icônes (bundle énorme)
import { Calendar, Loader2, MapPin } from "lucide-react";

// ✅ APRÈS - Imports individuels (déjà configuré dans next.config)
// Mais vérifier que optimizePackageImports fonctionne
// Next.js 15 devrait le faire automatiquement
```

#### 8. Implémenter Server Actions pour mutations

```tsx
// app/actions/tasks.ts
"use server";

export async function updateTaskStatus(taskId: string, status: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  revalidatePath("/dashboard/taskhub");
  return { success: true };
}

// Dans le composant client
import { updateTaskStatus } from "@/app/actions/tasks";

const handleStatusChange = async (taskId: string, status: string) => {
  await updateTaskStatus(taskId, status);
  // ✅ Pas besoin de fetch, c'est optimisé par Next.js
};
```

---

### 🟢 BASSE PRIORITÉ (Nice to have)

#### 9. Implémenter ISR (Incremental Static Regeneration)

```tsx
// dashboard/objets/page.tsx
export const revalidate = 60; // Revalider toutes les 60 secondes

export default async function ObjetsPage() {
  // Cette page sera statiquement générée et mise en cache
  // puis revalidée toutes les 60 secondes
}
```

#### 10. Ajouter un Service Worker pour cache offline

```typescript
// public/sw.js
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      }),
    );
  }
});
```

#### 11. Bundle analyzer pour identifier bloat

```bash
npm install --save-dev @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Puis analyser
ANALYZE=true npm run build
```

---

## 📊 Métriques à Surveiller

### Core Web Vitals cibles :

- **LCP (Largest Contentful Paint)** : < 2.5s ✅
- **FID (First Input Delay)** : < 100ms ✅
- **CLS (Cumulative Layout Shift)** : < 0.1 ✅
- **TTFB (Time to First Byte)** : < 600ms ✅

### Outils :

- Vercel Analytics (déjà installé ✅)
- Chrome DevTools Lighthouse
- WebPageTest.org
- Prisma Studio pour analyser queries lentes

---

## 🎯 Plan d'Implémentation Recommandé

### Semaine 1 - Quick Wins

1. ✅ Ajouter index Prisma (30 min)
2. ✅ Optimiser `/api/tasks/my-tasks` (2h)
3. ✅ Fix double requête user dans objets/page (30 min)

**Gain estimé : 40-60% amélioration temps de chargement**

### Semaine 2 - Optimisations moyennes

4. Pagination tâches (3h)
5. Lazy loading images (1h)
6. React.memo sur composants lourds (2h)

**Gain estimé : 20-30% supplémentaire**

### Semaine 3+ - Nice to have

7. Server Actions
8. ISR sur pages statiques
9. Service Worker offline

---

## ⚡ Impact Attendu Global

| Métrique                   | Avant      | Après     | Amélioration  |
| -------------------------- | ---------- | --------- | ------------- |
| Temps chargement dashboard | ~2-3s      | ~0.8-1.2s | **60-70%** 🚀 |
| Données transférées        | ~500KB     | ~150KB    | **70%** 📉    |
| Requêtes DB par page       | 5-8        | 2-3       | **50-60%** ⚡ |
| Temps réponse API          | ~300-500ms | ~80-150ms | **70%** 🎯    |
