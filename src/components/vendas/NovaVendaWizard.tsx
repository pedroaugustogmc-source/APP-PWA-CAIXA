import { useMemo, useState, type FormEvent } from 'react'
import { Card, CardLabel } from '../Card'
import { Field, inputClass } from '../Field'
import { Button } from '../Button'
import { ErrorMessage } from '../ErrorMessage'
import { IconPlus } from '../icons'
import { formatBRL } from '../../lib/format'
import { somar, toMoney } from '../../lib/money'
import { calcularMargemVenda, custoTotalAparelho, todayISO, valorAvaliacaoDepreciacaoLinear } from '../../lib/calculations'
import { imeiValido } from '../../lib/luhn'
import type { Acessorio, Aparelho, Categoria, CondicaoAparelho, DepreciacaoModelo, FormaPagamento } from '../../types/domain'
import type { NovaVendaInput } from '../../hooks/useVendas'

const CONDICAO_LABELS: Record<CondicaoAparelho, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  vitrine: 'Vitrine',
  defeito: 'Com defeito',
}

// 'outro' não entra aqui — é reservado pra venda histórica migrada do Catira
// Control (ver FormaPagamento em types/domain.ts), nunca selecionável numa venda nova.
const FORMA_PAGAMENTO_OPTIONS: { value: FormaPagamento; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_debito', label: 'Cartão de débito' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'financiamento', label: 'Financiamento' },
]

interface ItemCarrinho {
  key: string
  aparelhoId?: string
  acessorioId?: string
  nome: string
  quantidade: number
  quantidadeDisponivel: number
  precoUnitario: number
  custoUnitario: number
}

interface PagamentoLinha {
  id: string
  forma: FormaPagamento
  valor: number
  parcelas: number
  taxaPct: number
}

interface Props {
  aparelhosDisponiveis: Aparelho[]
  acessoriosDisponiveis: Acessorio[]
  categorias: Categoria[]
  depreciacoes: DepreciacaoModelo[]
  comissaoPctPadrao: number
  onConcluir: (input: NovaVendaInput) => Promise<{ error: string | null; vendaId?: string }>
  onSucesso: () => void
}

