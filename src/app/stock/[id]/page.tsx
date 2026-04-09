import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Pair, StockMovement } from '@/lib/types'
import { STATUS_CONFIG, CONDITION_CONFIG } from '@/lib/constants'
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
    <div className="flex justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-zinc-200 font-medium">{value}</span>
    </div>
  )
}

export default async function PairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [{ data: pairData }, { data: movements }] = await Promise.all([
    supabase.from('pairs').select('*').eq('id', id).single(),
    supabase
      .from('stock_movements')
      .select('*')
      .eq('pair_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!pairData) notFound()
  const pair = pairData as Pair
  const stockMovements = (movements ?? []) as StockMovement[]

  const margin = grossMargin(pair)
  const days = daysInStock(pair)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/stock">
            <Button variant="ghost" size="icon" className="h-9 w-9 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              {pair.brand} {pair.model}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {pair.colorway && <span className="text-sm text-zinc-400">{pair.colorway}</span>}
              <span className="text-sm text-zinc-400">Taille {pair.size}</span>
              <StatusBadge status={pair.status} />
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/stock/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Product Info */}
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

        {/* Financial Info */}
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
                <span className={margin === null ? 'text-zinc-500' : margin >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(margin)}
                </span>
              }
            />
            <InfoRow label="Source" value={pair.source ?? '—'} />
            <InfoRow label="Date d'achat" value={formatDate(pair.purchase_date)} />
          </CardContent>
        </Card>

        {/* Sale Info */}
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

        {/* Shipping Info */}
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
              <div className="pt-2 mt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Notes</p>
                <p className="text-sm text-zinc-300">{pair.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {stockMovements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Historique des mouvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockMovements.map((mv) => (
                <div key={mv.id} className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-600 text-xs w-32 flex-shrink-0">
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
                  {mv.note && <span className="text-zinc-500 text-xs">{mv.note}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 text-xs text-zinc-600">
        <span>Créé le {format(new Date(pair.created_at), 'd MMM yyyy', { locale: fr })}</span>
        <span>·</span>
        <span>Modifié le {format(new Date(pair.updated_at), 'd MMM yyyy', { locale: fr })}</span>
        <span>·</span>
        <span className="font-mono">{pair.id}</span>
      </div>
    </div>
  )
}
