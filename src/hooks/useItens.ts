import { supabase } from '../lib/supabase'
import { calcularItem } from '../lib/calculations'
import type { Item, ItemCalculado, LoteCompra, Plataforma, StatusItem } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'
import { useConfiguracoes } from './useConfiguracoes'

type ItemRow = Item & { lote: LoteCompra; plataforma: Plataforma | null }

export interface VendaInput {
  preco_venda: number
  plataforma_id: string
  taxa_plataforma_pct: number
  data_venda: string
}

export function useItens() {
  const { config } = useConfiguracoes()
  const { data, loading, error, refetch } = useSupabaseList<ItemRow>(async () =>
    supabase
      .from('itens')
      .select('*, lote:lotes_compra(*), plataforma:plataformas(*)')
      .order('created_at', { ascending: false }),
  )

  const itens: ItemCalculado[] = data.map((item) =>
    calcularItem(item, item.lote, item.plataforma, config.margem_alvo_pct),
  )

  async function registrarVenda(itemId: string, input: VendaInput) {
    const { error } = await supabase
      .from('itens')
      .update({ status: 'vendido', ...input })
      .eq('id', itemId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function cancelarVenda(itemId: string) {
    const { error } = await supabase
      .from('itens')
      .update({
        status: 'em_estoque',
        data_venda: null,
        preco_venda: null,
        plataforma_id: null,
        taxa_plataforma_pct: null,
      })
      .eq('id', itemId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function marcarPerdido(itemId: string) {
    const { error } = await supabase
      .from('itens')
      .update({
        status: 'perdido_danificado',
        data_venda: null,
        preco_venda: null,
        plataforma_id: null,
        taxa_plataforma_pct: null,
      })
      .eq('id', itemId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function alterarStatus(itemId: string, status: Extract<StatusItem, 'em_estoque' | 'reservado'>) {
    const { error } = await supabase.from('itens').update({ status }).eq('id', itemId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { itens, loading, error, registrarVenda, cancelarVenda, marcarPerdido, alterarStatus, refetch }
}
