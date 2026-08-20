import { useState, type FormEvent } from 'react'
import { useCategorias } from '../hooks/useCategorias'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'

export function CategoriasManager() {
  const { categorias, criar, remover, error } = useCategorias()
  const [nome, setNome] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const { error } = await criar(nome.trim())
    if (!error) setNome('')
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-slate-900">Categorias</h3>
      <ul className="mb-3 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm">
            {c.nome}
            <button type="button" onClick={() => remover(c.id)} className="text-slate-400 hover:text-loss" aria-label={`Remover ${c.nome}`}>
              ×
            </button>
          </li>
        ))}
        {categorias.length === 0 && <li className="text-sm text-slate-400">Nenhuma categoria ainda.</li>}
      </ul>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Ex.: Capa, Relógio…"
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
