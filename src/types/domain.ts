export type CondicaoItem = 'novo' | 'usado'

export type StatusItem = 'em_estoque' | 'reservado' | 'vendido' | 'perdido_danificado'

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

/** Um custo extra associado ao item (frete, embalagem, taxa etc.). */
export interface CustoExtra {
  label: string
  valor: number
}

export interface Item {
  id: string
  user_id: string
  nome: string
  categoria_id: string | null
  fornecedor_id: string | null
  identificador: string | null
  condicao: CondicaoItem
  status: StatusItem
  data_compra: string
  custo_compra: number
  custos_extras: CustoExtra[]
  dias_planejados: number | null
  data_venda: string | null
  preco_venda: number | null
  plataforma_id: string | null
  /** Fração de 0 a 1; puxa o padrão da plataforma na venda, mas é editável. */
  taxa_plataforma_pct: number | null
  observacoes: string | null
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

/** Item com todos os campos calculados resolvidos. */
export interface ItemCalculado extends Item {
  custo_total: number
  taxa_plataforma_valor: number | null
  lucro_liquido: number | null
  margem_pct: number | null
  roi_pct: number | null
  dias_em_estoque: number | null
  preco_minimo: number | null
  preco_sugerido: number | null
  categoria: Categoria | null
  fornecedor: Fornecedor | null
  plataforma: Plataforma | null
}
