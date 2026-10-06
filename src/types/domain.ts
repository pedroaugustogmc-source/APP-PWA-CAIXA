export interface Loja {
  id: string
  user_id: string
  nome: string
  created_at: string
  updated_at: string
}

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

/** Um custo extra associado ao aparelho (frete, embalagem, taxa etc.). */
export interface CustoExtra {
  label: string
  valor: number
}

export type CondicaoAparelho = 'novo' | 'seminovo' | 'vitrine' | 'defeito'

export type StatusAparelho = 'em_estoque' | 'reservado' | 'vendido' | 'devolvido' | 'baixado' | 'perdido_danificado'

/**
 * 1 linha = 1 unidade física (serializado por IMEI). Dados de venda NÃO
 * vivem mais aqui — ver Venda/VendaItem/VendaPagamento/VendaTradeIn.
 */
export interface Aparelho {
  id: string
  user_id: string
  loja_id: string
  nome: string
  categoria_id: string | null
  fornecedor_id: string | null
  identificador: string | null
  modelo: string
  cor: string | null
  capacidade_gb: number | null
  bateria_saude: number | null
  /** Nulo só em linha legada pré-Fase 1 — todo aparelho novo exige IMEI (ver AparelhoInput). */
  imei: string | null
  imei2: string | null
  condicao: CondicaoAparelho
  status: StatusAparelho
  data_compra: string
  custo_compra: number
  custos_extras: CustoExtra[]
  dias_planejados: number | null
  observacoes: string | null
  /** Nulo = não aparece no catálogo público. Preenchido = preço vitrine, visível sem login. */
  preco_sugerido: number | null
  created_at: string
  updated_at: string
  categoria?: Categoria | null
  fornecedor?: Fornecedor | null
}

