'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StockTable } from '@/components/stock/StockTable'
import { usePairs } from '@/hooks/usePairs'
import { toast } from '@/hooks/use-toast'
import type { PairStatus } from '@/lib/types'

export default function StockPage() {
  const { pairs, loading, updateStatus, duplicatePair, deletePair } = usePairs()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Stock</h1>
            <p className="text-sm text-zinc-500 mt-1">Gestion de vos sneakers</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Stock</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {pairs.length} paire{pairs.length !== 1 ? 's' : ''} dans la base
          </p>
        </div>
        <Button asChild>
          <Link href="/stock/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une paire
          </Link>
        </Button>
      </div>

      <StockTable
        pairs={pairs}
        onUpdateStatus={async (id, status: PairStatus) => {
          await updateStatus(id, status)
        }}
        onDuplicate={async (id) => {
          await duplicatePair(id)
          toast({ title: 'Paire dupliquée en brouillon' })
        }}
        onDelete={async (id) => {
          await deletePair(id)
        }}
      />
    </div>
  )
}
