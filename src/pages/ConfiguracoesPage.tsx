import { AjustesForm } from '../components/AjustesForm'
import { CategoriasManager } from '../components/CategoriasManager'
import { FornecedoresManager } from '../components/FornecedoresManager'
import { DepreciacaoModelosManager } from '../components/DepreciacaoModelosManager'
import { MembrosLojaManager } from '../components/MembrosLojaManager'
import { CatalogoPublicoLink } from '../components/CatalogoPublicoLink'
import { IntegracoesPanel } from '../components/IntegracoesPanel'

export function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Ajustes</h2>
      <AjustesForm />
      <CatalogoPublicoLink />
      <MembrosLojaManager />
      <CategoriasManager />
      <FornecedoresManager />
      <DepreciacaoModelosManager />
      <IntegracoesPanel />
    </div>
  )
}
