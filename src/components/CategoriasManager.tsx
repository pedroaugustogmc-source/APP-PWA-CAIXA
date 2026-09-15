import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useCategorias } from '../hooks/useCategorias'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { Card } from './Card'
import { IconEdit } from './icons'

export function CategoriasManager() {
  const { categorias, criar, editar, remover, error } = useCategorias()
  const [nome, setNome] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editandoNome, setEditandoNome] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const { error } = await criar(nome.trim())
    if (!error) setNome('')
  }

  function iniciarEdicao(id: string, nomeAtual: string) {
    setEditandoId(id)
    setEditandoNome(nomeAtual)
  }

  async function salvarEdicao() {
    const nomeTrim = editandoNome.trim()
    if (editandoId && nomeTrim) await editar(editandoId, nomeTrim)
    setEditandoId(null)
  }

  function handleEdicaoKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      salvarEdicao()
    }
    if (e.key === 'Escape') setEditandoId(null)
  }

  return (
    <Card as="section">
      <h3 className="mb-3 font-semibold text-slate-900">Categorias</h3>
      <ul className="mb-3 flex flex-wrap gap-2">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center gap-0.5 rounded-full bg-slate-100 py-1 pr-1 pl-3 text-sm text-slate-700">
            {editandoId === c.id ? (
              <input
                type="text"
                autoFocus
                value={editandoNome}
                onChange={(e) => setEditandoNome(e.target.value)}
                onBlur={salvarEdicao}
                onKeyDown={handleEdicaoKeyDown}
                className="w-24 bg-transparent text-sm text-slate-900 focus:outline-none"
              />
            ) : (
              <>
                {c.nome}
                <button
                  type="button"
                  onClick={() => iniciarEdicao(c.id, c.nome)}
                  aria-label={`Editar ${c.nome}`}
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                >
                  <IconEdit className="h-3 w-3" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => remover(c.id)}
              className="rounded-full p-1 text-base leading-none text-slate-400 transition-colors hover:bg-slate-200 hover:text-loss"
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
          placeholder="Ex.: Eletrônicos, Roupas…"
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
