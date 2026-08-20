import { useState, type FormEvent } from 'react'
import { useFornecedores } from '../hooks/useFornecedores'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'

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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-slate-900">Fornecedores</h3>
      <ul className="mb-3 flex flex-wrap gap-2">
        {fornecedores.map((f) => (
          <li key={f.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm">
            {f.nome}
            <button type="button" onClick={() => remover(f.id)} className="text-slate-400 hover:text-loss" aria-label={`Remover ${f.nome}`}>
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
        <button type="submit" className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          Adicionar
        </button>
      </form>
    </section>
  )
}
