import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { enqueueMutation, listPendingMutations, type PendingMutation } from '../lib/offlineOutbox'
import type { Aparelho, Categoria, CondicaoAparelho, CustoExtra, Fornecedor, StatusAparelho } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

type AparelhoRow = Aparelho & { categoria: Categoria | null; fornecedor: Fornecedor | null }

export interface AparelhoInput {
  nome: string
  categoria_id: string | null
  fornecedor_id: string | null
  identificador: string | null
  modelo: string
  cor: string | null
  capacidade_gb: number | null
  bateria_saude: number | null
  imei: string
  imei2: string | null
  condicao: CondicaoAparelho
  data_compra: string
  custo_compra: number
  custos_extras: CustoExtra[]
  dias_planejados: number | null
  observacoes: string | null
  preco_sugerido: number | null
}

function aparelhoDePendenciaCriada(
  pending: Extract<PendingMutation, { kind: 'criar_aparelho' }>,
): Aparelho & { pendenteSync: boolean } {
  return {
    ...pending.input,
    id: pending.id,
    user_id: '',
    loja_id: '',
    status: 'em_estoque',
    created_at: pending.createdAt,
    updated_at: pending.createdAt,
    categoria: pending.categoriaSnapshot,
    fornecedor: pending.fornecedorSnapshot,
    pendenteSync: true,
  }
}

export function useAparelhos() {
  const { data, loading, error, refetch } = useSupabaseList<AparelhoRow>(async () =>
    supabase
      .from('aparelhos')
      .select('*, categoria:categorias(*), fornecedor:fornecedores(*)')
      .order('created_at', { ascending: false }),
  )

  const [pendentes, setPendentes] = useState<PendingMutation[]>([])

  const recarregarPendentes = useCallback(async () => {
    setPendentes(await listPendingMutations())
  }, [])

  useEffect(() => {
    recarregarPendentes()
  }, [recarregarPendentes])

  const idsExistentes = new Set(data.map((a) => a.id))
  const criacoesPendentes = pendentes.filter(
    (p): p is Extract<PendingMutation, { kind: 'criar_aparelho' }> =>
      p.kind === 'criar_aparelho' && !idsExistentes.has(p.id),
  )

  const aparelhos: (Aparelho & { pendenteSync?: boolean })[] = [
    ...criacoesPendentes.map((p) => aparelhoDePendenciaCriada(p)),
    ...data,
  ]

  async function criar(
    input: AparelhoInput,
    categoriaSnapshot: Categoria | null = null,
    fornecedorSnapshot: Fornecedor | null = null,
  ) {
    if (!navigator.onLine) {
      await enqueueMutation({
        kind: 'criar_aparelho',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        input,
        categoriaSnapshot,
        fornecedorSnapshot,
      })
      await recarregarPendentes()
      return { error: null }
    }

    const { error } = await supabase.from('aparelhos').insert(input)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function editar(aparelhoId: string, input: AparelhoInput) {
    const { error } = await supabase.from('aparelhos').update(input).eq('id', aparelhoId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  /** Transições manuais. `vendido` só é setado pelo RPC `concluir_venda` (atômico). */
  async function alterarStatus(
    aparelhoId: string,
    status: Extract<StatusAparelho, 'em_estoque' | 'reservado' | 'devolvido' | 'baixado' | 'perdido_danificado'>,
  ) {
    const { error } = await supabase.from('aparelhos').update({ status }).eq('id', aparelhoId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(aparelhoId: string) {
    const { error } = await supabase.from('aparelhos').delete().eq('id', aparelhoId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  /** Importação CSV: um insert por linha (não em lote) — um IMEI duplicado numa linha nunca derruba as demais. */
  async function importarVarios(inputs: AparelhoInput[]) {
    const resultados: { index: number; error: string | null }[] = []
    for (const [i, input] of inputs.entries()) {
      const { error } = await supabase.from('aparelhos').insert(input)
      resultados.push({ index: i, error: error?.message ?? null })
    }
    await refetch()
    return resultados
  }

  return { aparelhos, loading, error, criar, editar, alterarStatus, remover, importarVarios, refetch }
}
