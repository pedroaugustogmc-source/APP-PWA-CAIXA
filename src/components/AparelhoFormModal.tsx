import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { IconPlus } from './icons'
import { todayISO } from '../lib/calculations'
import { formatBRL } from '../lib/format'
import { imeiValido } from '../lib/luhn'
import type { Aparelho, Categoria, CondicaoAparelho, CustoExtra, Fornecedor } from '../types/domain'
import type { AparelhoInput } from '../hooks/useAparelhos'
import type { FornecedorInput } from '../hooks/useFornecedores'

interface Props {
  categorias: Categoria[]
  fornecedores: Fornecedor[]
  aparelhoInicial?: Aparelho | null
  onClose: () => void
  onSubmit: (
    input: AparelhoInput,
    categoria: Categoria | null,
    fornecedor: Fornecedor | null,
  ) => Promise<{ error: string | null }>
  onCriarCategoria: (nome: string) => Promise<{ error: string | null; categoria?: Categoria }>
  onCriarFornecedor: (input: FornecedorInput) => Promise<{ error: string | null; fornecedor?: Fornecedor }>
}

const CONDICAO_LABELS: Record<CondicaoAparelho, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  vitrine: 'Vitrine',
  defeito: 'Com defeito',
}

export function AparelhoFormModal({
  categorias,
  fornecedores,
  aparelhoInicial,
  onClose,
  onSubmit,
  onCriarCategoria,
  onCriarFornecedor,
}: Props) {
  const [nome, setNome] = useState(aparelhoInicial?.nome ?? '')
  const [modelo, setModelo] = useState(aparelhoInicial?.modelo ?? '')
  const [cor, setCor] = useState(aparelhoInicial?.cor ?? '')
  const [capacidadeGb, setCapacidadeGb] = useState(aparelhoInicial?.capacidade_gb ? String(aparelhoInicial.capacidade_gb) : '')
  const [bateriaSaude, setBateriaSaude] = useState(
    aparelhoInicial?.bateria_saude != null ? String(aparelhoInicial.bateria_saude) : '',
  )
  const [imei, setImei] = useState(aparelhoInicial?.imei ?? '')
  const [imei2, setImei2] = useState(aparelhoInicial?.imei2 ?? '')
  const [categoriaId, setCategoriaId] = useState(aparelhoInicial?.categoria_id ?? '')
  const [fornecedorId, setFornecedorId] = useState(aparelhoInicial?.fornecedor_id ?? '')
  const [condicao, setCondicao] = useState<CondicaoAparelho>(aparelhoInicial?.condicao ?? 'novo')
  const [dataCompra, setDataCompra] = useState(aparelhoInicial?.data_compra ?? todayISO())
  const [custoCompra, setCustoCompra] = useState(aparelhoInicial?.custo_compra ?? 0)
  const [custosExtras, setCustosExtras] = useState<CustoExtra[]>(aparelhoInicial?.custos_extras ?? [])
  const [diasPlanejados, setDiasPlanejados] = useState(
    aparelhoInicial?.dias_planejados ? String(aparelhoInicial.dias_planejados) : '',
  )
  const [observacoes, setObservacoes] = useState(aparelhoInicial?.observacoes ?? '')
  const [precoSugerido, setPrecoSugerido] = useState(
    aparelhoInicial?.preco_sugerido != null ? String(aparelhoInicial.preco_sugerido) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [criandoCategoria, setCriandoCategoria] = useState(categorias.length === 0)
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('')
  const [criandoCategoriaSubmitting, setCriandoCategoriaSubmitting] = useState(false)

  const [criandoFornecedor, setCriandoFornecedor] = useState(false)
  const [novoFornecedorNome, setNovoFornecedorNome] = useState('')
  const [criandoFornecedorSubmitting, setCriandoFornecedorSubmitting] = useState(false)

  const custoTotal = custoCompra + custosExtras.reduce((acc, c) => acc + c.valor, 0)
  const imeiPreenchido = imei.trim().length > 0
  const imeiOk = !imeiPreenchido || imeiValido(imei.trim())
  const imei2Preenchido = imei2.trim().length > 0
  const imei2Ok = !imei2Preenchido || imeiValido(imei2.trim())

  async function handleCriarCategoria() {
    if (!novaCategoriaNome.trim()) return
    setCriandoCategoriaSubmitting(true)
    setError(null)
    const { error, categoria } = await onCriarCategoria(novaCategoriaNome.trim())
    setCriandoCategoriaSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (categoria) setCategoriaId(categoria.id)
    setNovaCategoriaNome('')
    setCriandoCategoria(false)
  }

  async function handleCriarFornecedor() {
    if (!novoFornecedorNome.trim()) return
    setCriandoFornecedorSubmitting(true)
    setError(null)
    const { error, fornecedor } = await onCriarFornecedor({ nome: novoFornecedorNome.trim() })
    setCriandoFornecedorSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (fornecedor) setFornecedorId(fornecedor.id)
    setNovoFornecedorNome('')
    setCriandoFornecedor(false)
  }

  function adicionarCustoExtra() {
    setCustosExtras([...custosExtras, { label: '', valor: 0 }])
  }

  function atualizarCustoExtra(index: number, campo: 'label' | 'valor', valor: string) {
    setCustosExtras(
      custosExtras.map((c, i) => (i === index ? { ...c, [campo]: campo === 'valor' ? Number(valor) : valor } : c)),
    )
  }

  function removerCustoExtra(index: number) {
    setCustosExtras(custosExtras.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Dê um nome pro aparelho.')
      return
    }
    if (!modelo.trim()) {
      setError('Informe o modelo.')
      return
    }
    if (!imeiOk) {
      setError('IMEI inválido — confira os 15 dígitos.')
      return
    }
    if (!imei2Ok) {
      setError('IMEI 2 inválido — confira os 15 dígitos.')
      return
    }
    setSubmitting(true)
    setError(null)

    const input: AparelhoInput = {
      nome: nome.trim(),
      categoria_id: categoriaId || null,
      fornecedor_id: fornecedorId || null,
      identificador: null,
      modelo: modelo.trim(),
      cor: cor.trim() || null,
      capacidade_gb: capacidadeGb ? Number(capacidadeGb) : null,
      bateria_saude: bateriaSaude ? Number(bateriaSaude) : null,
      imei: imeiPreenchido ? imei.trim() : '',
      imei2: imei2Preenchido ? imei2.trim() : null,
      condicao,
      data_compra: dataCompra,
      custo_compra: custoCompra,
      custos_extras: custosExtras.filter((c) => c.label.trim() !== ''),
      dias_planejados: diasPlanejados ? Number(diasPlanejados) : null,
      observacoes: observacoes || null,
      preco_sugerido: precoSugerido ? Number(precoSugerido) : null,
    }

    const categoria = categorias.find((c) => c.id === categoriaId) ?? null
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId) ?? null

    const { error } = await onSubmit(input, categoria, fornecedor)
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={aparelhoInicial ? 'Editar aparelho' : 'Novo aparelho'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Nome (como aparece no estoque)">
          <input
            type="text"
            required
            autoFocus
            placeholder="Ex.: iPhone 13 128GB"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Modelo">
            <input
              type="text"
              required
              placeholder="Ex.: iPhone 13"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Cor">
            <input type="text" placeholder="Opcional" value={cor} onChange={(e) => setCor(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Capacidade (GB)">
            <input
              type="number"
              min={1}
              step={1}
              placeholder="Opcional"
              value={capacidadeGb}
              onChange={(e) => setCapacidadeGb(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Saúde da bateria (%)">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              placeholder="Opcional"
              value={bateriaSaude}
              onChange={(e) => setBateriaSaude(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="IMEI">
          <input
            type="text"
            inputMode="numeric"
            placeholder="15 dígitos"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            className={`${inputClass} ${!imeiOk ? 'border-loss focus:border-loss focus:ring-loss/20' : ''}`}
          />
        </Field>
        {!imeiOk && <p className="-mt-2 text-xs text-loss">IMEI inválido — confira os 15 dígitos.</p>}

        <Field label="IMEI 2 (dual chip)">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Opcional"
            value={imei2}
            onChange={(e) => setImei2(e.target.value)}
            className={`${inputClass} ${!imei2Ok ? 'border-loss focus:border-loss focus:ring-loss/20' : ''}`}
          />
        </Field>
        {!imei2Ok && <p className="-mt-2 text-xs text-loss">IMEI 2 inválido — confira os 15 dígitos.</p>}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            {categorias.length > 0 && (
              <button
                type="button"
                onClick={() => setCriandoCategoria((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {criandoCategoria ? (
                  'cancelar'
                ) : (
                  <>
                    <IconPlus className="h-3.5 w-3.5" /> nova
                  </>
                )}
              </button>
            )}
          </div>

          {criandoCategoria ? (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Ex.: Smartphones"
                value={novaCategoriaNome}
                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                className={inputClass}
              />
              <Button type="button" variant="primary" size="sm" onClick={handleCriarCategoria} disabled={criandoCategoriaSubmitting}>
                Salvar
              </Button>
            </div>
          ) : (
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputClass}>
              <option value="">Nenhuma</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Fornecedor</span>
            {fornecedores.length > 0 && (
              <button
                type="button"
                onClick={() => setCriandoFornecedor((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {criandoFornecedor ? (
                  'cancelar'
                ) : (
                  <>
                    <IconPlus className="h-3.5 w-3.5" /> novo
                  </>
                )}
              </button>
            )}
          </div>

          {criandoFornecedor || fornecedores.length === 0 ? (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus={fornecedores.length > 0}
                placeholder="Ex.: Distribuidora ABC"
                value={novoFornecedorNome}
                onChange={(e) => setNovoFornecedorNome(e.target.value)}
                className={inputClass}
              />
              <Button type="button" variant="primary" size="sm" onClick={handleCriarFornecedor} disabled={criandoFornecedorSubmitting}>
                Salvar
              </Button>
            </div>
          ) : (
            <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={inputClass}>
              <option value="">Nenhum</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <Field label="Condição">
          <select value={condicao} onChange={(e) => setCondicao(e.target.value as CondicaoAparelho)} className={inputClass}>
            {Object.entries(CONDICAO_LABELS).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Data da compra">
            <input type="date" required value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Custo de compra (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={custoCompra}
              onChange={(e) => setCustoCompra(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Custos extras</span>
            <button
              type="button"
              onClick={adicionarCustoExtra}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              <IconPlus className="h-3.5 w-3.5" /> adicionar
            </button>
          </div>
          {custosExtras.length === 0 && (
            <p className="text-xs text-slate-400">Frete, embalagem, taxas — o que mais custou pra ter esse aparelho.</p>
          )}
          <div className="space-y-2">
            {custosExtras.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex.: Frete"
                  value={c.label}
                  onChange={(e) => atualizarCustoExtra(i, 'label', e.target.value)}
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  placeholder="R$"
                  value={c.valor}
                  onChange={(e) => atualizarCustoExtra(i, 'valor', e.target.value)}
                  className={`${inputClass} w-24! shrink-0`}
                />
                <button
                  type="button"
                  onClick={() => removerCustoExtra(i)}
                  className="shrink-0 self-center rounded-md p-1.5 text-lg leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-loss"
                  aria-label="Remover custo extra"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Quantos dias você quer ficar com ele até vender">
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Opcional"
            value={diasPlanejados}
            onChange={(e) => setDiasPlanejados(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} rows={2} />
        </Field>

        <Field label="Preço no catálogo público (R$)">
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            placeholder="Deixe vazio pra não anunciar"
            value={precoSugerido}
            onChange={(e) => setPrecoSugerido(e.target.value)}
            className={inputClass}
          />
        </Field>
        <p className="-mt-2 text-xs text-slate-400">
          Preenchido = este aparelho aparece no seu link de vitrine, visível sem login. Vazio = fica só no seu estoque interno.
        </p>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          <span>Custo total do aparelho</span>
          <strong className="tabular-nums text-slate-900">{formatBRL(custoTotal)}</strong>
        </div>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : aparelhoInicial ? 'Salvar alterações' : 'Salvar aparelho'}
        </Button>
      </form>
    </Modal>
  )
}
