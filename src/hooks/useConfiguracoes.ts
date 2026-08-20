import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Configuracoes } from '../types/domain'

type ConfigValues = Pick<Configuracoes, 'margem_alvo_pct' | 'meta_mensal_lucro' | 'dias_estoque_parado_alerta'>

const PADRAO: ConfigValues = {
  margem_alvo_pct: 0.4,
  meta_mensal_lucro: 0,
  dias_estoque_parado_alerta: 30,
}

export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('configuracoes').select('*').maybeSingle()
    if (error) {
      setError(error.message)
    } else {
      setConfig(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function salvar(input: Partial<ConfigValues>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Sessão expirada.' }

    const { error } = await supabase
      .from('configuracoes')
      .upsert({ user_id: user.id, ...PADRAO, ...config, ...input }, { onConflict: 'user_id' })
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { config: config ?? { ...PADRAO }, loading, error, salvar, refetch }
}
