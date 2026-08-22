import { describe, expect, it } from 'vitest'
import { calcularItem } from './calculations'
import { isItemParado, kpiLucroPorCategoria, kpiMargemPorFornecedor, kpiMargemPorPlataforma, kpiPerdas } from './dashboard'
import type { Categoria, Fornecedor, Item, Plataforma } from '../types/domain'

const categoria: Categoria = { id: 'cat-1', user_id: 'u1', nome: 'Capa', created_at: '', updated_at: '' }
const fornecedor: Fornecedor = {
  id: 'forn-1',
  user_id: 'u1',
  nome: 'Fornecedor A',
  contato: null,
  observacoes: null,
  created_at: '',
  updated_at: '',
}
const plataforma: Plataforma = {
  id: 'plat-1',
  user_id: 'u1',
  nome: 'Mercado Livre',
  taxa_padrao_pct: 0.12,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function itemVendido(overrides: Partial<Item> = {}): Item {
  return {
    id: overrides.id ?? 'item-1',
    user_id: 'u1',
    nome: 'Capa transparente',
    categoria_id: categoria.id,
    fornecedor_id: fornecedor.id,
    identificador: null,
    condicao: 'novo',
    status: 'vendido',
    data_compra: '2026-01-01',
    custo_compra: 15,
    custos_extras: [{ label: 'Frete', valor: 3 }],
    dias_planejados: null,
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

describe('KPIs por plataforma, fornecedor, categoria e perdas', () => {
  const itens = [
    calcularItem(itemVendido({ id: 'a' }), categoria, fornecedor, plataforma, 0.4),
    calcularItem(itemVendido({ id: 'b', preco_venda: 15 }), categoria, fornecedor, plataforma, 0.4), // venda com prejuízo
  ]

  it('margem média por plataforma', () => {
    const resultado = kpiMargemPorPlataforma(itens, [plataforma])[0]
    expect(resultado?.plataforma_nome).toBe('Mercado Livre')
    expect(resultado?.quantidade_vendida).toBe(2)
  })

  it('margem média por fornecedor', () => {
    const resultado = kpiMargemPorFornecedor(itens, [fornecedor])[0]
    expect(resultado?.fornecedor_nome).toBe('Fornecedor A')
  })

  it('lucro total por categoria soma (não faz média)', () => {
    const resultado = kpiLucroPorCategoria(itens, [categoria])[0]
    // item a: 45 - 5.4 - 18 = 21.6 | item b: 15 - 1.8 - 18 = -4.8 → total 16.8
    expect(resultado?.lucro_total).toBeCloseTo(16.8, 10)
  })

  it('perdas contam quantidade e valor pelo custo total do item', () => {
    const perdido = calcularItem(
      itemVendido({
        id: 'c',
        status: 'perdido_danificado',
        data_venda: null,
        preco_venda: null,
        plataforma_id: null,
        taxa_plataforma_pct: null,
      }),
      categoria,
      fornecedor,
      plataforma,
      0.4,
    )
    const resultado = kpiPerdas([perdido])
    expect(resultado.quantidade).toBe(1)
    expect(resultado.valor_total).toBeCloseTo(18, 10)
  })
})

describe('isItemParado', () => {
  it('usa o prazo planejado do item quando definido, em vez do limite global', () => {
    const item = { status: 'em_estoque' as const, dias_em_estoque: 10, dias_planejados: 7 }
    expect(isItemParado(item, 30)).toBe(true) // 10 > 7 (planejado), mesmo abaixo do limite global
  })

  it('cai no limite global quando o item não tem prazo planejado', () => {
    const item = { status: 'em_estoque' as const, dias_em_estoque: 10, dias_planejados: null }
    expect(isItemParado(item, 30)).toBe(false)
    expect(isItemParado(item, 5)).toBe(true)
  })
})
