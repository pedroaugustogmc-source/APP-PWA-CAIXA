import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CatalogoPublicoItem } from '../types/domain'

export function useCatalogoPublico(lojaId: string | undefined) {
  const [itens, setItens] = useState<CatalogoPublicoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lojaId) {
      setLoading(false)
      setError('Link inválido.')
      return
    }

    let ativo = true
    setLoading(true)
    setError(null)

    supabase
      .from('catalogo_publico')
      .select('*')
      .eq('loja_id', lojaId)
      .order('nome', { ascending: true })
      .then(({ data, error }) => {
        if (!ativo) return
        if (error) setError(error.message)
        else setItens(data ?? [])
        setLoading(false)
      })

    return () => {
      ativo = false
    }
  }, [lojaId])

  return { itens, loading, error }
}
