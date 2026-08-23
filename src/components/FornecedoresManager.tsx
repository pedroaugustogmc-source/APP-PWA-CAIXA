import { useState, type FormEvent } from 'react'
import { useFornecedores } from '../hooks/useFornecedores'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { Card } from './Card'

export function FornecedoresManager() {
  const { fornecedores, criar, remover, error } = useFornecedores()
  const [nome, setNome] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const { error } = await criar({ nome: nome.trim() })
    if (!error) setNome('')
  }

  return (
    <Card as="section">
      <h3 className="mb-3 font-semibold text-slate-900">Fornecedores</h3>
      <ul className="mb-3 flex flex-wrap gap-2">
        {fornecedores.map((f) => (
          <li key={f.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pr-2 pl-3 text-sm text-slate-700">
            {f.nome}
            <button
              type="button"
              onClick={() => remover(f.id)}
              className="text-slate-400 transition-colors hover:text-loss"
              aria-label={`Remover ${f.nome}`}
            >
              ×
            </button>
          </li>
        ))}
        {fornecedores.length === 0 && <li className="text-sm text-slate-400">Nenhum fornecedor ainda.</li>}
      </ul>
      {error && <ErrorMessage message={error} />}
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
