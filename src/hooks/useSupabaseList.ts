import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Busca uma lista via Supabase e expõe loading/erro/refetch.
 * Base compartilhada por todos os hooks de dados (nada de fetch duplicado por página).
 */
export function useSupabaseList<T>(fetcher: () => Promise<{ data: T[] | null; error: PostgrestError | null }>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: result, error: fetchError } = await fetcher()
    if (fetchError) {
      setError(fetchError.message)
      setData([])
    } else {
      setData(result ?? [])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
