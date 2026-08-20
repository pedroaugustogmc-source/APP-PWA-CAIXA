export type CondicaoItem = 'novo' | 'usado'

export type StatusItem = 'em_estoque' | 'reservado' | 'vendido' | 'perdido_danificado'

export type CategoriaDespesaTipo = 'marketing' | 'embalagem_geral' | 'transporte' | 'taxas' | 'outros'

export interface Categoria {
  id: string
  user_id: string
  nome: string
  created_at: string
  updated_at: string
}

export interface Fornecedor {
  id: string
  user_id: string
  nome: string
  contato: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Plataforma {
  id: string
  user_id: string
  nome: string
  /** Fração de 0 a 1 (ex.: 0.12 = 12%), aplicada sobre o preço de venda. */
  taxa_padrao_pct: number
  created_at: string
  updated_at: string
}

export interface LoteCompra {
  id: string
  user_id: string
  data_compra: string
  fornecedor_id: string | null
  categoria_id: string | null
  quantidade_comprada: number
  custo_produto: number
  custo_frete: number
  custo_extra: number
  cotacao_dolar: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  user_id: string
  lote_id: string
  identificador: string | null
  condicao: CondicaoItem
  status: StatusItem
  data_venda: string | null
  preco_venda: number | null
  plataforma_id: string | null
  /** Fração de 0 a 1; puxa o padrão da plataforma na venda, mas é editável. */
  taxa_plataforma_pct: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface DespesaGeral {
  id: string
  user_id: string
  data: string
  categoria_despesa: CategoriaDespesaTipo
  descricao: string | null
  valor: number
  created_at: string
  updated_at: string
}

export interface Configuracoes {
  id: string
  user_id: string
  margem_alvo_pct: number
  meta_mensal_lucro: number
  dias_estoque_parado_alerta: number
  created_at: string
  updated_at: string
}

/** Lote com os campos calculados da especificação (custo_total_lote, custo_unitario). */
export interface LoteCalculado extends LoteCompra {
  custo_total_lote: number
  custo_unitario: number
  fornecedor: Fornecedor | null
  categoria: Categoria | null
  quantidade_em_estoque: number
  quantidade_vendida: number
}

/** Item com todos os campos "(calc)" da especificação resolvidos. */
export interface ItemCalculado extends Item {
  custo_unitario: number
  taxa_plataforma_valor: number | null
  lucro_liquido: number | null
  margem_pct: number | null
  roi_pct: number | null
  dias_em_estoque: number | null
  preco_minimo: number | null
  preco_sugerido: number | null
  lote: LoteCompra
  plataforma: Plataforma | null
}
