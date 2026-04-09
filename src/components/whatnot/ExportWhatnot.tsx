'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/stock/StatusBadge'
import type { Pair } from '@/lib/types'
import { exportToWhatnotCSV } from '@/lib/csv'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ExportWhatnotProps {
  pairs: Pair[]
  onExported?: () => void
}

export function ExportWhatnot({ pairs, onExported }: ExportWhatnotProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Default: show in_stock + listed_on_whatnot
  const exportablePairs = pairs.filter((p) =>
    ['in_stock', 'listed_on_whatnot', 'reserved', 'draft'].includes(p.status)
  )

  const toggleAll = () => {
    if (selectedIds.size === exportablePairs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(exportablePairs.map((p) => p.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedPairs = exportablePairs.filter((p) => selectedIds.has(p.id))

  const handleExport = async () => {
    if (selectedPairs.length === 0) {
      toast({ title: 'Aucune paire sélectionnée', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const csv = exportToWhatnotCSV(selectedPairs)
      const filename = `whatnot_export_${new Date().toISOString().slice(0, 10)}.csv`

      // Trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      // Log export
      await supabase.from('whatnot_import_exports').insert({
        type: 'export',
        filename,
        row_count: selectedPairs.length,
        success_count: selectedPairs.length,
        error_count: 0,
        raw_log: `Exported SKUs: ${selectedPairs.map((p) => p.sku ?? p.id).join(', ')}`,
      })

      toast({ title: `Export réussi – ${selectedPairs.length} paires` })
      onExported?.()
    } catch (err) {
      toast({
        title: 'Erreur lors de l\'export',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {exportablePairs.length} paire{exportablePairs.length !== 1 ? 's' : ''} exportables
          {selectedIds.size > 0 && ` · ${selectedIds.size} sélectionnée${selectedIds.size > 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selectedIds.size === exportablePairs.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={loading || selectedPairs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV ({selectedPairs.length})
          </Button>
        </div>
      </div>

      {exportablePairs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune paire en stock à exporter</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-zinc-100"
                    checked={selectedIds.size === exportablePairs.length && exportablePairs.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">SKU</th>
                <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Produit</th>
                <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Taille</th>
                <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Statut</th>
                <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Prix départ</th>
                <th className="px-3 py-3 text-left text-xs uppercase tracking-wider text-zinc-500">Prix achat_now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {exportablePairs.map((pair) => (
                <tr
                  key={pair.id}
                  className={cn(
                    'hover:bg-zinc-800/30 transition-colors cursor-pointer',
                    selectedIds.has(pair.id) && 'bg-zinc-800/40'
                  )}
                  onClick={() => toggleOne(pair.id)}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-zinc-100"
                      checked={selectedIds.has(pair.id)}
                      onChange={() => toggleOne(pair.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-zinc-500">{pair.sku ?? '—'}</td>
                  <td className="px-3 py-3">
                    <span className="text-zinc-200">{pair.brand} {pair.model}</span>
                    {pair.colorway && <span className="text-zinc-500 text-xs ml-1">– {pair.colorway}</span>}
                  </td>
                  <td className="px-3 py-3 text-zinc-300">{pair.size}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={pair.status} />
                  </td>
                  <td className="px-3 py-3 text-zinc-300">
                    {pair.planned_sale_price ? `${pair.planned_sale_price} €` : `${pair.purchase_price} €`}
                  </td>
                  <td className="px-3 py-3 text-zinc-300">
                    {pair.planned_sale_price ? `${pair.planned_sale_price} €` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
