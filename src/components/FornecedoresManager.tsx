import { useState, type FormEvent } from 'react'
import { useFornecedores } from '../hooks/useFornecedores'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { Card, CardLabel } from './Card'

export function FornecedoresManager() {
  const { fornecedores, criar, remover, error } = useFornecedores()
  const [nome, setNome] = useState('')
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const { error } = await criar({ nome: nome.trim() })
    if (!error) setNome('')
  }

  async function handleRemover(id: string) {
    setErroExclusao(null)
    const { error } = await remover(id)
    if (error) setErroExclusao(error)
  }

  return (
    <Card as="section">
      <CardLabel>Fornecedores</CardLabel>
      <ul className="mb-3 flex flex-wrap gap-2">
        {fornecedores.map((f) => (
          <li key={f.id} className="flex items-center gap-0.5 rounded-full bg-slate-100 py-1 pr-1 pl-3 text-sm text-slate-700">
            {f.nome}
            <button
              type="button"
              onClick={() => handleRemover(f.id)}
              className="rounded-full p-1 text-base leading-none text-slate-400 transition-colors hover:bg-slate-200 hover:text-loss"
              aria-label={`Remover ${f.nome}`}
            >
              ×
            </button>
          </li>
        ))}
        {fornecedores.length === 0 && <li className="text-sm text-slate-400">Nenhum fornecedor ainda.</li>}
      </ul>
      {error && <ErrorMessage message={error} />}
      {erroExclusao && <ErrorMessage message={erroExclusao} />}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Nome do fornecedor"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
        />
        <Button type="submit" variant="primary" className="shrink-0">
          Adicionar
        </Button>
      </form>
    </Card>
  )
}
