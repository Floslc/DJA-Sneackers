import Papa from 'papaparse'
import type { Pair } from './types'
import { whatnotImportRowSchema } from './schemas'

// ─────────────────────────────────────────
// Export to Whatnot CSV
// ─────────────────────────────────────────
export function exportToWhatnotCSV(pairs: Pair[]): string {
  const rows = pairs.map((p) => ({
    title: `${p.brand} ${p.model}${p.colorway ? ' ' + p.colorway : ''} - ${p.size}`,
    description: [
      `Marque: ${p.brand}`,
      `Modèle: ${p.model}`,
      p.colorway ? `Colorway: ${p.colorway}` : null,
      `Pointure: ${p.size}`,
      `État: ${p.condition}`,
      p.notes ? `Notes: ${p.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    quantity: 1,
    start_price: p.planned_sale_price ?? p.purchase_price,
    buy_now_price: p.planned_sale_price ?? '',
    sku: p.sku ?? p.id,
  }))

  return Papa.unparse(rows, { header: true })
}

// ─────────────────────────────────────────
// Export generic stock CSV
// ─────────────────────────────────────────
export function exportStockCSV(pairs: Pair[]): string {
  const rows = pairs.map((p) => ({
    id: p.id,
    sku: p.sku ?? '',
    brand: p.brand,
    model: p.model,
    colorway: p.colorway ?? '',
    size: p.size,
    condition: p.condition,
    status: p.status,
    purchase_price: p.purchase_price,
    planned_sale_price: p.planned_sale_price ?? '',
    actual_sale_price: p.actual_sale_price ?? '',
    purchase_date: p.purchase_date ?? '',
    sale_date: p.sale_date ?? '',
    platform: p.platform ?? '',
    customer_name: p.customer_name ?? '',
    tracking_number: p.tracking_number ?? '',
    notes: p.notes ?? '',
  }))

  return Papa.unparse(rows, { header: true })
}

// ─────────────────────────────────────────
// Parse Whatnot Import CSV
// ─────────────────────────────────────────
export interface ParsedWhatnotRow {
  order_id: string
  item_title: string
  item_sku: string
  size: string
  buyer_username: string
  sale_price: number
  platform_fee: number
  shipping_fee: number
  order_date: string
  _rowIndex: number
}

export interface ImportResult {
  matched: Array<{
    pair: Pair
    row: ParsedWhatnotRow
    updates: Partial<Pair>
  }>
  unmatched: ParsedWhatnotRow[]
  errors: Array<{ row: number; message: string }>
}

export function parseWhatnotImport(csvContent: string, pairs: Pair[]): ImportResult {
  const result: ImportResult = {
    matched: [],
    unmatched: [],
    errors: [],
  }

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  parsed.data.forEach((rawRow, index) => {
    const rowIndex = index + 2 // 1-based + header row

    const validation = whatnotImportRowSchema.safeParse(rawRow)
    if (!validation.success) {
      result.errors.push({
        row: rowIndex,
        message: validation.error.issues.map((i) => i.message).join(', '),
      })
      return
    }

    const data = validation.data

    const row: ParsedWhatnotRow = {
      order_id: data.order_id ?? '',
      item_title: data.item_title ?? '',
      item_sku: data.item_sku ?? '',
      size: data.size ?? '',
      buyer_username: data.buyer_username ?? '',
      sale_price: data.sale_price ?? 0,
      platform_fee: data.platform_fee ?? 0,
      shipping_fee: data.shipping_fee ?? 0,
      order_date: data.order_date ?? '',
      _rowIndex: rowIndex,
    }

    // Try to match by SKU first, then by title
    let matchedPair: Pair | undefined

    if (row.item_sku) {
      matchedPair = pairs.find(
        (p) =>
          (p.sku && p.sku.toLowerCase() === row.item_sku.toLowerCase()) ||
          p.id === row.item_sku
      )
    }

    if (!matchedPair && row.item_title) {
      const titleLower = row.item_title.toLowerCase()
      matchedPair = pairs.find((p) => {
        const pairTitle = `${p.brand} ${p.model}`.toLowerCase()
        return titleLower.includes(pairTitle) || pairTitle.includes(titleLower)
      })
    }

    if (matchedPair) {
      const updates: Partial<Pair> = {
        actual_sale_price: row.sale_price > 0 ? row.sale_price : matchedPair.actual_sale_price,
        customer_name: row.buyer_username || matchedPair.customer_name,
        sale_date: row.order_date || matchedPair.sale_date,
        platform: 'Whatnot',
        status: 'sold',
      }
      result.matched.push({ pair: matchedPair, row, updates })
    } else {
      result.unmatched.push(row)
    }
  })

  return result
}
