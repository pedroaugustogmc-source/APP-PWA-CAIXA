import { useState } from 'react'
import { useLojaMembros } from '../hooks/useLojaMembros'
import { Card } from './Card'
import { IconShare } from './icons'

export function CatalogoPublicoLink() {
  const { membros, loading } = useLojaMembros()
  const [copiado, setCopiado] = useState(false)

  const lojaId = membros[0]?.loja_id
  if (loading || !lojaId) return null

  const link = `${window.location.origin}/catalogo/${lojaId}`

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Card as="section">
      <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
        <IconShare className="h-4 w-4" /> Catálogo público
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        Link de vitrine, sem login — mostra só os aparelhos com preço preenchido no cadastro. Compartilhe nas redes ou com clientes.
      </p>
      <div className="flex gap-2">
        <input readOnly value={link} className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" />
        <button
          type="button"
          onClick={copiarLink}
          className="shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          {copiado ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </Card>
  )
}
