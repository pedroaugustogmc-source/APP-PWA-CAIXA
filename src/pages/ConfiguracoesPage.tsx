import { AjustesForm } from '../components/AjustesForm'
import { CategoriasManager } from '../components/CategoriasManager'
import { FornecedoresManager } from '../components/FornecedoresManager'
import { DepreciacaoModelosManager } from '../components/DepreciacaoModelosManager'

export function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Ajustes</h2>
      <AjustesForm />
      <CategoriasManager />
      <FornecedoresManager />
      <DepreciacaoModelosManager />
    </div>
  )
}
