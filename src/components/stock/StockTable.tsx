'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from './StatusBadge'
import type { Pair, PairStatus } from '@/lib/types'
import { STATUS_CONFIG, STATUS_TRANSITIONS, BRANDS } from '@/lib/constants'
import { grossMargin, daysInStock } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface StockTableProps {
  pairs: Pair[]
  onUpdateStatus: (id: string, status: PairStatus) => Promise<void>
  onDuplicate: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

function formatCurrency(n: number | null): string {
  if (n === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export function StockTable({
  pairs,
  onUpdateStatus,
  onDuplicate,
  onDelete,
  onSelectionChange,
}: StockTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [brandFilter, setBrandFilter] = React.useState<string>('all')

  const filteredPairs = React.useMemo(() => {
    return pairs.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false
      return true
    })
  }, [pairs, statusFilter, brandFilter])

  React.useEffect(() => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k])
    const selected = ids
      .map((idx) => filteredPairs[parseInt(idx)]?.id)
      .filter(Boolean) as string[]
    onSelectionChange?.(selected)
  }, [rowSelection, filteredPairs, onSelectionChange])

  const columns = React.useMemo<ColumnDef<Pair>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-zinc-100"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-zinc-100"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="text-xs text-zinc-500 font-mono">{row.original.sku ?? '—'}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'brand',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Marque
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-zinc-200">{row.original.brand}</span>
        ),
      },
      {
        id: 'product',
        header: 'Modèle',
        accessorFn: (row) => `${row.model} ${row.colorway ?? ''}`,
        cell: ({ row }) => (
          <div>
            <button
              onClick={() => router.push(`/stock/${row.original.id}`)}
              className="text-sm text-zinc-200 hover:text-zinc-100 hover:underline text-left"
            >
              {row.original.model}
            </button>
            {row.original.colorway && (
              <p className="text-xs text-zinc-500 mt-0.5">{row.original.colorway}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'size',
        header: 'Taille',
        cell: ({ row }) => (
          <span className="text-sm text-zinc-300">{row.original.size}</span>
        ),
        size: 70,
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 130,
      },
      {
        accessorKey: 'purchase_price',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Achat
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-zinc-300">
            {formatCurrency(row.original.purchase_price)}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: 'planned_sale_price',
        header: 'Prix vente',
        cell: ({ row }) => (
          <span className="text-sm text-zinc-300">
            {formatCurrency(row.original.planned_sale_price)}
          </span>
        ),
        size: 90,
      },
      {
        id: 'margin',
        header: 'Marge est.',
        accessorFn: (row) => grossMargin(row),
        cell: ({ row }) => {
          const m = grossMargin(row.original)
          return (
            <span
              className={cn(
                'text-sm font-medium',
                m === null
                  ? 'text-zinc-600'
                  : m >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              )}
            >
              {formatCurrency(m)}
            </span>
          )
        },
        size: 90,
      },
      {
        id: 'days_in_stock',
        header: 'Jours',
        accessorFn: (row) => daysInStock(row),
        cell: ({ row }) => {
          const days = daysInStock(row.original)
          return (
            <span
              className={cn(
                'text-sm',
                days > 90 ? 'text-yellow-400' : days > 60 ? 'text-zinc-400' : 'text-zinc-500'
              )}
            >
              {days}j
            </span>
          )
        },
        size: 60,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const pair = row.original
          const transitions = STATUS_TRANSITIONS[pair.status]
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/stock/${pair.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await onDuplicate(pair.id)
                      toast({ title: 'Paire dupliquée' })
                    } catch {
                      toast({ title: 'Erreur', variant: 'destructive' })
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer
                </DropdownMenuItem>
                {transitions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Changer statut
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {transitions.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={async () => {
                              try {
                                await onUpdateStatus(pair.id, s)
                                toast({
                                  title: 'Statut mis à jour',
                                  description: STATUS_CONFIG[s].label,
                                })
                              } catch {
                                toast({ title: 'Erreur', variant: 'destructive' })
                              }
                            }}
                          >
                            {STATUS_CONFIG[s].label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300 focus:bg-red-950"
                  onClick={async () => {
                    if (!confirm('Supprimer cette paire ?')) return
                    try {
                      await onDelete(pair.id)
                      toast({ title: 'Paire supprimée' })
                    } catch {
                      toast({ title: 'Erreur', variant: 'destructive' })
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        size: 60,
        enableSorting: false,
      },
    ],
    [router, onUpdateStatus, onDuplicate, onDelete]
  )

  const table = useReactTable({
    data: filteredPairs,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Rechercher marque, modèle, SKU..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [PairStatus, typeof STATUS_CONFIG[PairStatus]][]).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Marque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes marques</SelectItem>
            {BRANDS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-zinc-500">
          {filteredPairs.length} paire{filteredPairs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-zinc-800 bg-zinc-900/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-12 text-center text-sm text-zinc-500"
                  >
                    Aucune paire trouvée
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'hover:bg-zinc-800/30 transition-colors',
                      row.getIsSelected() && 'bg-zinc-800/50'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
