'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Package, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/stock/StatusBadge'
import type { Pair } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

interface ShippingTableProps {
  pairs: Pair[]
  onUpdate: () => void
}

export function ShippingTable({ pairs, onUpdate }: ShippingTableProps) {
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const toShip = pairs.filter((p) => p.status === 'to_ship')
  const shipped = pairs.filter((p) => p.status === 'shipped')

  const markShipped = async (pair: Pair) => {
    const tracking = trackingInputs[pair.id] || pair.tracking_number
    setLoading((prev) => ({ ...prev, [pair.id]: true }))
    try {
      const { error } = await supabase
        .from('pairs')
        .update({
          status: 'shipped',
          tracking_number: tracking || null,
          shipping_date: new Date().toISOString().slice(0, 10),
        })
        .eq('id', pair.id)
      if (error) throw error

      await supabase.from('stock_movements').insert({
        pair_id: pair.id,
        movement_type: 'status_change',
        old_status: pair.status,
        new_status: 'shipped',
        note: tracking ? `Tracking: ${tracking}` : 'Expédié sans suivi',
      })

      toast({ title: 'Marqué comme expédié' })
      onUpdate()
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setLoading((prev) => ({ ...prev, [pair.id]: false }))
    }
  }

  const markCompleted = async (pair: Pair) => {
    setLoading((prev) => ({ ...prev, [pair.id]: true }))
    try {
      const { error } = await supabase
        .from('pairs')
        .update({ status: 'completed' })
        .eq('id', pair.id)
      if (error) throw error

      await supabase.from('stock_movements').insert({
        pair_id: pair.id,
        movement_type: 'status_change',
        old_status: pair.status,
        new_status: 'completed',
        note: 'Commande terminée',
      })

      toast({ title: 'Commande terminée' })
      onUpdate()
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setLoading((prev) => ({ ...prev, [pair.id]: false }))
    }
  }

  if (toShip.length === 0 && shipped.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Aucune expédition en attente</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* To Ship */}
      {toShip.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            À expédier ({toShip.length})
          </h3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Produit</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Client</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Plateforme</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Date vente</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Numéro de suivi</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {toShip.map((pair) => (
                  <tr key={pair.id} className="hover:bg-zinc-800/30">
                    <td className="px-3 py-3">
                      <p className="text-zinc-200 font-medium">{pair.brand} {pair.model}</p>
                      <p className="text-xs text-zinc-500">{pair.size}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{pair.customer_name ?? '—'}</td>
                    <td className="px-3 py-3 text-zinc-400">{pair.platform ?? '—'}</td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">
                      {pair.sale_date
                        ? format(new Date(pair.sale_date), 'd MMM yyyy', { locale: fr })
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        className="h-7 text-xs bg-zinc-900 border-zinc-700 w-44"
                        placeholder="1Z999AA10..."
                        value={trackingInputs[pair.id] ?? pair.tracking_number ?? ''}
                        onChange={(e) =>
                          setTrackingInputs((prev) => ({ ...prev, [pair.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        size="sm"
                        onClick={() => markShipped(pair)}
                        disabled={loading[pair.id]}
                        className="h-7 text-xs"
                      >
                        <Package className="mr-1.5 h-3.5 w-3.5" />
                        Expédier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shipped */}
      {shipped.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-sky-400 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Expédiées ({shipped.length})
          </h3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Produit</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Client</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Plateforme</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Date expéd.</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Suivi</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Statut</th>
                  <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {shipped.map((pair) => (
                  <tr key={pair.id} className="hover:bg-zinc-800/30">
                    <td className="px-3 py-3">
                      <p className="text-zinc-200 font-medium">{pair.brand} {pair.model}</p>
                      <p className="text-xs text-zinc-500">{pair.size}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{pair.customer_name ?? '—'}</td>
                    <td className="px-3 py-3 text-zinc-400">{pair.platform ?? '—'}</td>
                    <td className="px-3 py-3 text-zinc-400 text-xs">
                      {pair.shipping_date
                        ? format(new Date(pair.shipping_date), 'd MMM yyyy', { locale: fr })
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs text-zinc-500">
                        {pair.tracking_number ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={pair.status} />
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markCompleted(pair)}
                        disabled={loading[pair.id]}
                        className="h-7 text-xs"
                      >
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        Terminer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
