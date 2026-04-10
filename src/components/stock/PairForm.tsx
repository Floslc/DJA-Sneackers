'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { pairSchema, type PairFormValues } from '@/lib/schemas'
import { BRANDS, PLATFORMS, CONDITION_CONFIG, STATUS_CONFIG } from '@/lib/constants'
import type { Pair } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface PairFormProps {
  defaultValues?: Partial<Pair>
  onSubmit: (data: PairFormValues) => Promise<void>
  submitLabel?: string
  isLoading?: boolean
}

function FormField({
  label,
  error,
  children,
  required,
}: {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 pt-2 pb-1 border-b border-zinc-800">
      {children}
    </h3>
  )
}

export function PairForm({ defaultValues, onSubmit, submitLabel = 'Enregistrer', isLoading }: PairFormProps) {
  const router = useRouter()
  const [formData, setFormData] = React.useState<Partial<PairFormValues>>({
    sku: defaultValues?.sku ?? '',
    brand: defaultValues?.brand ?? '',
    model: defaultValues?.model ?? '',
    colorway: defaultValues?.colorway ?? '',
    size: defaultValues?.size ?? '',
    condition: defaultValues?.condition ?? 'new',
    purchase_price: defaultValues?.purchase_price ?? 0,
    planned_sale_price: defaultValues?.planned_sale_price ?? undefined,
    actual_sale_price: defaultValues?.actual_sale_price ?? undefined,
    source: defaultValues?.source ?? '',
    purchase_date: defaultValues?.purchase_date ?? '',
    sale_date: defaultValues?.sale_date ?? '',
    shipping_date: defaultValues?.shipping_date ?? '',
    platform: defaultValues?.platform ?? '',
    customer_name: defaultValues?.customer_name ?? '',
    tracking_number: defaultValues?.tracking_number ?? '',
    status: defaultValues?.status ?? 'draft',
    notes: defaultValues?.notes ?? '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)

  const set = (key: keyof PairFormValues, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = pairSchema.safeParse({
      ...formData,
      purchase_price: Number(formData.purchase_price ?? 0),
      planned_sale_price: formData.planned_sale_price ? Number(formData.planned_sale_price) : null,
      actual_sale_price: formData.actual_sale_price ? Number(formData.actual_sale_price) : null,
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(result.data)
      toast({ title: 'Paire enregistrée avec succès' })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Une erreur est survenue'
      console.error('[PairForm] submit error:', err)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl">
      {/* Product Info */}
      <div className="space-y-4">
        <SectionTitle>Informations produit</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="SKU" error={errors.sku}>
            <Input
              className={inputClass}
              placeholder="NK-AJ1-001"
              value={formData.sku ?? ''}
              onChange={(e) => set('sku', e.target.value || null)}
            />
          </FormField>
          <FormField label="Marque" required error={errors.brand}>
            <Select value={formData.brand ?? ''} onValueChange={(v) => set('brand', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Choisir une marque" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <FormField label="Modèle" required error={errors.model}>
          <Input
            className={inputClass}
            placeholder="Air Jordan 1 Retro High OG"
            value={formData.model ?? ''}
            onChange={(e) => set('model', e.target.value)}
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Colorway" error={errors.colorway}>
            <Input
              className={inputClass}
              placeholder="Chicago"
              value={formData.colorway ?? ''}
              onChange={(e) => set('colorway', e.target.value || null)}
            />
          </FormField>
          <FormField label="Pointure" required error={errors.size}>
            <Input
              className={inputClass}
              placeholder="42, 42.5, US10..."
              value={formData.size ?? ''}
              onChange={(e) => set('size', e.target.value)}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="État" required error={errors.condition}>
            <Select value={formData.condition ?? 'new'} onValueChange={(v) => set('condition', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_CONFIG).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Statut" required error={errors.status}>
            <Select value={formData.status ?? 'draft'} onValueChange={(v) => set('status', v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(
                  ([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>

      {/* Prix */}
      <div className="space-y-4">
        <SectionTitle>Prix</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Prix d'achat (€)" required error={errors.purchase_price}>
            <Input
              className={inputClass}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.purchase_price ?? ''}
              onChange={(e) => set('purchase_price', e.target.value)}
            />
          </FormField>
          <FormField label="Prix de vente prévu (€)" error={errors.planned_sale_price}>
            <Input
              className={inputClass}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.planned_sale_price ?? ''}
              onChange={(e) => set('planned_sale_price', e.target.value || null)}
            />
          </FormField>
          <FormField label="Prix de vente réel (€)" error={errors.actual_sale_price}>
            <Input
              className={inputClass}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.actual_sale_price ?? ''}
              onChange={(e) => set('actual_sale_price', e.target.value || null)}
            />
          </FormField>
        </div>
      </div>

      {/* Logistique */}
      <div className="space-y-4">
        <SectionTitle>Acquisition</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Source / Vendeur" error={errors.source}>
            <Input
              className={inputClass}
              placeholder="SNKRS, Vinted, Brocante..."
              value={formData.source ?? ''}
              onChange={(e) => set('source', e.target.value || null)}
            />
          </FormField>
          <FormField label="Date d'achat" error={errors.purchase_date}>
            <Input
              className={inputClass}
              type="date"
              value={formData.purchase_date ?? ''}
              onChange={(e) => set('purchase_date', e.target.value || null)}
            />
          </FormField>
        </div>
      </div>

      {/* Vente */}
      <div className="space-y-4">
        <SectionTitle>Vente</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Plateforme de vente" error={errors.platform}>
            <Select
              value={formData.platform ?? ''}
              onValueChange={(v) => set('platform', v || null)}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Choisir une plateforme" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Date de vente" error={errors.sale_date}>
            <Input
              className={inputClass}
              type="date"
              value={formData.sale_date ?? ''}
              onChange={(e) => set('sale_date', e.target.value || null)}
            />
          </FormField>
        </div>
        <FormField label="Nom du client / Pseudo" error={errors.customer_name}>
          <Input
            className={inputClass}
            placeholder="sneaker_fan42"
            value={formData.customer_name ?? ''}
            onChange={(e) => set('customer_name', e.target.value || null)}
          />
        </FormField>
      </div>

      {/* Expédition */}
      <div className="space-y-4">
        <SectionTitle>Expédition</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Numéro de suivi" error={errors.tracking_number}>
            <Input
              className={inputClass}
              placeholder="1Z999AA10123456784"
              value={formData.tracking_number ?? ''}
              onChange={(e) => set('tracking_number', e.target.value || null)}
            />
          </FormField>
          <FormField label="Date d'expédition" error={errors.shipping_date}>
            <Input
              className={inputClass}
              type="date"
              value={formData.shipping_date ?? ''}
              onChange={(e) => set('shipping_date', e.target.value || null)}
            />
          </FormField>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <SectionTitle>Notes</SectionTitle>
        <FormField label="Notes internes" error={errors.notes}>
          <Textarea
            className={cn(inputClass, 'min-h-[80px]')}
            placeholder="Notes sur l'état, l'historique, infos acheteur..."
            value={formData.notes ?? ''}
            onChange={(e) => set('notes', e.target.value || null)}
          />
        </FormField>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <Button type="submit" disabled={submitting || isLoading}>
          {submitting || isLoading ? 'Enregistrement...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