/** Timeline append-only de mudanças de status de um aparelho — nunca editável/apagável pelo client. */
export interface AparelhoEvento {
  id: string
  loja_id: string
  user_id: string
  aparelho_id: string
  status_anterior: StatusAparelho | null
  status_novo: StatusAparelho
  motivo: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/** Produto fungível (não serializado) — capa, película, carregador, fone. */
export interface Acessorio {
  id: string
  user_id: string
  loja_id: string
  sku: string
  nome: string
  categoria_id: string | null
  fornecedor_id: string | null
  custo_unitario: number
  preco_venda: number
  quantidade_estoque: number
  estoque_minimo: number
  observacoes: string | null
  created_at: string
  updated_at: string
  categoria?: Categoria | null
  fornecedor?: Fornecedor | null
}

export type StatusVenda = 'concluida' | 'cancelada'

export interface Venda {
  id: string
  user_id: string
  loja_id: string
  vendedor_user_id: string
  cliente_id: string | null
  cliente_nome: string | null
  cliente_contato: string | null
  status: StatusVenda
  comissao_vendedor_pct: number | null
  comissao_vendedor_valor: number
  observacoes: string | null
  data_venda: string
  created_at: string
  updated_at: string
}

export interface VendaItem {
  id: string
  venda_id: string
  user_id: string
  loja_id: string
  /** Exatamente um de aparelho_id/acessorio_id é preenchido (ver CHECK venda_itens_um_tipo). */
  aparelho_id: string | null
  acessorio_id: string | null
  quantidade: number
  preco_unitario: number
  /** Custo capturado no momento da venda — nunca recalculado depois. */
  custo_unitario_snapshot: number
  created_at: string
  aparelho?: Aparelho | null
  acessorio?: Acessorio | null
}

/** 'outro' cobre venda histórica migrada do Catira Control, sem forma de pagamento original registrada. */
export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'boleto' | 'financiamento' | 'outro'

export interface VendaPagamento {
  id: string
  venda_id: string
  user_id: string
  loja_id: string
  forma: FormaPagamento
  valor: number
  parcelas: number
  taxa_pct: number
  taxa_valor: number
  created_at: string
}

export interface VendaTradeIn {
  id: string
  venda_id: string
  user_id: string
  loja_id: string
  aparelho_recebido_id: string
  valor_avaliacao: number
  created_at: string
  aparelho_recebido?: Aparelho | null
}

/** Aparelho completo com itens/pagamentos/trade-in resolvidos — usado na tela de detalhe da venda. */
export interface VendaCompleta extends Venda {
  itens: VendaItem[]
  pagamentos: VendaPagamento[]
  tradeIn: VendaTradeIn | null
}

/** Depreciação por modelo/condição, editável no banco — alimenta a sugestão de valor de trade-in em vendas. */
export interface DepreciacaoModelo {
  id: string
  user_id: string
  loja_id: string
  modelo: string
  condicao: CondicaoAparelho
  valor_base: number
  depreciacao_mensal_pct: number
  vigente_desde: string
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Configuracoes {
  id: string
  user_id: string
  loja_id: string
  meta_mensal_lucro: number
  meta_semanal_lucro: number
  dias_estoque_parado_alerta: number
  comissao_vendedor_pct_padrao: number
  cashback_pct_padrao: number
  created_at: string
  updated_at: string
}

/** 'atrasada' nunca é armazenado — é derivado (pendente + vencimento no passado), ver lib/financeiro.ts. */
export type StatusConta = 'pendente' | 'quitada' | 'cancelada'

export interface ContaPagar {
  id: string
  user_id: string
  loja_id: string
  fornecedor_id: string | null
  descricao: string
  categoria: string | null
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: StatusConta
  recorrente: boolean
  observacoes: string | null
  created_at: string
  updated_at: string
  fornecedor?: Fornecedor | null
}

export interface ContaReceber {
  id: string
  user_id: string
  loja_id: string
  venda_id: string | null
  cliente_nome: string | null
  cliente_contato: string | null
  descricao: string
  valor: number
  data_vencimento: string
  data_recebimento: string | null
  status: StatusConta
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type TipoLancamentoCashback = 'credito' | 'resgate'

/** Ledger append-only — saldo do cliente é sempre SUM(credito) - SUM(resgate), nunca uma coluna cacheada. */
export interface CashbackLancamento {
  id: string
  user_id: string
  loja_id: string
  cliente_contato: string
  venda_id: string | null
  tipo: TipoLancamentoCashback
  valor: number
  observacoes: string | null
  created_at: string
}

/** Fase 4: cadastro formal de clientes. Venda.cliente_nome/cliente_contato continuam sendo texto livre independente disto. */
export interface Cliente {
  id: string
  user_id: string
  loja_id: string
  nome: string
  contato: string | null
  cpf: string | null
  email: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type PapelMembro = 'dono' | 'vendedor'

/** Dono sempre vem de lojas.user_id (nunca muda) — loja_membros é aditivo, abre acesso pra quem aceitar um convite. */
export interface LojaMembro {
  id: string
  loja_id: string
  user_id: string | null
  papel: PapelMembro
  codigo_convite: string | null
  convidado_por: string | null
  convidado_em: string
  aceito_em: string | null
  created_at: string
}

/** Linha da view `catalogo_publico` — só os campos de vitrine, sem IMEI/custo/user_id. Lida sem login. */
export interface CatalogoPublicoItem {
  loja_id: string
  aparelho_id: string
  nome: string
  modelo: string
  cor: string | null
  capacidade_gb: number | null
  condicao: CondicaoAparelho
  bateria_saude: number | null
  preco_sugerido: number | null
  loja_nome: string
}

export type OperacaoAuditoria = 'INSERT' | 'UPDATE' | 'DELETE'

/** Rastro bruto de toda mutação em tabela do PHONEITZ — gravado só pelo trigger `registrar_auditoria()`, nunca pela aplicação. */
export interface Auditoria {
  id: string
  loja_id: string
  user_id: string
  tabela: string
  registro_id: string
  operacao: OperacaoAuditoria
  dados_antes: Record<string, unknown> | null
  dados_depois: Record<string, unknown> | null
  created_at: string
}
