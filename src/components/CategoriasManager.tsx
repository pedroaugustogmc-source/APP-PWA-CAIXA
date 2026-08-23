import { useState, type FormEvent } from 'react'
import { useCategorias } from '../hooks/useCategorias'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { Card } from './Card'

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
    <Card as="section">
      <h3 className="mb-3 font-semibold text-slate-900">Categorias</h3>
      <ul className="mb-3 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pr-2 pl-3 text-sm text-slate-700">
            {c.nome}
            <button
              type="button"
              onClick={() => remover(c.id)}
              className="text-slate-400 transition-colors hover:text-loss"
              aria-label={`Remover ${c.nome}`}
            >
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
        <Button type="submit" variant="primary" className="shrink-0">
          Adicionar
        </Button>
      </form>
    </Card>
  )
}
