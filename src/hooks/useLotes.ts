import { supabase } from '../lib/supabase'
import { custoTotalLote, custoUnitario } from '../lib/calculations'
import type { Categoria, Fornecedor, LoteCalculado, LoteCompra } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface LoteInput {
  data_compra: string
  fornecedor_id: string | null
  categoria_id: string | null
  quantidade_comprada: number
  custo_produto: number
  custo_frete: number
  custo_extra: number
  cotacao_dolar: number | null
  observacoes: string | null
}

type LoteRow = LoteCompra & {
  fornecedor: Fornecedor | null
  categoria: Categoria | null
  itens: { status: string }[]
}

export function useLotes() {
  const { data, loading, error, refetch } = useSupabaseList<LoteRow>(async () =>
    supabase
      .from('lotes_compra')
      .select('*, fornecedor:fornecedores(*), categoria:categorias(*), itens(status)')
      .order('data_compra', { ascending: false }),
  )

  const lotes: LoteCalculado[] = data.map((lote) => {
    const quantidade_vendida = lote.itens.filter((i) => i.status === 'vendido').length
    const quantidade_em_estoque = lote.itens.filter(
      (i) => i.status === 'em_estoque' || i.status === 'reservado',
    ).length
    return {
      ...lote,
      custo_total_lote: custoTotalLote(lote),
      custo_unitario: custoUnitario(lote),
      quantidade_vendida,
      quantidade_em_estoque,
    }
  })

  async function criar(input: LoteInput) {
    const { data: novoLote, error: loteError } = await supabase
      .from('lotes_compra')
      .insert(input)
      .select('id, quantidade_comprada')
      .single()

    if (loteError || !novoLote) {
      return { error: loteError?.message ?? 'Não foi possível criar o lote.' }
    }

    // Lote com quantidade > 1 gera N linhas em `itens` automaticamente.
    const novosItens = Array.from({ length: novoLote.quantidade_comprada }, () => ({
      lote_id: novoLote.id,
    }))
    const { error: itensError } = await supabase.from('itens').insert(novosItens)

    if (itensError) {
      return { error: itensError.message }
    }

    await refetch()
    return { error: null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('lotes_compra').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { lotes, loading, error, criar, remover, refetch }
}
