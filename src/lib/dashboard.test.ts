import { describe, expect, it } from 'vitest'
import { calcularItem } from './calculations'
import {
  kpiLucroPorCategoria,
  kpiMargemPorFornecedor,
  kpiMargemPorPlataforma,
  kpiPerdas,
} from './dashboard'
import type { Categoria, Fornecedor, Item, LoteCompra, Plataforma } from '../types/domain'

const lote: LoteCompra = {
  id: 'lote-1',
  user_id: 'u1',
  data_compra: '2026-01-01',
  fornecedor_id: 'forn-1',
  categoria_id: 'cat-1',
  quantidade_comprada: 10,
  custo_produto: 150,
  custo_frete: 20,
  custo_extra: 10,
  cotacao_dolar: null,
  observacoes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const plataforma: Plataforma = {
  id: 'plat-1',
  user_id: 'u1',
  nome: 'Mercado Livre',
  taxa_padrao_pct: 0.12,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const categorias: Categoria[] = [{ id: 'cat-1', user_id: 'u1', nome: 'Capa', created_at: '', updated_at: '' }]
const fornecedores: Fornecedor[] = [
  { id: 'forn-1', user_id: 'u1', nome: 'Fornecedor A', contato: null, observacoes: null, created_at: '', updated_at: '' },
]

function itemVendido(overrides: Partial<Item> = {}): Item {
  return {
    id: overrides.id ?? 'item-1',
    user_id: 'u1',
    lote_id: lote.id,
    identificador: null,
    condicao: 'novo',
    status: 'vendido',
    data_venda: '2026-01-10',
    preco_venda: 45,
    plataforma_id: plataforma.id,
    taxa_plataforma_pct: 0.12,
    observacoes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
    ...overrides,
  }
}

describe('KPIs avançados (9-11)', () => {
  const itens = [
    calcularItem(itemVendido({ id: 'a' }), lote, plataforma, 0.4),
    calcularItem(itemVendido({ id: 'b', preco_venda: 15 }), lote, plataforma, 0.4), // venda com prejuízo
  ]

  it('KPI 9 — margem média por plataforma', () => {
    const resultado = kpiMargemPorPlataforma(itens, [plataforma])[0]
    expect(resultado?.plataforma_nome).toBe('Mercado Livre')
    expect(resultado?.quantidade_vendida).toBe(2)
  })

  it('KPI 10 — margem média por fornecedor', () => {
    const resultado = kpiMargemPorFornecedor(itens, fornecedores)[0]
    expect(resultado?.fornecedor_nome).toBe('Fornecedor A')
  })

  it('lucro total por categoria soma (não faz média)', () => {
    const resultado = kpiLucroPorCategoria(itens, categorias)[0]
    // item a: 45 - 5.4 - 18 = 21.6 | item b: 15 - 1.8 - 18 = -4.8 → total 16.8
    expect(resultado?.lucro_total).toBeCloseTo(16.8, 10)
  })

  it('KPI 11 — perdas contam quantidade e valor pelo custo unitário', () => {
    const perdido = calcularItem(
      itemVendido({ id: 'c', status: 'perdido_danificado', data_venda: null, preco_venda: null, plataforma_id: null, taxa_plataforma_pct: null }),
      lote,
      plataforma,
      0.4,
    )
    const resultado = kpiPerdas([perdido])
    expect(resultado.quantidade).toBe(1)
    expect(resultado.valor_total).toBeCloseTo(18, 10)
  })
})
