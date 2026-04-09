'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pair, PairStatus } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

export function usePairs() {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPairs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('pairs')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) throw err
      setPairs(data ?? [])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue'
      setError(message)
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPairs()
  }, [fetchPairs])

  const createPair = useCallback(
    async (data: Omit<Pair, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: created, error: err } = await supabase
        .from('pairs')
        .insert(data)
        .select()
        .single()
      if (err) throw err

      // Log movement
      await supabase.from('stock_movements').insert({
        pair_id: created.id,
        movement_type: 'create',
        old_status: null,
        new_status: data.status,
        note: 'Paire créée',
      })

      await fetchPairs()
      return created as Pair
    },
    [fetchPairs]
  )

  const updatePair = useCallback(
    async (id: string, updates: Partial<Pair>) => {
      const existing = pairs.find((p) => p.id === id)

      const { data: updated, error: err } = await supabase
        .from('pairs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (err) throw err

      // Log status movement if changed
      if (existing && updates.status && updates.status !== existing.status) {
        await supabase.from('stock_movements').insert({
          pair_id: id,
          movement_type: 'status_change',
          old_status: existing.status,
          new_status: updates.status,
        })
      }

      await fetchPairs()
      return updated as Pair
    },
    [fetchPairs, pairs]
  )

  const deletePair = useCallback(
    async (id: string) => {
      const { error: err } = await supabase.from('pairs').delete().eq('id', id)
      if (err) throw err
      await fetchPairs()
    },
    [fetchPairs]
  )

  const updateStatus = useCallback(
    async (id: string, newStatus: PairStatus, note?: string) => {
      const existing = pairs.find((p) => p.id === id)
      if (!existing) throw new Error('Paire introuvable')

      const { error: err } = await supabase
        .from('pairs')
        .update({ status: newStatus })
        .eq('id', id)
      if (err) throw err

      await supabase.from('stock_movements').insert({
        pair_id: id,
        movement_type: 'status_change',
        old_status: existing.status,
        new_status: newStatus,
        note: note ?? null,
      })

      await fetchPairs()
    },
    [fetchPairs, pairs]
  )

  const duplicatePair = useCallback(
    async (id: string) => {
      const pair = pairs.find((p) => p.id === id)
      if (!pair) throw new Error('Paire introuvable')

      const { id: _id, created_at, updated_at, ...rest } = pair
      const newPair = {
        ...rest,
        sku: rest.sku ? `${rest.sku}-copy` : null,
        status: 'draft' as PairStatus,
      }

      return createPair(newPair)
    },
    [pairs, createPair]
  )

  return {
    pairs,
    loading,
    error,
    fetchPairs,
    createPair,
    updatePair,
    deletePair,
    updateStatus,
    duplicatePair,
  }
}
