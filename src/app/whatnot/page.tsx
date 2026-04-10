'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Pair, WhatnotImportExport } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportWhatnot } from '@/components/whatnot/ExportWhatnot'
import { ImportWhatnot } from '@/components/whatnot/ImportWhatnot'

export default function WhatnotPage() {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [history, setHistory] = useState<WhatnotImportExport[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [{ data: p }, { data: h }] = await Promise.all([
      supabase.from('pairs').select('*').order('created_at', { ascending: false }),
      supabase
        .from('whatnot_import_exports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setPairs((p ?? []) as Pair[])
    setHistory((h ?? []) as WhatnotImportExport[])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Whatnot</h1>
        <p className="text-sm text-zinc-500 mt-1">Export et import des données Whatnot</p>
      </div>

      <Tabs defaultValue="export">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="export" className="flex-1 sm:flex-none gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import" className="flex-1 sm:flex-none gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-zinc-300">
                Générer un CSV pour Whatnot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExportWhatnot pairs={pairs} onExported={refresh} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-zinc-300">
                Importer les ventes depuis Whatnot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImportWhatnot pairs={pairs} onImported={refresh} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Historique des opérations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-800">
              {history.map((op) => (
                <div key={op.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={
                        op.type === 'export'
                          ? 'flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-blue-950 text-blue-400'
                          : 'flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-purple-950 text-purple-400'
                      }
                    >
                      {op.type === 'export' ? (
                        <ArrowUpFromLine className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{op.filename}</p>
                      <p className="text-xs text-zinc-500">
                        {op.success_count} succès
                        {op.error_count > 0 && ` · ${op.error_count} erreurs`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0">
                    {format(new Date(op.created_at), 'd MMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
