import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Verificando sessão…" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
