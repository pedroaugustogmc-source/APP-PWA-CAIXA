import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcularItem } from '../lib/calculations'
import { enqueueMutation, listPendingMutations, type PendingMutation } from '../lib/offlineOutbox'
import type {
  Categoria,
  CondicaoItem,
  CustoExtra,
  Fornecedor,
  Item,
  ItemCalculado,
  Plataforma,
  StatusItem,
} from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

type ItemRow = Item & { categoria: Categoria | null; fornecedor: Fornecedor | null; plataforma: Plataforma | null }

export interface ItemInput {
  nome: string
  categoria_id: string | null
  fornecedor_id: string | null
  data_compra: string
  custo_compra: number
  custos_extras: CustoExtra[]
  dias_planejados: number | null
  condicao: CondicaoItem
  observacoes: string | null
}

export interface VendaInput {
  preco_venda: number
  plataforma_id: string | null
  taxa_plataforma_pct: number
  data_venda: string
}

function itemDePendenciaCriada(pending: Extract<PendingMutation, { kind: 'criar_item' }>): ItemCalculado {
  const item: Item = {
    id: pending.id,
    user_id: '',
    nome: pending.input.nome,
    categoria_id: pending.input.categoria_id,
    fornecedor_id: pending.input.fornecedor_id,
    identificador: null,
    condicao: pending.input.condicao,
    status: 'em_estoque',
    data_compra: pending.input.data_compra,
    custo_compra: pending.input.custo_compra,
    custos_extras: pending.input.custos_extras,
    dias_planejados: pending.input.dias_planejados,
    data_venda: null,
    preco_venda: null,
    plataforma_id: null,
    taxa_plataforma_pct: null,
    observacoes: pending.input.observacoes,
    created_at: pending.createdAt,
    updated_at: pending.createdAt,
  }
  return calcularItem(item, pending.categoriaSnapshot, pending.fornecedorSnapshot, null)
}

export function useItens() {
  const { data, loading, error, refetch } = useSupabaseList<ItemRow>(async () =>
    supabase
      .from('itens')
      .select('*, categoria:categorias(*), fornecedor:fornecedores(*), plataforma:plataformas(*)')
      .order('created_at', { ascending: false }),
  )

  const [pendentes, setPendentes] = useState<PendingMutation[]>([])

  const recarregarPendentes = useCallback(async () => {
    setPendentes(await listPendingMutations())
  }, [])

  useEffect(() => {
    recarregarPendentes()
  }, [recarregarPendentes])

  const criados = data.map((item) => calcularItem(item, item.categoria, item.fornecedor, item.plataforma))

  const idsExistentes = new Set(criados.map((i) => i.id))
  const criacoesPendentes = pendentes.filter(
    (p): p is Extract<PendingMutation, { kind: 'criar_item' }> => p.kind === 'criar_item' && !idsExistentes.has(p.id),
  )
  const vendasPendentesPorItem = new Map(
    pendentes.filter((p) => p.kind === 'registrar_venda').map((p) => [p.itemId, p]),
  )

  const itens: (ItemCalculado & { pendenteSync?: boolean })[] = [
    ...criacoesPendentes.map((p) => ({ ...itemDePendenciaCriada(p), pendenteSync: true })),
    ...criados.map((item) => {
      const venda = vendasPendentesPorItem.get(item.id)
      if (!venda || venda.kind !== 'registrar_venda') return item
      const atualizado: Item = {
        ...item,
        status: 'vendido',
        preco_venda: venda.input.preco_venda,
        plataforma_id: venda.input.plataforma_id,
        taxa_plataforma_pct: venda.input.taxa_plataforma_pct,
        data_venda: venda.input.data_venda,
      }
      return {
        ...calcularItem(atualizado, item.categoria, item.fornecedor, venda.plataformaSnapshot),
        pendenteSync: true,
      }
    }),
  ]

  async function criar(input: ItemInput, categoriaSnapshot: Categoria | null, fornecedorSnapshot: Fornecedor | null = null) {
    if (!navigator.onLine) {
      await enqueueMutation({
        kind: 'criar_item',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        input,
        categoriaSnapshot,
        fornecedorSnapshot,
      })
      await recarregarPendentes()
      return { error: null }
    }

    const { error } = await supabase.from('itens').insert(input)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function registrarVenda(itemId: string, input: VendaInput, plataformaSnapshot: Plataforma | null = null) {
    if (!navigator.onLine) {
      await enqueueMutation({
        kind: 'registrar_venda',
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        itemId,
        input,
        plataformaSnapshot,
      })
      await recarregarPendentes()
      return { error: null }
    }

    const { error } = await supabase
      .from('itens')
      .update({ status: 'vendido', ...input })
      .eq('id', itemId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function editar(itemId: string, input: ItemInput) {
    const { error } = await supabase.from('itens').update(input).eq('id', itemId)
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

  async function remover(itemId: string) {
    const { error } = await supabase.from('itens').delete().eq('id', itemId)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return {
    itens,
    loading,
    error,
    criar,
    editar,
    registrarVenda,
    cancelarVenda,
    marcarPerdido,
    alterarStatus,
    remover,
    refetch,
  }
}