export function NovaVendaWizard({
  aparelhosDisponiveis,
  acessoriosDisponiveis,
  categorias,
  depreciacoes,
  comissaoPctPadrao,
  onConcluir,
  onSucesso,
}: Props) {
  const [clienteNome, setClienteNome] = useState('')
  const [clienteContato, setClienteContato] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [dataVenda, setDataVenda] = useState(todayISO())
  const [comissaoPct, setComissaoPct] = useState(comissaoPctPadrao * 100)

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [pagamentos, setPagamentos] = useState<PagamentoLinha[]>([])

  const [tradeInAtivo, setTradeInAtivo] = useState(false)
  const [tradeInNome, setTradeInNome] = useState('')
  const [tradeInModelo, setTradeInModelo] = useState('')
  const [tradeInCor, setTradeInCor] = useState('')
  const [tradeInCapacidadeGb, setTradeInCapacidadeGb] = useState('')
  const [tradeInBateriaSaude, setTradeInBateriaSaude] = useState('')
  const [tradeInImei, setTradeInImei] = useState('')
  const [tradeInImei2, setTradeInImei2] = useState('')
  const [tradeInCategoriaId, setTradeInCategoriaId] = useState('')
  const [tradeInCondicao, setTradeInCondicao] = useState<CondicaoAparelho>('seminovo')
  const [tradeInMesesUso, setTradeInMesesUso] = useState(0)
  const [tradeInValorAvaliacao, setTradeInValorAvaliacao] = useState(0)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const idsNoCarrinho = new Set(carrinho.filter((i) => i.aparelhoId).map((i) => i.aparelhoId))
  const aparelhosParaAdicionar = aparelhosDisponiveis.filter((a) => !idsNoCarrinho.has(a.id))

  function adicionarAparelho(aparelho: Aparelho) {
    setCarrinho((prev) => [
      ...prev,
      {
        key: `aparelho:${aparelho.id}`,
        aparelhoId: aparelho.id,
        nome: `${aparelho.nome} (IMEI ${aparelho.imei ?? 'não informado'})`,
        quantidade: 1,
        quantidadeDisponivel: 1,
        precoUnitario: 0,
        custoUnitario: custoTotalAparelho(aparelho).toNumber(),
      },
    ])
  }

  function adicionarAcessorio(acessorio: Acessorio) {
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.acessorioId === acessorio.id)
      if (existente) {
        return prev.map((i) =>
          i.acessorioId === acessorio.id ? { ...i, quantidade: Math.min(i.quantidade + 1, i.quantidadeDisponivel) } : i,
        )
      }
      return [
        ...prev,
        {
          key: `acessorio:${acessorio.id}`,
          acessorioId: acessorio.id,
          nome: acessorio.nome,
          quantidade: 1,
          quantidadeDisponivel: acessorio.quantidade_estoque,
          precoUnitario: acessorio.preco_venda,
          custoUnitario: acessorio.custo_unitario,
        },
      ]
    })
  }

  function alterarQuantidadeItem(key: string, quantidade: number) {
    setCarrinho((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantidade: Math.max(1, Math.min(quantidade, i.quantidadeDisponivel)) } : i)),
    )
  }

  function alterarPrecoItem(key: string, preco: number) {
    setCarrinho((prev) => prev.map((i) => (i.key === key ? { ...i, precoUnitario: preco } : i)))
  }

  function removerItem(key: string) {
    setCarrinho((prev) => prev.filter((i) => i.key !== key))
  }

  function adicionarPagamento() {
    setPagamentos((prev) => [...prev, { id: crypto.randomUUID(), forma: 'dinheiro', valor: 0, parcelas: 1, taxaPct: 0 }])
  }

  function atualizarPagamento(id: string, patch: Partial<PagamentoLinha>) {
    setPagamentos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removerPagamento(id: string) {
    setPagamentos((prev) => prev.filter((p) => p.id !== id))
  }

  const receitaTotal = useMemo(
    () => somar(carrinho.map((i) => toMoney(i.precoUnitario).times(i.quantidade))),
    [carrinho],
  )

  const tradeInValor = tradeInAtivo ? toMoney(tradeInValorAvaliacao) : toMoney(0)

  function restanteParaPagamento(pagamentoId: string) {
    const somaOutros = somar(pagamentos.filter((p) => p.id !== pagamentoId).map((p) => p.valor))
    const restante = receitaTotal.minus(somaOutros).minus(tradeInValor)
    return restante.isNegative() ? toMoney(0) : restante
  }

  const comissaoValor = useMemo(
    () => receitaTotal.times(comissaoPct).dividedBy(100).toDecimalPlaces(2),
    [receitaTotal, comissaoPct],
  )

  const margem = useMemo(
    () =>
      calcularMargemVenda({
        itens: carrinho.map((i) => ({ precoUnitario: i.precoUnitario, custoUnitario: i.custoUnitario, quantidade: i.quantidade })),
        pagamentos: pagamentos.map((p) => ({ valor: p.valor, taxaPct: toMoney(p.taxaPct).dividedBy(100) })),
        tradeIns: tradeInAtivo ? [{ valorAvaliacao: tradeInValorAvaliacao }] : [],
        comissaoVendedorValor: comissaoValor,
      }),
    [carrinho, pagamentos, tradeInAtivo, tradeInValorAvaliacao, comissaoValor],
  )

  const regraTradeIn = tradeInModelo
    ? depreciacoes.find((d) => d.modelo === tradeInModelo && d.condicao === tradeInCondicao)
    : undefined
  const valorSugeridoTradeIn = regraTradeIn
    ? valorAvaliacaoDepreciacaoLinear(regraTradeIn.valor_base, regraTradeIn.depreciacao_mensal_pct, tradeInMesesUso)
    : null

  const modelosComRegra = [...new Set(depreciacoes.map((d) => d.modelo))].sort()

  function validar(): string | null {
    if (carrinho.length === 0) return 'Adicione ao menos um item à venda.'
    if (carrinho.some((i) => i.precoUnitario <= 0)) return 'Informe o preço de venda de todos os itens.'
    if (tradeInAtivo) {
      if (!tradeInNome.trim()) return 'Informe o nome do aparelho recebido na troca.'
      if (!tradeInModelo.trim()) return 'Informe o modelo do aparelho recebido na troca.'
      if (!imeiValido(tradeInImei.trim())) return 'IMEI do aparelho recebido na troca é inválido — confira os 15 dígitos.'
      if (tradeInValorAvaliacao <= 0) return 'Informe o valor de avaliação do trade-in.'
    }
    if (!margem.bateComReceita) {
      return 'A soma dos pagamentos (+ trade-in, se houver) precisa bater exatamente com o total da venda.'
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const mensagem = validar()
    if (mensagem) {
      setError(mensagem)
      return
    }
    setSubmitting(true)
    setError(null)

    const { error } = await onConcluir({
      clienteNome: clienteNome.trim() || null,
      clienteContato: clienteContato.trim() || null,
      observacoes: observacoes.trim() || null,
      dataVenda,
      comissaoVendedorPct: comissaoPct / 100,
      comissaoVendedorValor: comissaoValor,
      itens: carrinho.map((i) => ({
        aparelhoId: i.aparelhoId,
        acessorioId: i.acessorioId,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
      })),
      pagamentos: pagamentos.map((p) => ({ forma: p.forma, valor: p.valor, parcelas: p.parcelas, taxaPct: p.taxaPct / 100 })),
      tradeIn: tradeInAtivo
        ? {
            valorAvaliacao: tradeInValorAvaliacao,
            aparelhoRecebido: {
              nome: tradeInNome.trim(),
              modelo: tradeInModelo.trim(),
              cor: tradeInCor.trim() || null,
              capacidadeGb: tradeInCapacidadeGb ? Number(tradeInCapacidadeGb) : null,
              bateriaSaude: tradeInBateriaSaude ? Number(tradeInBateriaSaude) : null,
              imei: tradeInImei.trim(),
              imei2: tradeInImei2.trim() || null,
              categoriaId: tradeInCategoriaId || null,
              condicao: tradeInCondicao,
            },
          }
        : null,
    })

    setSubmitting(false)
    if (error) setError(error)
    else onSucesso()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="space-y-3">
        <CardLabel>Cliente e data</CardLabel>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Nome do cliente">
            <input type="text" placeholder="Opcional" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Contato">
            <input type="text" placeholder="Opcional" value={clienteContato} onChange={(e) => setClienteContato(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Data da venda">
          <input type="date" required value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} rows={2} />
        </Field>
      </Card>

      <Card className="space-y-3">
        <CardLabel>Itens da venda</CardLabel>

        {carrinho.length > 0 && (
          <ul className="space-y-2">
            {carrinho.map((item) => (
              <li key={item.key} className="rounded-lg bg-slate-50 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-slate-800">{item.nome}</p>
                  <button
                    type="button"
                    onClick={() => removerItem(item.key)}
                    aria-label="Remover item"
                    className="shrink-0 rounded-md p-1 text-lg leading-none text-slate-400 transition-colors hover:bg-slate-200 hover:text-loss"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  {item.quantidadeDisponivel > 1 && (
                    <input
                      type="number"
                      min={1}
                      max={item.quantidadeDisponivel}
                      step={1}
                      value={item.quantidade}
                      onChange={(e) => alterarQuantidadeItem(item.key, Number(e.target.value))}
                      className={`${inputClass} w-16! shrink-0`}
                      aria-label="Quantidade"
                    />
                  )}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    placeholder="Preço unitário (R$)"
                    value={item.precoUnitario || ''}
                    onChange={(e) => alterarPrecoItem(item.key, Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500">Aparelhos em estoque</p>
          {aparelhosParaAdicionar.length === 0 && <p className="text-xs text-slate-400">Nenhum aparelho disponível.</p>}
          <div className="flex flex-wrap gap-1.5">
            {aparelhosParaAdicionar.map((aparelho) => (
              <button
                key={aparelho.id}
                type="button"
                onClick={() => adicionarAparelho(aparelho)}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                + {aparelho.nome}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500">Acessórios em estoque</p>
          {acessoriosDisponiveis.filter((a) => a.quantidade_estoque > 0).length === 0 && (
            <p className="text-xs text-slate-400">Nenhum acessório disponível.</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {acessoriosDisponiveis
              .filter((a) => a.quantidade_estoque > 0)
              .map((acessorio) => (
                <button
                  key={acessorio.id}
                  type="button"
                  onClick={() => adicionarAcessorio(acessorio)}
                  className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  + {acessorio.nome}
                </button>
              ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <CardLabel>Pagamentos</CardLabel>
          <button
            type="button"
            onClick={adicionarPagamento}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            <IconPlus className="h-3.5 w-3.5" /> adicionar
          </button>
        </div>

        {pagamentos.length === 0 && <p className="text-xs text-slate-400">Adicione ao menos uma forma de pagamento (ou use só trade-in).</p>}

        <div className="space-y-2.5">
          {pagamentos.map((p) => (
            <div key={p.id} className="rounded-lg bg-slate-50 p-2.5">
              <div className="grid grid-cols-2 gap-2">
                <select value={p.forma} onChange={(e) => atualizarPagamento(p.id, { forma: e.target.value as FormaPagamento })} className={inputClass}>
                  {FORMA_PAGAMENTO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    placeholder="Valor (R$)"
                    value={p.valor || ''}
                    onChange={(e) => atualizarPagamento(p.id, { valor: Number(e.target.value) })}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => atualizarPagamento(p.id, { valor: restanteParaPagamento(p.id).toNumber() })}
                    className="shrink-0 rounded-lg border border-slate-300 px-2 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-white"
                  >
                    restante
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Parcelas"
                  value={p.parcelas}
                  onChange={(e) => atualizarPagamento(p.id, { parcelas: Number(e.target.value) })}
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  inputMode="decimal"
                  placeholder="Taxa (%)"
                  value={p.taxaPct || ''}
                  onChange={(e) => atualizarPagamento(p.id, { taxaPct: Number(e.target.value) })}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removerPagamento(p.id)}
                  aria-label="Remover pagamento"
                  className="shrink-0 rounded-md p-1.5 text-lg leading-none text-slate-400 transition-colors hover:bg-slate-200 hover:text-loss"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Receber aparelho usado na troca (trade-in)</span>
          <input type="checkbox" checked={tradeInAtivo} onChange={(e) => setTradeInAtivo(e.target.checked)} className="h-5 w-5 accent-slate-900" />
        </label>

        {tradeInAtivo && (
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nome">
                <input type="text" value={tradeInNome} onChange={(e) => setTradeInNome(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Modelo">
                <input
                  type="text"
                  list="modelos-depreciacao"
                  value={tradeInModelo}
                  onChange={(e) => setTradeInModelo(e.target.value)}
                  className={inputClass}
                />
                <datalist id="modelos-depreciacao">
                  {modelosComRegra.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Cor">
                <input type="text" placeholder="Opcional" value={tradeInCor} onChange={(e) => setTradeInCor(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Capacidade (GB)">
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Opcional"
                  value={tradeInCapacidadeGb}
                  onChange={(e) => setTradeInCapacidadeGb(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="IMEI">
                <input type="text" inputMode="numeric" value={tradeInImei} onChange={(e) => setTradeInImei(e.target.value)} className={inputClass} />
              </Field>
              <Field label="IMEI 2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Opcional"
                  value={tradeInImei2}
                  onChange={(e) => setTradeInImei2(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Saúde da bateria (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Opcional"
                  value={tradeInBateriaSaude}
                  onChange={(e) => setTradeInBateriaSaude(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Categoria">
                <select value={tradeInCategoriaId} onChange={(e) => setTradeInCategoriaId(e.target.value)} className={inputClass}>
                  <option value="">Nenhuma</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Condição">
                <select value={tradeInCondicao} onChange={(e) => setTradeInCondicao(e.target.value as CondicaoAparelho)} className={inputClass}>
                  {Object.entries(CONDICAO_LABELS).map(([valor, label]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Meses de uso estimados">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={tradeInMesesUso}
                  onChange={(e) => setTradeInMesesUso(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>

            {valorSugeridoTradeIn && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">Sugestão pela regra de depreciação: {formatBRL(valorSugeridoTradeIn)}</span>
                <button
                  type="button"
                  onClick={() => setTradeInValorAvaliacao(valorSugeridoTradeIn.toNumber())}
                  className="shrink-0 text-xs font-semibold text-slate-700 underline"
                >
                  usar
                </button>
              </div>
            )}

            <Field label="Valor de avaliação do trade-in (R$)">
              <input
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={tradeInValorAvaliacao || ''}
                onChange={(e) => setTradeInValorAvaliacao(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <CardLabel>Comissão do vendedor</CardLabel>
        <Field label="Percentual sobre a receita (%)">
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            inputMode="decimal"
            value={comissaoPct || ''}
            onChange={(e) => setComissaoPct(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Valor da comissão</span>
          <strong className="tabular-nums text-slate-900">{formatBRL(comissaoValor)}</strong>
        </div>
      </Card>

      <Card className="space-y-2 bg-slate-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Receita total</span>
          <strong className="tabular-nums text-slate-900">{formatBRL(margem.receitaTotal)}</strong>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Custo total</span>
          <strong className="tabular-nums text-slate-900">{formatBRL(margem.custoTotal)}</strong>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Taxas de pagamento</span>
          <strong className="tabular-nums text-slate-900">{formatBRL(margem.taxasTotal)}</strong>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
          <span className="font-semibold text-slate-800">Margem da venda</span>
          <strong className={`tabular-nums ${margem.margemVenda.isNegative() ? 'text-loss' : 'text-profit'}`}>
            {formatBRL(margem.margemVenda)}
          </strong>
        </div>
        <div className={`flex items-center justify-between text-xs ${margem.bateComReceita ? 'text-slate-400' : 'text-loss font-medium'}`}>
          <span>Pagamentos + trade-in</span>
          <span className="tabular-nums">{formatBRL(margem.somaPagamentosETradeIns)}</span>
        </div>
        {!margem.bateComReceita && carrinho.length > 0 && (
          <p className="text-xs font-medium text-loss">
            Falta bater com a receita total ({formatBRL(margem.receitaTotal)}) pra poder confirmar a venda.
          </p>
        )}
      </Card>

      {error && <ErrorMessage message={error} />}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        {submitting ? 'Concluindo venda…' : 'Confirmar venda'}
      </Button>
    </form>
  )
}
