import { supabase } from '@/lib/supabase'
import type { Pair } from '@/lib/types'
import {
  totalRealizedMargin,
  dormantPairs,
  averageDaysToSell,
  grossMargin,
} from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/stock/StatusBadge'
import { AnalyticsCharts } from './AnalyticsCharts'
import { format, parseISO, startOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function groupByMonth(pairs: Pair[]) {
  const sold = pairs.filter(
    (p) => ['sold', 'to_ship', 'shipped', 'completed'].includes(p.status) && p.sale_date
  )

  const monthMap: Record<string, { sales: number; margin: number; count: number }> = {}

  for (const pair of sold) {
    const month = format(startOfMonth(parseISO(pair.sale_date!)), 'MMM yyyy', { locale: fr })
    if (!monthMap[month]) monthMap[month] = { sales: 0, margin: 0, count: 0 }
    monthMap[month].sales += pair.actual_sale_price ?? pair.planned_sale_price ?? 0
    monthMap[month].margin += grossMargin(pair) ?? 0
    monthMap[month].count += 1
  }

  return Object.entries(monthMap)
    .map(([month, data]) => ({ month, ...data }))
    .slice(-12)
}

function groupByBrand(pairs: Pair[]) {
  const sold = pairs.filter((p) => ['sold', 'to_ship', 'shipped', 'completed'].includes(p.status))
  const brandMap: Record<string, number> = {}
  for (const pair of sold) {
    brandMap[pair.brand] = (brandMap[pair.brand] ?? 0) + 1
  }
  return Object.entries(brandMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

export default async function AnalyticsPage() {
  const { data } = await supabase
    .from('pairs')
    .select('*')
    .order('created_at', { ascending: false })

  const pairs = (data ?? []) as Pair[]

  const soldPairs = pairs.filter((p) =>
    ['sold', 'to_ship', 'shipped', 'completed'].includes(p.status)
  )
  const totalSold = soldPairs.reduce(
    (sum, p) => sum + (p.actual_sale_price ?? p.planned_sale_price ?? 0),
    0
  )
  const totalMargin = totalRealizedMargin(pairs)
  const avgDays = averageDaysToSell(pairs)
  const dormant = dormantPairs(pairs)
  const monthlyData = groupByMonth(pairs)
  const brandData = groupByBrand(pairs)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">Performances de votre activité sneakers</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Total vendu</p>
            <p className="text-xl font-bold text-zinc-100 mt-1">{formatCurrency(totalSold)}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{soldPairs.length} paires</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Marge totale</p>
            <p
              className={`text-xl font-bold mt-1 ${totalMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {formatCurrency(totalMargin)}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">
              {totalSold > 0 ? `${((totalMargin / totalSold) * 100).toFixed(1)}% du CA` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Délai moyen</p>
            <p className="text-xl font-bold text-zinc-100 mt-1">
              {avgDays > 0 ? `${avgDays}j` : '—'}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">Achat → Vente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Stock dormant</p>
            <p className={`text-xl font-bold mt-1 ${dormant.length > 0 ? 'text-yellow-400' : 'text-zinc-100'}`}>
              {dormant.length}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">Paires &gt;90 jours</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <AnalyticsCharts monthlyData={monthlyData} brandData={brandData} />

      {/* Dormant Stock Table */}
      {dormant.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-yellow-400">
              Stock dormant (&gt;90 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {dormant.map((pair) => {
                const days = pair.purchase_date
                  ? Math.floor((Date.now() - new Date(pair.purchase_date).getTime()) / (1000 * 60 * 60 * 24))
                  : 0
                return (
                  <div key={pair.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-zinc-200 font-medium">{pair.brand} {pair.model}</p>
                      <span className="text-sm font-bold text-yellow-400 flex-shrink-0">{days}j</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-zinc-500">T. {pair.size}</span>
                      <StatusBadge status={pair.status} />
                      <span className="text-xs text-zinc-400 ml-auto">{formatCurrency(pair.purchase_price)}</span>
                    </div>
                    {pair.purchase_date && (
                      <p className="text-xs text-zinc-600">
                        Acheté le {format(parseISO(pair.purchase_date), 'd MMM yyyy', { locale: fr })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Produit</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Taille</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Statut</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Prix achat</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Jours</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Date achat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {dormant.map((pair) => {
                    const days = pair.purchase_date
                      ? Math.floor((Date.now() - new Date(pair.purchase_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 0
                    return (
                      <tr key={pair.id} className="hover:bg-zinc-800/30">
                        <td className="px-3 py-2 text-zinc-200">{pair.brand} {pair.model}</td>
                        <td className="px-3 py-2 text-zinc-400">{pair.size}</td>
                        <td className="px-3 py-2"><StatusBadge status={pair.status} /></td>
                        <td className="px-3 py-2 text-zinc-300">{formatCurrency(pair.purchase_price)}</td>
                        <td className="px-3 py-2 text-yellow-400 font-medium">{days}j</td>
                        <td className="px-3 py-2 text-zinc-500 text-xs">
                          {pair.purchase_date
                            ? format(parseISO(pair.purchase_date), 'd MMM yyyy', { locale: fr })
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
