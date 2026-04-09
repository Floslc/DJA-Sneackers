export type PairStatus =
  | 'draft'
  | 'in_stock'
  | 'reserved'
  | 'listed_on_whatnot'
  | 'sold'
  | 'to_ship'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'returned'

export interface Pair {
  id: string
  sku: string | null
  brand: string
  model: string
  colorway: string | null
  size: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  purchase_price: number
  planned_sale_price: number | null
  actual_sale_price: number | null
  source: string | null
  purchase_date: string | null
  sale_date: string | null
  shipping_date: string | null
  platform: string | null
  customer_name: string | null
  tracking_number: string | null
  status: PairStatus
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  pair_id: string
  movement_type: string
  old_status: PairStatus | null
  new_status: PairStatus
  note: string | null
  created_at: string
}

export interface WhatnotImportExport {
  id: string
  type: 'import' | 'export'
  filename: string
  row_count: number
  success_count: number
  error_count: number
  raw_log: string | null
  created_at: string
}
