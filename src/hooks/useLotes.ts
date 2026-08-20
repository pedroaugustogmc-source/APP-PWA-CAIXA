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
    // RPC transacional: cria o lote e as N linhas em `itens` na mesma transação —
    // evita lote órfão sem itens caso o segundo insert falhasse isoladamente.
    const { error } = await supabase.rpc('criar_lote_com_itens', {
      p_data_compra: input.data_compra,
      p_fornecedor_id: input.fornecedor_id,
      p_categoria_id: input.categoria_id,
      p_quantidade_comprada: input.quantidade_comprada,
      p_custo_produto: input.custo_produto,
      p_custo_frete: input.custo_frete,
      p_custo_extra: input.custo_extra,
      p_cotacao_dolar: input.cotacao_dolar,
      p_observacoes: input.observacoes,
    })

    if (error) {
      return { error: error.message }
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
