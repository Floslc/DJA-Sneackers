'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Pair } from '@/lib/types'
import { parseWhatnotImport, type ImportResult } from '@/lib/csv'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ImportWhatnotProps {
  pairs: Pair[]
  onImported?: () => void
}

export function ImportWhatnot({ pairs, onImported }: ImportWhatnotProps) {
  const [dragOver, setDragOver] = useState(false)
  const [filename, setFilename] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Fichier CSV requis', variant: 'destructive' })
      return
    }
    setFilename(file.name)
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const parsed = parseWhatnotImport(content, pairs)
      setResult(parsed)
      setLoading(false)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleConfirm = async () => {
    if (!result || !filename) return
    setConfirming(true)
    let successCount = 0
    let errorCount = result.errors.length

    try {
      for (const { pair, updates } of result.matched) {
        try {
          const { error } = await supabase.from('pairs').update(updates).eq('id', pair.id)
          if (error) throw error

          if (updates.status && updates.status !== pair.status) {
            await supabase.from('stock_movements').insert({
              pair_id: pair.id,
              movement_type: 'whatnot_import',
              old_status: pair.status,
              new_status: updates.status,
              note: `Import Whatnot: ${filename}`,
            })
          }
          successCount++
        } catch {
          errorCount++
        }
      }

      // Log import
      await supabase.from('whatnot_import_exports').insert({
        type: 'import',
        filename,
        row_count: result.matched.length + result.unmatched.length + result.errors.length,
        success_count: successCount,
        error_count: errorCount,
        raw_log: JSON.stringify({
          matched: result.matched.length,
          unmatched: result.unmatched.length,
          errors: result.errors,
        }),
      })

      toast({
        title: 'Import terminé',
        description: `${successCount} paire${successCount > 1 ? 's' : ''} mise${successCount > 1 ? 's' : ''} à jour`,
      })
      setResult(null)
      setFilename(null)
      onImported?.()
    } catch (err) {
      toast({
        title: 'Erreur lors de l\'import',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        className={cn(
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-zinc-400 bg-zinc-800/50'
            : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <Upload className="h-8 w-8 mx-auto mb-3 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Glissez un fichier CSV Whatnot ou <span className="text-zinc-200 underline">cliquez ici</span>
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Colonnes attendues: order_id, item_title, item_sku, size, buyer_username, sale_price...
        </p>
        {filename && (
          <p className="text-xs text-zinc-400 mt-2 font-mono">{filename}</p>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
          <span className="ml-3 text-sm text-zinc-400">Analyse en cours...</span>
        </div>
      )}

      {/* Preview */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-900/50 bg-green-950/20 p-3 text-center">
              <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-400">{result.matched.length}</p>
              <p className="text-xs text-zinc-500">Matchées</p>
            </div>
            <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-3 text-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-yellow-400">{result.unmatched.length}</p>
              <p className="text-xs text-zinc-500">Non matchées</p>
            </div>
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-center">
              <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-400">{result.errors.length}</p>
              <p className="text-xs text-zinc-500">Erreurs</p>
            </div>
          </div>

          {/* Matched rows preview */}
          {result.matched.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">
                Paires qui seront mises à jour
              </h4>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-3 py-2 text-left text-xs text-zinc-500">Paire</th>
                      <th className="px-3 py-2 text-left text-xs text-zinc-500">Acheteur</th>
                      <th className="px-3 py-2 text-left text-xs text-zinc-500">Prix vente</th>
                      <th className="px-3 py-2 text-left text-xs text-zinc-500">Nouveau statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {result.matched.map(({ pair, row, updates }) => (
                      <tr key={pair.id} className="hover:bg-zinc-800/30">
                        <td className="px-3 py-2 text-zinc-200">
                          {pair.brand} {pair.model} – {pair.size}
                        </td>
                        <td className="px-3 py-2 text-zinc-400">{row.buyer_username || '—'}</td>
                        <td className="px-3 py-2 text-green-400">
                          {row.sale_price ? `${row.sale_price} €` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs bg-blue-950 text-blue-400 px-2 py-0.5 rounded">
                            {updates.status ?? pair.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unmatched */}
          {result.unmatched.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-2">
                Lignes non matchées (ignorées)
              </h4>
              <div className="space-y-1">
                {result.unmatched.map((row, i) => (
                  <p key={i} className="text-xs text-zinc-500 font-mono">
                    {row.item_sku || row.item_title || `Ligne ${row._rowIndex}`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">Erreurs</h4>
              <div className="space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400">
                    Ligne {err.row}: {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleConfirm}
              disabled={confirming || result.matched.length === 0}
            >
              {confirming ? 'Import en cours...' : `Confirmer l'import (${result.matched.length} paires)`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null)
                setFilename(null)
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
