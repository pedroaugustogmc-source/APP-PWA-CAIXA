import { useState } from 'react'
import { calcularMargemVenda } from '../../lib/calculations'
import { formatBRL, formatDate } from '../../lib/format'
import { toMoney } from '../../lib/money'
import type { FormaPagamento, VendaCompleta } from '../../types/domain'
import { Button } from '../Button'
import { ErrorMessage } from '../ErrorMessage'

const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_debito: 'Cartão de débito',
  cartao_credito: 'Cartão de crédito',
  boleto: 'Boleto',
  financiamento: 'Financiamento',
  outro: 'Outro',
}

interface Props {
  venda: VendaCompleta
  onCancelar: (vendaId: string) => Promise<{ error: string | null }>
}

export function VendaResumoCard({ venda, onCancelar }: Props) {
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState<string | null>(null)

  async function handleCancelar() {
    if (!confirm('Cancelar esta venda? O(s) aparelho(s)/acessório(s) voltam pro estoque e o registro é apagado. Essa ação não pode ser desfeita.')) {
      return
    }
    setCancelando(true)
    setErroCancelar(null)
    const { error } = await onCancelar(venda.id)
    setCancelando(false)
    if (error) setErroCancelar(error)
  }

  const margem = calcularMargemVenda({
    itens: venda.itens.map((item) => ({
      precoUnitario: item.preco_unitario,
      custoUnitario: item.custo_unitario_snapshot,
      quantidade: item.quantidade,
    })),
    pagamentos: venda.pagamentos.map((p) => ({ valor: p.valor, taxaPct: p.taxa_pct })),
    tradeIns: venda.tradeIn ? [{ valorAvaliacao: venda.tradeIn.valor_avaliacao }] : [],
    comissaoVendedorValor: venda.comissao_vendedor_valor,
  })

  const margemPositiva = !margem.margemVenda.isNegative()

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{venda.cliente_nome || 'Cliente não informado'}</p>
          <p className="text-xs text-slate-500">{formatDate(venda.data_venda)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-400">Margem</p>
          <p className={`font-semibold tabular-nums ${margemPositiva ? 'text-profit' : 'text-loss'}`}>
            {formatBRL(margem.margemVenda)}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
        {venda.itens.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-slate-600">
            <span className="truncate">
              {item.quantidade > 1 ? `${item.quantidade}x ` : ''}
              {item.aparelho?.nome ?? item.acessorio?.nome ?? 'Item removido'}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatBRL(toMoney(item.preco_unitario).times(item.quantidade))}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        {venda.pagamentos.map((p) => (
          <span key={p.id} className="rounded-full bg-slate-100 px-2 py-0.5">
            {FORMA_PAGAMENTO_LABELS[p.forma]} · {formatBRL(p.valor)}
          </span>
        ))}
        {venda.tradeIn && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            Trade-in {venda.tradeIn.aparelho_recebido?.nome ?? ''} · {formatBRL(venda.tradeIn.valor_avaliacao)}
          </span>
        )}
      </div>

      {!margem.bateComReceita && (
        <p className="mt-2 text-xs font-medium text-loss">
          Atenção: pagamentos + trade-in não batem com o total da venda.
        </p>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <Button variant="danger" size="sm" onClick={handleCancelar} disabled={cancelando}>
          {cancelando ? 'Cancelando…' : 'Cancelar venda'}
        </Button>
        {erroCancelar && (
          <div className="mt-2">
            <ErrorMessage message={erroCancelar} />
          </div>
        )}
      </div>
    </li>
  )
}
