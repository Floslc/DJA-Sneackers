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

      if (err) throw err

      console.log('DATA PAIRS:', data)
      setPairs(data ?? [])

    } catch (e: any) {
      console.error('usePairs ERROR:', e)

      const message =
        e?.message ||
        e?.error_description ||
        e?.details ||
        JSON.stringify(e) ||
        'Erreur inconnue'

      setError(message)

      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
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

      await fetchPairs()
      return created as Pair
    },
    [fetchPairs]
  )

  const deletePair = useCallback(
    async (id: string) => {
      const { error: err } = await supabase
        .from('pairs')
        .delete()
        .eq('id', id)

      if (err) throw err

      await fetchPairs()
    },
    [fetchPairs]
  )

  return {
    pairs,
    loading,
    error,
    fetchPairs,
    createPair,
    deletePair,
  }
}