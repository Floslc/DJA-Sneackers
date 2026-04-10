'use client'

import { useRouter } from 'next/navigation'
import { PairForm } from '@/components/stock/PairForm'
import { usePairs } from '@/hooks/usePairs'
import type { PairFormValues } from '@/lib/schemas'

export default function NewPairPage() {
  const router = useRouter()
  const { createPair } = usePairs()

  const handleSubmit = async (data: PairFormValues) => {
    const pair = await createPair({
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
    })
    router.push(`/stock/${pair.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Ajouter une paire</h1>
        <p className="text-sm text-zinc-500 mt-1">Renseignez les informations de la nouvelle paire</p>
      </div>
      <PairForm
        onSubmit={handleSubmit}
        submitLabel="Créer la paire"
        defaultValues={{ status: 'in_stock' }}
      />
    </div>
  )
}
