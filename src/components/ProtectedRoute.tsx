import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'
import { Button } from './Button'

export function ProtectedRoute() {
  const { session, loading, lojaStatus, tentarNovamenteLoja } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Verificando sessão…" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  if (lojaStatus === 'preparando' || lojaStatus === 'ociosa') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Preparando sua loja…" />
      </div>
    )
  }

  if (lojaStatus === 'erro') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-loss/25 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-loss">
            Não foi possível preparar sua loja agora. Verifique sua conexão e tente de novo.
          </p>
          <Button variant="primary" fullWidth className="mt-4" onClick={tentarNovamenteLoja}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
