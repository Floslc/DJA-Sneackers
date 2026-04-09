export const dynamic = 'force-dynamic'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pair } from '@/lib/types'
import { ShippingTable } from '@/components/shipping/ShippingTable'

export default function ShippingPage() {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPairs = useCallback(async () => {
    const { data } = await supabase
      .from('pairs')
      .select('*')
      .in('status', ['to_ship', 'shipped'])
      .order('sale_date', { ascending: false })
    setPairs((data ?? []) as Pair[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPairs()
  }, [fetchPairs])

  const toShipCount = pairs.filter((p) => p.status === 'to_ship').length
  const shippedCount = pairs.filter((p) => p.status === 'shipped').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Expéditions</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {toShipCount} à expédier · {shippedCount} expédiée{shippedCount !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
        </div>
      ) : (
        <ShippingTable pairs={pairs} onUpdate={fetchPairs} />
      )}
    </div>
  )
}
