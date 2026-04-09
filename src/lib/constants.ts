import type { PairStatus } from './types'

export interface StatusConfig {
  label: string
  bgColor: string
  textColor: string
  icon: string
}

export const STATUS_CONFIG: Record<PairStatus, StatusConfig> = {
  draft: {
    label: 'Brouillon',
    bgColor: 'bg-zinc-800',
    textColor: 'text-zinc-400',
    icon: 'Pencil',
  },
  in_stock: {
    label: 'En stock',
    bgColor: 'bg-green-950',
    textColor: 'text-green-400',
    icon: 'Package',
  },
  reserved: {
    label: 'Réservé',
    bgColor: 'bg-orange-950',
    textColor: 'text-orange-400',
    icon: 'Clock',
  },
  listed_on_whatnot: {
    label: 'Listé Whatnot',
    bgColor: 'bg-purple-950',
    textColor: 'text-purple-400',
    icon: 'Tag',
  },
  sold: {
    label: 'Vendu',
    bgColor: 'bg-blue-950',
    textColor: 'text-blue-400',
    icon: 'ShoppingBag',
  },
  to_ship: {
    label: 'À expédier',
    bgColor: 'bg-yellow-950',
    textColor: 'text-yellow-400',
    icon: 'Truck',
  },
  shipped: {
    label: 'Expédié',
    bgColor: 'bg-sky-950',
    textColor: 'text-sky-400',
    icon: 'Send',
  },
  completed: {
    label: 'Terminé',
    bgColor: 'bg-emerald-950',
    textColor: 'text-emerald-400',
    icon: 'CheckCircle',
  },
  cancelled: {
    label: 'Annulé',
    bgColor: 'bg-red-950',
    textColor: 'text-red-400',
    icon: 'XCircle',
  },
  returned: {
    label: 'Retourné',
    bgColor: 'bg-amber-950',
    textColor: 'text-amber-500',
    icon: 'RotateCcw',
  },
}

export const CONDITION_CONFIG: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Quasi-neuf',
  good: 'Bon état',
  fair: 'État correct',
  poor: 'Usé',
}

export const PLATFORMS = [
  'Whatnot',
  'Vinted',
  'StockX',
  'GOAT',
  'Instagram',
  'Leboncoin',
  'Grailed',
  'Autre',
]

export const BRANDS = [
  'Nike',
  'Adidas',
  'Jordan',
  'New Balance',
  'Yeezy',
  'Asics',
  'Puma',
  'Reebok',
  'Converse',
  'Vans',
  'Autre',
]

export const STATUS_TRANSITIONS: Record<PairStatus, PairStatus[]> = {
  draft: ['in_stock', 'cancelled'],
  in_stock: ['reserved', 'listed_on_whatnot', 'sold', 'cancelled'],
  reserved: ['in_stock', 'sold', 'cancelled'],
  listed_on_whatnot: ['in_stock', 'sold', 'cancelled'],
  sold: ['to_ship', 'cancelled'],
  to_ship: ['shipped', 'cancelled'],
  shipped: ['completed', 'returned'],
  completed: [],
  cancelled: ['in_stock'],
  returned: ['in_stock', 'cancelled'],
}
