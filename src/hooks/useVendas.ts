import { todayISO } from '../lib/calculations'
import { toMoney, type MoneyInput } from '../lib/money'
import { supabase } from '../lib/supabase'
import type {
  Aparelho,
  Acessorio,
  CondicaoAparelho,
  FormaPagamento,
  Venda,
  VendaCompleta,
  VendaItem,
  VendaPagamento,
  VendaTradeIn,
} from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

type VendaItemRow = VendaItem & { aparelho: Aparelho | null; acessorio: Acessorio | null }
type VendaTradeInRow = VendaTradeIn & { aparelho_recebido: Aparelho | null }

type VendaRow = Venda & {
  itens: VendaItemRow[]
  pagamentos: VendaPagamento[]
  // PostgREST detecta a relação 1:1 pelo unique(venda_id) de 0018 e devolve
  // objeto único — mas normaliza pra array defensivamente (`normalizarTradeIn`).
  trade_in: VendaTradeInRow | VendaTradeInRow[] | null
}

function normalizarTradeIn(tradeIn: VendaRow['trade_in']): VendaTradeInRow | null {
  if (Array.isArray(tradeIn)) return tradeIn[0] ?? null
  return tradeIn
}

export interface NovaVendaItemInput {
  aparelhoId?: string
  acessorioId?: string
  quantidade: number
  precoUnitario: MoneyInput
}

export interface NovaVendaPagamentoInput {
  forma: FormaPagamento
  valor: MoneyInput
  parcelas?: number
  taxaPct?: MoneyInput
}

export interface NovaVendaTradeInInput {
  valorAvaliacao: MoneyInput
  aparelhoRecebido: {
    nome: string
    modelo: string
    cor?: string | null
    capacidadeGb?: number | null
    bateriaSaude?: number | null
    imei: string
    imei2?: string | null
    categoriaId?: string | null
    condicao: CondicaoAparelho
  }
}

export interface NovaVendaInput {
  clienteNome?: string | null
  clienteContato?: string | null
  observacoes?: string | null
  dataVenda?: string
  comissaoVendedorPct?: MoneyInput | null
  comissaoVendedorValor?: MoneyInput
  itens: NovaVendaItemInput[]
  pagamentos: NovaVendaPagamentoInput[]
  tradeIn?: NovaVendaTradeInInput | null
}

/**
 * Histórico de vendas (leitura) + `concluirVenda` (escrita via RPC atômico
 * `concluir_venda`, ver supabase/migrations/0019). Venda nunca é um insert
 * direto nas tabelas — sempre passa pelo RPC, que é quem garante a
 * atomicidade cabeçalho+itens+pagamentos+trade-in e a trava de concorrência
 * no IMEI (ver plano da Fase 1).
 */
export function useVendas() {
  const { data, loading, error, refetch } = useSupabaseList<VendaRow>(async () =>
    supabase
      .from('vendas')
      .select(
        '*, itens:venda_itens(*, aparelho:aparelhos(*), acessorio:acessorios(*)), pagamentos:venda_pagamentos(*), trade_in:venda_trade_ins(*, aparelho_recebido:aparelhos(*))',
      )
      .order('data_venda', { ascending: false })
      .order('created_at', { ascending: false }),
  )

  const vendas: VendaCompleta[] = data.map(({ trade_in, ...venda }) => ({
    ...venda,
    tradeIn: normalizarTradeIn(trade_in),
  }))

  async function concluirVenda(input: NovaVendaInput) {
    const payload = {
      cliente_nome: input.clienteNome ?? null,
      cliente_contato: input.clienteContato ?? null,
      observacoes: input.observacoes ?? null,
      data_venda: input.dataVenda ?? todayISO(),
      comissao_vendedor_pct:
        input.comissaoVendedorPct != null ? toMoney(input.comissaoVendedorPct).toFixed(4) : null,
      comissao_vendedor_valor: toMoney(input.comissaoVendedorValor ?? 0).toFixed(2),
      itens: input.itens.map((item) => ({
        aparelho_id: item.aparelhoId ?? null,
        acessorio_id: item.acessorioId ?? null,
        quantidade: item.quantidade,
        preco_unitario: toMoney(item.precoUnitario).toFixed(2),
      })),
      pagamentos: input.pagamentos.map((pagamento) => ({
        forma: pagamento.forma,
        valor: toMoney(pagamento.valor).toFixed(2),
        parcelas: pagamento.parcelas ?? 1,
        taxa_pct: toMoney(pagamento.taxaPct ?? 0).toFixed(4),
      })),
      trade_in: input.tradeIn
        ? {
            valor_avaliacao: toMoney(input.tradeIn.valorAvaliacao).toFixed(2),
            aparelho_recebido: {
              nome: input.tradeIn.aparelhoRecebido.nome,
              modelo: input.tradeIn.aparelhoRecebido.modelo,
              cor: input.tradeIn.aparelhoRecebido.cor ?? null,
              capacidade_gb: input.tradeIn.aparelhoRecebido.capacidadeGb ?? null,
              bateria_saude: input.tradeIn.aparelhoRecebido.bateriaSaude ?? null,
              imei: input.tradeIn.aparelhoRecebido.imei,
              imei2: input.tradeIn.aparelhoRecebido.imei2 ?? null,
              categoria_id: input.tradeIn.aparelhoRecebido.categoriaId ?? null,
              condicao: input.tradeIn.aparelhoRecebido.condicao,
            },
          }
        : null,
    }

    const { data, error } = await supabase.rpc('phoneitz_concluir_venda', { p_venda: payload })
    if (!error) await refetch()
    return { error: error?.message ?? null, vendaId: (data as string | null) ?? undefined }
  }

  return { vendas, loading, error, concluirVenda, refetch }
}
