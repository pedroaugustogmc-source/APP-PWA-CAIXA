import { useAuth } from '../hooks/useAuth'
import { useLojaMembros } from '../hooks/useLojaMembros'
import { AjustesForm } from '../components/AjustesForm'
import { CategoriasManager } from '../components/CategoriasManager'
import { FornecedoresManager } from '../components/FornecedoresManager'
import { DepreciacaoModelosManager } from '../components/DepreciacaoModelosManager'
import { MembrosLojaManager } from '../components/MembrosLojaManager'
import { CatalogoPublicoLink } from '../components/CatalogoPublicoLink'
import { IntegracoesPanel } from '../components/IntegracoesPanel'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function ConfiguracoesPage() {
  const { session } = useAuth()
  const { membros, loading } = useLojaMembros()

  if (loading) return <LoadingSpinner />

  // Vendedor convidado só vê o próprio status de acesso — financeiro,
  // fornecedores, catálogo público e integrações são decisão do dono
  // (ver migration 0027: essas tabelas continuam RLS só-dono, então um
  // formulário aqui pra vendedor só falharia silenciosamente no backend).
  const souDono = membros.some((m) => m.user_id === session?.user.id && m.papel === 'dono')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Ajustes</h2>
      {souDono && <AjustesForm />}
      {souDono && <CatalogoPublicoLink />}
      <MembrosLojaManager />
      {souDono && <CategoriasManager />}
      {souDono && <FornecedoresManager />}
      {souDono && <DepreciacaoModelosManager />}
      {souDono && <IntegracoesPanel />}
    </div>
  )
}
