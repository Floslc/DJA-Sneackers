import { z } from 'zod'

export const pairSchema = z.object({
  sku: z.string().optional().nullable(),
  brand: z.string().min(1, 'La marque est requise'),
  model: z.string().min(1, 'Le modèle est requis'),
  colorway: z.string().optional().nullable(),
  size: z.string().min(1, 'La pointure est requise'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  purchase_price: z.coerce.number().min(0, 'Le prix d\'achat doit être positif'),
  planned_sale_price: z.coerce.number().min(0).optional().nullable(),
  actual_sale_price: z.coerce.number().min(0).optional().nullable(),
  source: z.string().optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  sale_date: z.string().optional().nullable(),
  shipping_date: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  tracking_number: z.string().optional().nullable(),
  status: z.enum([
    'draft',
    'in_stock',
    'reserved',
    'listed_on_whatnot',
    'sold',
    'to_ship',
    'shipped',
    'completed',
    'cancelled',
    'returned',
  ]),
  notes: z.string().optional().nullable(),
})

export const pairUpdateSchema = pairSchema.partial()

export const whatnotImportRowSchema = z.object({
  order_id: z.string().optional(),
  item_title: z.string().optional(),
  item_sku: z.string().optional(),
  size: z.string().optional(),
  buyer_username: z.string().optional(),
  sale_price: z.coerce.number().optional(),
  platform_fee: z.coerce.number().optional(),
  shipping_fee: z.coerce.number().optional(),
  order_date: z.string().optional(),
})

export type PairFormValues = z.infer<typeof pairSchema>
export type WhatnotImportRow = z.infer<typeof whatnotImportRowSchema>
