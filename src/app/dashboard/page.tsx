export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Layers,
} from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Pair } from '@/lib/types'
import {
  totalPurchaseValue,
  totalRealizedMargin,
  dormantPairs,
  countByStatus,
  averageDaysToSell,
} from '@/lib/calculations'
import { StatCard } from '@/components/dashboard/StatCard'
import { DormantAlert } from '@/components/dashboard/DormantAlert'
import { StatusBadge } from '@/components/stock/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function DashboardPage() {
  // Nouvelle instance par requête — pas de singleton serveur
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Dashboard] Supabase error:', JSON.stringify(error))
  }

  const allPairs = (data ?? []) as Pair[]
  const statusCounts = countByStatus(allPairs)

  const inStock =
    (statusCounts['in_stock'] ?? 0) +
    (statusCounts['reserved'] ?? 0) +
    (statusCounts['listed_on_whatnot'] ?? 0)

  const soldCount =
    (statusCounts['sold'] ?? 0) +
    (statusCounts['to_ship'] ?? 0) +
    (statusCounts['shipped'] ?? 0) +
    (statusCounts['completed'] ?? 0)

  const purchaseValue = totalPurchaseValue(
    allPairs.filter((p) => !['cancelled', 'returned'].includes(p.status))
  )
  const realizedMargin = totalRealizedMargin(allPairs)
  const avgDays = averageDaysToSell(allPairs)
  const dormant = dormantPairs(allPairs)
  const recent = allPairs.slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Vue d&apos;ensemble · {allPairs.length} paire{allPairs.length !== 1 ? 's' : ''} dans la base
        </p>
        {error && (
          <p className="mt-2 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
            Erreur Supabase : {error.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Paires en stock"
          value={inStock}
          subtitle={`${allPairs.length} total · ${statusCounts['draft'] ?? 0} brouillon(s)`}
          icon={Package}
          accentColor="zinc"
        />
        <StatCard
          title="Valeur d'achat (stock actif)"
          value={formatCurrency(purchaseValue)}
          subtitle="Capital immobilisé"
          icon={DollarSign}
          accentColor="blue"
        />
        <StatCard
          title="Paires vendues"
          value={soldCount}
          subtitle="Toutes plateformes confondues"
          icon={ShoppingCart}
          accentColor="green"
        />
        <StatCard
          title="Marge réalisée"
          value={formatCurrency(realizedMargin)}
          subtitle="Ventes confirmées"
          icon={TrendingUp}
          accentColor={realizedMargin >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Délai moyen d'écoulement"
          value={avgDays > 0 ? `${avgDays}j` : '—'}
          subtitle="Du jour d'achat à la vente"
          icon={Clock}
          accentColor="yellow"
        />
        <StatCard
          title="Listées sur Whatnot"
          value={statusCounts['listed_on_whatnot'] ?? 0}
          subtitle="En live ou planifiées"
          icon={Layers}
          accentColor="zinc"
        />
      </div>

      {dormant.length > 0 && <DormantAlert pairs={dormant} />}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Dernières paires ajoutées
            </CardTitle>
            <Link
              href="/stock"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Voir tout →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              Aucune paire dans la base.{' '}
              <Link href="/stock/new" className="text-zinc-300 hover:underline">
                Ajouter la première
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recent.map((pair) => (
                <div key={pair.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/stock/${pair.id}`}
                      className="text-sm font-medium text-zinc-200 transition-colors hover:text-zinc-100"
                    >
                      {pair.brand} {pair.model}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Taille {pair.size}
                      {pair.colorway ? ` · ${pair.colorway}` : ''}
                      {pair.purchase_date
                        ? ` · ${format(new Date(pair.purchase_date), 'd MMM yyyy', { locale: fr })}`
                        : ''}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-4">
                    <span className="text-sm font-medium text-zinc-300">
                      {formatCurrency(pair.purchase_price)}
                    </span>
                    <StatusBadge status={pair.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
