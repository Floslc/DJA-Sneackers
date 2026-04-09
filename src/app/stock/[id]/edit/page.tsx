export const dynamic = 'force-dynamic'
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Pair } from '@/lib/types'
import type { PairFormValues } from '@/lib/schemas'
import { PairForm } from '@/components/stock/PairForm'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function EditPairPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [pair, setPair] = useState<Pair | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('pairs')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast({ title: 'Paire introuvable', variant: 'destructive' })
          router.push('/stock')
          return
        }
        setPair(data as Pair)
        setLoading(false)
      })
  }, [id, router])

  const handleSubmit = async (data: PairFormValues) => {
    const { error } = await supabase
      .from('pairs')
      .update({
        ...data,
        sku: data.sku ?? null,
        colorway: data.colorway ?? null,
        planned_sale_price: data.planned_sale_price ?? null,
        actual_sale_price: data.actual_sale_price ?? null,
        source: data.source ?? null,
        purchase_date: data.purchase_date ?? null,
        sale_date: data.sale_date ?? null,
        shipping_date: data.shipping_date ?? null,
        platform: data.platform ?? null,
        customer_name: data.customer_name ?? null,
        tracking_number: data.tracking_number ?? null,
        notes: data.notes ?? null,
        photo_url: data.photo_url ?? null,
      })
      .eq('id', id)

    if (error) throw error

    // Log status change if changed
    if (pair && data.status !== pair.status) {
      await supabase.from('stock_movements').insert({
        pair_id: id,
        movement_type: 'status_change',
        old_status: pair.status,
        new_status: data.status,
        note: 'Modifié via formulaire',
      })
    }

    toast({ title: 'Paire mise à jour' })
    router.push(`/stock/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    )
  }

  if (!pair) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/stock/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Modifier la paire</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {pair.brand} {pair.model} – {pair.size}
          </p>
        </div>
      </div>
      <PairForm
        defaultValues={pair}
        onSubmit={handleSubmit}
        submitLabel="Mettre à jour"
      />
    </div>
  )
}
