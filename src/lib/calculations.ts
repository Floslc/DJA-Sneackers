import { differenceInDays, parseISO } from 'date-fns'
import type { Pair } from './types'

const DEFAULT_DORMANT_THRESHOLD = 90

export function grossMargin(pair: Pair): number | null {
  const salePrice = pair.actual_sale_price ?? pair.planned_sale_price
  if (salePrice === null || salePrice === undefined) return null
  return salePrice - pair.purchase_price
}

export function grossMarginPercent(pair: Pair): number | null {
  const margin = grossMargin(pair)
  if (margin === null || pair.purchase_price === 0) return null
  return (margin / pair.purchase_price) * 100
}

export function totalPurchaseValue(pairs: Pair[]): number {
  return pairs.reduce((sum, p) => sum + p.purchase_price, 0)
}

export function totalPotentialSaleValue(pairs: Pair[]): number {
  return pairs.reduce((sum, p) => {
    const price = p.planned_sale_price ?? 0
    return sum + price
  }, 0)
}

export function totalRealizedMargin(pairs: Pair[]): number {
  return pairs.reduce((sum, p) => {
    const margin = grossMargin(p)
    if (margin === null) return sum
    // Only count realized margins (sold / completed / shipped)
    if (['sold', 'to_ship', 'shipped', 'completed'].includes(p.status)) {
      return sum + margin
    }
    return sum
  }, 0)
}

export function daysInStock(pair: Pair): number {
  if (!pair.purchase_date) return 0
  const start = parseISO(pair.purchase_date)
  const end = pair.sale_date ? parseISO(pair.sale_date) : new Date()
  return differenceInDays(end, start)
}

export function isDormant(pair: Pair, thresholdDays = DEFAULT_DORMANT_THRESHOLD): boolean {
  if (!['in_stock', 'draft', 'reserved'].includes(pair.status)) return false
  return daysInStock(pair) >= thresholdDays
}

export function dormantPairs(pairs: Pair[], thresholdDays = DEFAULT_DORMANT_THRESHOLD): Pair[] {
  return pairs.filter((p) => isDormant(p, thresholdDays))
}

export function averageDaysToSell(pairs: Pair[]): number {
  const sold = pairs.filter(
    (p) => ['sold', 'to_ship', 'shipped', 'completed'].includes(p.status) && p.purchase_date && p.sale_date
  )
  if (sold.length === 0) return 0
  const total = sold.reduce((sum, p) => sum + daysInStock(p), 0)
  return Math.round(total / sold.length)
}

export function countByStatus(pairs: Pair[]): Record<string, number> {
  return pairs.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}
