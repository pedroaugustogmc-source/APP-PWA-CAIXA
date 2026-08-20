import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <LoadingSpinner label="Verificando sessão…" />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
