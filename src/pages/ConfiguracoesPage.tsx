import { AjustesForm } from '../components/AjustesForm'
import { CategoriasManager } from '../components/CategoriasManager'
import { FornecedoresManager } from '../components/FornecedoresManager'

export function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Ajustes</h2>
      <AjustesForm />
      <CategoriasManager />
      <FornecedoresManager />
    </div>
  )
}
