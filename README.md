# DJA Sneakers – Gestion de stock

Application Next.js de gestion de stock de sneakers avec intégration Whatnot.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4**
- **shadcn/ui** (composants inline)
- **Supabase** (base de données + RLS)
- **TanStack Table** (tableau de stock avec filtres/tri/pagination)
- **Recharts** (analytics)
- **Papaparse** (import/export CSV Whatnot)
- **Zod** (validation)

## Installation

```bash
git clone <repo>
cd dja-sneakers
npm install
```

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** et exécuter le contenu de `supabase/schema.sql`
3. Copier `.env.local.example` vers `.env.local` :

```bash
cp .env.local.example .env.local
```

4. Renseigner vos clés Supabase dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Les clés se trouvent dans **Project Settings → API** de votre dashboard Supabase.

## Lancement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000)

## Fonctionnalités

### Dashboard
- Vue d'ensemble : paires en stock, valeur d'achat, marge réalisée, délai moyen
- Alertes stock dormant (>90 jours)
- Dernières paires ajoutées

### Stock
- Tableau complet avec filtres (statut, marque), recherche, tri, pagination (25/page)
- Ajout/modification/suppression de paires
- Changement de statut rapide via menu contextuel
- Duplication de paires

### Statuts disponibles
`draft` → `in_stock` → `reserved` / `listed_on_whatnot` → `sold` → `to_ship` → `shipped` → `completed`

### Whatnot
- **Export** : sélectionner des paires et générer un CSV format Whatnot (`title, description, quantity, start_price, buy_now_price, sku`)
- **Import** : uploader un CSV de commandes Whatnot pour mettre à jour automatiquement les statuts et prix de vente
- Historique des opérations

### Expéditions
- Vue consolidée des paires à expédier et expédiées
- Ajout du numéro de suivi et marquage comme expédié/terminé

### Analytics
- Graphique ventes par mois (BarChart)
- Graphique marge par mois (LineChart)
- Top 5 marques vendues (PieChart)
- Table stock dormant

## Structure des données

### Table `pairs`
La table principale stocke toutes les sneakers avec :
- Infos produit (SKU, marque, modèle, colorway, taille, état)
- Prix (achat, prévu, réel)
- Logistique (source, dates, plateforme, client, tracking)
- Statut + notes

### Table `stock_movements`
Historique automatique de tous les changements de statut.

### Table `whatnot_import_exports`
Log de toutes les opérations CSV Whatnot.

## Format CSV Whatnot

### Export (vers Whatnot)
Colonnes : `title, description, quantity, start_price, buy_now_price, sku`

### Import (depuis Whatnot)
Colonnes attendues : `order_id, item_title, item_sku, size, buyer_username, sale_price, platform_fee, shipping_fee, order_date`

Les paires sont matchées par SKU en priorité, puis par titre.
