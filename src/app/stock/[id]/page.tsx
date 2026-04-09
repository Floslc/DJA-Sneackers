export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Pencil } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { Pair, StockMovement } from '@/lib/types'
import { CONDITION_CONFIG } from '@/lib/constants'
import { grossMargin, daysInStock } from '@/lib/calculations'
import { StatusBadge } from '@/components/stock/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatCurrency(n: number | null): string {
  if (n === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return format(new Date(d), 'd MMMM yyyy', { locale: fr })
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-zinc-800/50 py-2 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-200">{value}</span>
    </div>
  )
}

export default async function PairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createSupabaseServerClient()

  const [{ data: pairData, error: pairError }, { data: movements }] = await Promise.all([
    supabase.from('pairs').select('*').eq('id', id).single(),
    supabase
      .from('stock_movements')
      .select('*')
      .eq('pair_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (pairError) {
    console.error('[PairDetail] Supabase error:', JSON.stringify(pairError))
  }

  if (!pairData) notFound()

  const pair = pairData as Pair
  const stockMovements = (movements ?? []) as StockMovement[]
  const margin = grossMargin(pair)
  const days = daysInStock(pair)

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/stock" className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="mt-0.5 h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 truncate">
              {pair.brand} {pair.model}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
              {pair.colorway && (
                <span className="text-sm text-zinc-400">{pair.colorway}</span>
              )}
              <span className="text-sm text-zinc-400">Taille {pair.size}</span>
              <StatusBadge status={pair.status} />
            </div>
          </div>
        </div>
        <Button asChild size="sm" className="flex-shrink-0">
          <Link href={`/stock/${id}/edit`}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Modifier</span>
            <span className="sm:hidden">Édit.</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Informations produit */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Informations produit</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="SKU" value={pair.sku ?? '—'} />
            <InfoRow label="Marque" value={pair.brand} />
            <InfoRow label="Modèle" value={pair.model} />
            <InfoRow label="Colorway" value={pair.colorway ?? '—'} />
            <InfoRow label="Pointure" value={pair.size} />
            <InfoRow label="État" value={CONDITION_CONFIG[pair.condition] ?? pair.condition} />
            <InfoRow label="Jours en stock" value={`${days}j`} />
          </CardContent>
        </Card>

        {/* Finances */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Finances</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Prix d'achat" value={formatCurrency(pair.purchase_price)} />
            <InfoRow label="Prix prévu" value={formatCurrency(pair.planned_sale_price)} />
            <InfoRow label="Prix réel" value={formatCurrency(pair.actual_sale_price)} />
            <InfoRow
              label="Marge estimée"
              value={
                <span
                  className={
                    margin === null
                      ? 'text-zinc-500'
                      : margin >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                  }
                >
                  {formatCurrency(margin)}
                </span>
              }
            />
            <InfoRow label="Source" value={pair.source ?? '—'} />
            <InfoRow label="Date d'achat" value={formatDate(pair.purchase_date)} />
          </CardContent>
        </Card>

        {/* Vente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Vente</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Plateforme" value={pair.platform ?? '—'} />
            <InfoRow label="Client" value={pair.customer_name ?? '—'} />
            <InfoRow label="Date de vente" value={formatDate(pair.sale_date)} />
          </CardContent>
        </Card>

        {/* Expédition */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Expédition</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Numéro de suivi"
              value={
                pair.tracking_number ? (
                  <span className="font-mono text-xs">{pair.tracking_number}</span>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow label="Date d'expédition" value={formatDate(pair.shipping_date)} />
            {pair.notes && (
              <div className="mt-2 border-t border-zinc-800 pt-2">
                <p className="mb-1 text-xs text-zinc-500">Notes</p>
                <p className="text-sm text-zinc-300">{pair.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique mouvements */}
      {stockMovements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Historique des mouvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockMovements.map((mv) => (
                <div key={mv.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 flex-shrink-0 text-xs text-zinc-600">
                    {format(new Date(mv.created_at), 'd MMM yyyy HH:mm', { locale: fr })}
                  </span>
                  <div className="flex items-center gap-2">
                    {mv.old_status && (
                      <>
                        <StatusBadge status={mv.old_status} />
                        <span className="text-zinc-600">→</span>
                      </>
                    )}
                    <StatusBadge status={mv.new_status} />
                  </div>
                  {mv.note && (
                    <span className="text-xs text-zinc-500">{mv.note}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-zinc-600">
        <span>
          Créé le {format(new Date(pair.created_at), 'd MMM yyyy', { locale: fr })}
        </span>
        <span>·</span>
        <span>
          Modifié le {format(new Date(pair.updated_at), 'd MMM yyyy', { locale: fr })}
        </span>
        <span>·</span>
        <span className="font-mono">{pair.id}</span>
      </div>
    </div>
  )
}
